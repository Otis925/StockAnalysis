"""
/api/portfolio — portfolio overlap analysis.

Given a list of portfolio tickers, finds stocks that consistently appear
as high-confidence peers across multiple holdings. Useful for identifying
shared thematic exposures and hidden concentration risk.

Algorithm:
  1. Run similarity scoring for each portfolio ticker vs. universe
  2. For each candidate peer, compute: avg RPS across queries + count of queries it appears in
  3. "Overlap score" = avg_rps * sqrt(appears_in / n_queries)  (rewards breadth + quality)
  4. Return top N candidates sorted by overlap score
"""
import asyncio
import logging
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import numpy as np

from app.database import get_db
from app.models.universe import UniverseMember
from app.models.fundamentals import Fundamentals
from app.models.price import PriceBar
from app.scoring.similarity import SimilarityEngine, _params_hash
from app.scoring.conviction import ConvictionEngine
from app.data.estimates_fetcher import get_estimates_for_tickers
from app.schemas.requests import PeerSearchRequest
from app.api.peers import _load_prices, _load_fundamentals, _member_to_dict
from app.schemas.responses import EstimatesSnapshot

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

_sim_engine = SimilarityEngine()
_conv_engine = ConvictionEngine()


class PortfolioRequest(BaseModel):
    tickers: list[str]
    watchlist_size: int = 10         # peers to return
    use_analyst_estimates: bool = True

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one ticker required.")
        if len(v) > 20:
            raise ValueError("Maximum 20 portfolio tickers.")
        return [t.upper().strip() for t in v]

    @field_validator("watchlist_size")
    @classmethod
    def validate_size(cls, v: int) -> int:
        if v < 1 or v > 50:
            raise ValueError("watchlist_size must be 1–50.")
        return v


class OverlapPeer(BaseModel):
    ticker: str
    company_name: str
    gics_sector: Optional[str]
    gics_sub_industry: Optional[str]
    market_cap_usd_mm: Optional[float]
    overlap_score: float              # 0-100 composite breadth+quality
    avg_rps: float                    # average Research Priority Score across queries
    appears_in: int                   # how many of your holdings have this as a top peer
    n_queries: int                    # total holdings scored
    per_holding_rps: dict[str, float] # {query_ticker: rps}
    # Snapshot metrics
    ebitda_margin: Optional[float]
    revenue_growth_yoy: Optional[float]
    piotroski_f_score: Optional[int]
    ntm_eps_revision_3m: Optional[float]
    consensus_label: Optional[str]


class PortfolioResponse(BaseModel):
    query_tickers: list[str]
    not_found: list[str]
    overlap_peers: list[OverlapPeer]
    watchlist_size: int
    computation_ms: int


@router.post("", response_model=PortfolioResponse)
async def portfolio_overlap(
    body: PortfolioRequest,
    db: AsyncSession = Depends(get_db),
):
    import time
    t_start = time.time()
    as_of = date.today()

    # ── Validate tickers ───────────────────────────────────────────────────────
    found, not_found = [], []
    for t in body.tickers:
        member = await db.get(UniverseMember, t)
        if member:
            found.append(t)
        else:
            not_found.append(t)

    if not found:
        raise HTTPException(status_code=404, detail=f"None of the tickers found in universe: {body.tickers}")

    # ── Load data once (shared across all queries) ────────────────────────────
    universe_result = await db.execute(
        select(UniverseMember).where(UniverseMember.is_active == True)
    )
    universe_members = [_member_to_dict(m) for m in universe_result.scalars().all()]
    all_tickers = [m["ticker"] for m in universe_members]

    price_data, price_metadata = await _load_prices(db, all_tickers, as_of)
    spy_prices = price_data.get("SPY", np.array([]))
    fundamentals_data, fundamentals_metadata = await _load_fundamentals(db, all_tickers, as_of)

    # ── Run similarity for each portfolio ticker ───────────────────────────────
    # Use watchlist_size*3 internally to capture more candidates for overlap analysis
    internal_size = min(50, body.watchlist_size * 5)
    peer_rps_by_query: dict[str, dict[str, float]] = {}  # query → {peer → rps}

    for query_ticker in found:
        query_member = await db.get(UniverseMember, query_ticker)
        req = PeerSearchRequest(
            ticker=query_ticker,
            watchlist_size=internal_size,
            region="US",
            use_transcripts=False,
            use_analyst_estimates=body.use_analyst_estimates,
        )
        try:
            result = _sim_engine.compute(
                request=req,
                query_info=_member_to_dict(query_member),
                universe_members=universe_members,
                price_data=price_data,
                spy_prices=spy_prices,
                fundamentals_data=fundamentals_data,
                price_metadata=price_metadata,
                fundamentals_metadata=fundamentals_metadata,
            )

            if body.use_analyst_estimates:
                peer_tickers = [p.ticker for p in result.peers]
                estimates = await get_estimates_for_tickers(peer_tickers, as_of)
                result.peers = _conv_engine.compute(result.peers, estimates)
                result.peers = _conv_engine.update_rps(result.peers, estimates)

            peer_rps_by_query[query_ticker] = {
                p.ticker: p.research_priority_score
                for p in result.peers
                # exclude other portfolio tickers from results
                if p.ticker not in found
            }
        except Exception as exc:
            log.warning("Portfolio similarity failed for %s: %s", query_ticker, exc)
            peer_rps_by_query[query_ticker] = {}

    # ── Aggregate: compute overlap score per candidate peer ───────────────────
    n_queries = len(found)
    candidate_rps: dict[str, dict[str, float]] = {}  # peer → {query: rps}

    for query_ticker, peer_map in peer_rps_by_query.items():
        for peer, rps in peer_map.items():
            if peer not in candidate_rps:
                candidate_rps[peer] = {}
            candidate_rps[peer][query_ticker] = rps

    # ── Load final estimates for all candidates ───────────────────────────────
    all_candidates = list(candidate_rps.keys())
    all_estimates = await get_estimates_for_tickers(all_candidates, as_of) if body.use_analyst_estimates else {}

    # ── Build OverlapPeer records ─────────────────────────────────────────────
    overlap_peers: list[OverlapPeer] = []
    member_map = {m["ticker"]: m for m in universe_members}

    for peer_ticker, query_rps in candidate_rps.items():
        appears_in = len(query_rps)
        avg_rps = sum(query_rps.values()) / appears_in

        # Overlap score: avg_rps * breadth_factor (rewards appearing in more holdings)
        breadth = float(appears_in) / float(n_queries)
        overlap = round(avg_rps * (0.5 + 0.5 * breadth), 1)

        mem = member_map.get(peer_ticker, {})
        fund = fundamentals_data.get(peer_ticker, {})
        est = all_estimates.get(peer_ticker, {})

        overlap_peers.append(OverlapPeer(
            ticker=peer_ticker,
            company_name=mem.get("company_name", peer_ticker),
            gics_sector=mem.get("gics_sector"),
            gics_sub_industry=mem.get("gics_sub_industry"),
            market_cap_usd_mm=mem.get("market_cap_usd_mm"),
            overlap_score=overlap,
            avg_rps=round(avg_rps, 1),
            appears_in=appears_in,
            n_queries=n_queries,
            per_holding_rps={q: round(r, 1) for q, r in query_rps.items()},
            ebitda_margin=fund.get("ebitda_margin"),
            revenue_growth_yoy=fund.get("revenue_growth_yoy"),
            piotroski_f_score=fund.get("piotroski_f_score"),
            ntm_eps_revision_3m=est.get("ntm_eps_revision_3m"),
            consensus_label=est.get("consensus_label"),
        ))

    overlap_peers.sort(key=lambda p: p.overlap_score, reverse=True)

    return PortfolioResponse(
        query_tickers=found,
        not_found=not_found,
        overlap_peers=overlap_peers[:body.watchlist_size],
        watchlist_size=body.watchlist_size,
        computation_ms=int((time.time() - t_start) * 1000),
    )
