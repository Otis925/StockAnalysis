"""
/api/peers — primary peer search endpoint.
Orchestrates: cache check → data load → scoring → cache store → response.
"""
import logging
import json
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

_limiter = Limiter(key_func=get_remote_address)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.models.universe import UniverseMember
from app.models.fundamentals import Fundamentals
from app.models.price import PriceBar
from app.schemas.requests import PeerSearchRequest
from app.schemas.responses import PeerSearchResponse
from app.scoring.similarity import SimilarityEngine, _params_hash
from app.scoring.conviction import ConvictionEngine
from app.scoring.semantic import build_semantic_engine
from app.data.estimates_fetcher import get_estimates_for_tickers
from app.cache.redis_client import cache_get, cache_set, peers_cache_key
from app.data.price_fetcher import get_price_fetcher
from app.config import settings
from app.schemas.responses import EstimatesSnapshot
import numpy as np

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/peers", tags=["peers"])

engine = SimilarityEngine()
_conv_engine = ConvictionEngine()


@router.post("", response_model=PeerSearchResponse)
@_limiter.limit("20/minute")
async def search_peers(
    http_request: Request,
    request: PeerSearchRequest,
    db: AsyncSession = Depends(get_db),
) -> PeerSearchResponse:
    as_of = request.as_of_date or date.today()
    params_hash = _params_hash(request)
    cache_key = peers_cache_key(request.ticker, as_of.isoformat(), params_hash)

    # ── Cache check ────────────────────────────────────────────────────────────
    cached = await cache_get(cache_key)
    if cached:
        log.info("Cache hit: %s", cache_key)
        result = PeerSearchResponse(**cached)
        result.cached = True
        return result

    # ── Validate query ticker is in universe ───────────────────────────────────
    query_member = await db.get(UniverseMember, request.ticker)
    if not query_member:
        raise HTTPException(
            status_code=404,
            detail=f"Ticker '{request.ticker}' not found in coverage universe. "
                   f"Try /api/universe/search?q={request.ticker} for suggestions.",
        )

    # ── Load full universe ─────────────────────────────────────────────────────
    universe_result = await db.execute(
        select(UniverseMember).where(UniverseMember.is_active == True)
    )
    universe_members_orm = universe_result.scalars().all()
    universe_members = [_member_to_dict(m) for m in universe_members_orm]

    all_tickers = [m["ticker"] for m in universe_members]

    # ── Fetch price data ───────────────────────────────────────────────────────
    # Prefer DB cache first, then live fetch for missing tickers
    price_data, price_metadata = await _load_prices(db, all_tickers, as_of)

    spy_prices = price_data.get("SPY", np.array([]))
    if len(spy_prices) < 63:
        # Live fetch SPY as fallback
        fetcher = get_price_fetcher()
        start = as_of - timedelta(days=365)
        spy_arr = await fetcher.fetch_adj_closes("SPY", start, as_of)
        if spy_arr is not None:
            spy_prices = spy_arr

    # ── Load fundamentals ──────────────────────────────────────────────────────
    fundamentals_data, fundamentals_metadata = await _load_fundamentals(
        db, all_tickers, as_of
    )

    # ── Semantic similarity (optional) ─────────────────────────────────────────
    semantic_scores = None
    if request.use_transcripts:
        try:
            sem_engine = await build_semantic_engine(universe_members)
            semantic_scores = sem_engine.get_all_scores_for_query(request.ticker)
            log.info("Semantic scores computed for %d peers", len(semantic_scores))
        except Exception as exc:
            log.warning("Semantic engine failed, proceeding without: %s", exc)

    # ── Run scoring engine ─────────────────────────────────────────────────────
    query_info = _member_to_dict(query_member)

    result = engine.compute(
        request=request,
        query_info=query_info,
        universe_members=universe_members,
        price_data=price_data,
        spy_prices=spy_prices,
        fundamentals_data=fundamentals_data,
        price_metadata=price_metadata,
        fundamentals_metadata=fundamentals_metadata,
        semantic_scores=semantic_scores,
    )

    # ── Conviction scoring (Phase 2) ───────────────────────────────────────────
    if request.use_analyst_estimates:
        peer_tickers = [p.ticker for p in result.peers]
        estimates = await get_estimates_for_tickers(peer_tickers, as_of)

        # Attach estimates snapshot to each peer for display
        for peer in result.peers:
            est = estimates.get(peer.ticker, {})
            if est:
                peer.estimates = EstimatesSnapshot(
                    ntm_eps_consensus=est.get("ntm_eps_consensus"),
                    ntm_eps_revision_3m=est.get("ntm_eps_revision_3m"),
                    ev_ntm_ebitda=est.get("ev_ntm_ebitda"),
                    analyst_count=est.get("analyst_count"),
                    mean_rating=est.get("mean_rating"),
                    consensus_label=est.get("consensus_label"),
                    short_interest_pct=est.get("short_interest_pct_float"),
                    price_target_median=est.get("price_target_median"),
                )

        result.peers = _conv_engine.compute(result.peers, estimates)
        result.peers = _conv_engine.update_rps(result.peers, estimates)
        result.conviction_enabled = True

    # ── Cache result ───────────────────────────────────────────────────────────
    await cache_set(cache_key, result.model_dump(), ttl=settings.score_cache_ttl)

    return result


async def _load_prices(
    db: AsyncSession,
    tickers: list[str],
    as_of: date,
) -> tuple[dict[str, np.ndarray], dict[str, dict]]:
    """
    Load adj close arrays from DB for all tickers.
    Returns (price_dict, metadata_dict).
    Missing tickers are fetched live and stored.
    """
    start_date = as_of - timedelta(days=400)

    result = await db.execute(
        select(PriceBar)
        .where(
            and_(
                PriceBar.ticker.in_(tickers),
                PriceBar.date >= start_date,
                PriceBar.date <= as_of,
            )
        )
        .order_by(PriceBar.ticker, PriceBar.date)
    )
    bars = result.scalars().all()

    # Group by ticker
    from collections import defaultdict
    ticker_bars: dict[str, list] = defaultdict(list)
    for bar in bars:
        ticker_bars[bar.ticker].append(bar.adj_close)

    price_data = {}
    price_metadata = {}
    missing_tickers = []

    for ticker in tickers:
        closes = ticker_bars.get(ticker, [])
        if len(closes) >= 63:
            price_data[ticker] = np.array(closes, dtype=np.float64)
            price_metadata[ticker] = {"days_available": len(closes)}
        else:
            missing_tickers.append(ticker)

    # Live fetch missing tickers
    if missing_tickers:
        log.info("Live fetching prices for %d missing tickers", len(missing_tickers))
        fetcher = get_price_fetcher()
        start = as_of - timedelta(days=400)

        # Batch fetch in groups of 50 to avoid timeout
        batch_size = 50
        for i in range(0, len(missing_tickers), batch_size):
            batch = missing_tickers[i:i + batch_size]
            fetched = await fetcher.fetch_many(batch, start, as_of)
            for ticker, closes_arr in fetched.items():
                if len(closes_arr) >= 63:
                    price_data[ticker] = closes_arr
                    price_metadata[ticker] = {"days_available": len(closes_arr)}
                    # Store to DB for future requests
                    await _store_prices_to_db(db, ticker, closes_arr, start, as_of)

        await db.commit()

    return price_data, price_metadata


async def _store_prices_to_db(
    db: AsyncSession,
    ticker: str,
    closes: np.ndarray,
    start: date,
    end: date,
) -> None:
    """Store fetched prices to DB. Skips existing rows."""
    try:
        import pandas as pd
        dates = pd.bdate_range(start=start, end=end, freq="B")
        n = min(len(dates), len(closes))
        # Match arrays from the end (most recent alignment)
        dates_trimmed = dates[-n:]
        closes_trimmed = closes[-n:]

        existing_result = await db.execute(
            select(PriceBar.date).where(
                and_(PriceBar.ticker == ticker, PriceBar.date >= start, PriceBar.date <= end)
            )
        )
        existing_dates = {r[0] for r in existing_result.fetchall()}

        new_bars = []
        for dt, close in zip(dates_trimmed, closes_trimmed):
            d = dt.date()
            if d not in existing_dates:
                new_bars.append(PriceBar(
                    ticker=ticker,
                    date=d,
                    close=float(close),
                    adj_close=float(close),
                    source="yfinance",
                ))

        if new_bars:
            db.add_all(new_bars)
    except Exception as exc:
        log.warning("Failed to store prices for %s: %s", ticker, exc)


async def _load_fundamentals(
    db: AsyncSession,
    tickers: list[str],
    as_of: date,
) -> tuple[dict[str, dict], dict[str, dict]]:
    """
    Load most recent fundamentals with filed_date <= as_of (point-in-time).
    Returns (fundamentals_dict, metadata_dict).
    """
    # Get most recent filing per ticker with filed_date <= as_of
    result = await db.execute(
        select(Fundamentals)
        .where(
            and_(
                Fundamentals.ticker.in_(tickers),
                Fundamentals.filed_date <= as_of,
            )
        )
        .order_by(Fundamentals.ticker, Fundamentals.filed_date.desc())
    )
    all_fundamentals = result.scalars().all()

    # Keep only the most recent per ticker
    seen = set()
    fundamentals_data = {}
    fundamentals_metadata = {}

    for f in all_fundamentals:
        if f.ticker not in seen:
            seen.add(f.ticker)
            fundamentals_data[f.ticker] = _fundamentals_to_dict(f)
            fundamentals_metadata[f.ticker] = {
                "period_end": f.period_end,
                "filed_date": f.filed_date,
            }

    return fundamentals_data, fundamentals_metadata


def _member_to_dict(m: UniverseMember) -> dict:
    return {
        "ticker": m.ticker,
        "company_name": m.company_name,
        "exchange": m.exchange,
        "cik": m.cik,
        "sic_code": m.sic_code,
        "gics_sector": m.gics_sector,
        "gics_industry_group": m.gics_industry_group,
        "gics_industry": m.gics_industry,
        "gics_sub_industry": m.gics_sub_industry,
        "market_cap_usd_mm": m.market_cap_usd_mm,
        "is_active": m.is_active,
    }


def _fundamentals_to_dict(f: Fundamentals) -> dict:
    return {
        "source": f.source,
        "revenue_ttm": f.revenue_ttm,
        "gross_profit_ttm": f.gross_profit_ttm,
        "ebitda_ttm": f.ebitda_ttm,
        "net_income_ttm": f.net_income_ttm,
        "operating_cf_ttm": f.operating_cf_ttm,
        "capex_ttm": f.capex_ttm,
        "fcf_ttm": f.fcf_ttm,
        "total_assets": f.total_assets,
        "total_debt": f.total_debt,
        "cash_and_equivalents": f.cash_and_equivalents,
        "net_debt": f.net_debt,
        "shares_outstanding": f.shares_outstanding,
        "gross_margin": f.gross_margin,
        "ebitda_margin": f.ebitda_margin,
        "fcf_margin": f.fcf_margin,
        "net_debt_ebitda": f.net_debt_ebitda,
        "revenue_growth_yoy": f.revenue_growth_yoy,
        "piotroski_f_score": f.piotroski_f_score,
        "segment_revenue_mix": f.segment_revenue_mix,
    }
