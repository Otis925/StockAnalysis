"""
SimilarityEngine: orchestrates all 10 score components.
Semantic similarity (component 10, 10 pts) is enabled when use_transcripts=True.
"""
import time
import hashlib
import json
import numpy as np
import pandas as pd
from datetime import date, timedelta
from typing import Optional

from app.scoring.components import (
    score_return_correlation,
    score_beta_proximity,
    score_volatility_similarity,
    score_gics_alignment,
    score_revenue_mix,
    score_revenue_growth_proximity,
    score_margin_profile,
    score_leverage_proximity,
    score_valuation_proximity,
)
from app.schemas.responses import (
    PeerRecord, ScoreComponents, ScoreMetadata,
    FundamentalsSnapshot, PriceSnapshot, QueryInfo, PeerSearchResponse,
)
from app.schemas.requests import PeerSearchRequest


# Component max points (must sum to 90 without semantic, 100 with)
COMPONENT_MAXES = {
    "return_correlation": 15.0,
    "beta_proximity": 10.0,
    "volatility_similarity": 10.0,
    "gics_alignment": 15.0,
    "revenue_mix_cosine": 10.0,
    "revenue_growth_proximity": 10.0,
    "margin_profile_distance": 10.0,
    "leverage_proximity": 5.0,
    "valuation_proximity": 5.0,
    "semantic_similarity": 10.0,  # Phase 2
}
TOTAL_WITHOUT_SEMANTIC = 90.0
TOTAL_WITH_SEMANTIC = 100.0


def _rescale_to_100(raw_score: float, use_transcripts: bool) -> float:
    """Rescale raw component sum to 0-100 when semantic is disabled."""
    if use_transcripts:
        return raw_score
    return round(raw_score * (100.0 / TOTAL_WITHOUT_SEMANTIC), 1)


def _compute_research_priority_score(
    sim: float,
    analyst_count: int,
) -> float:
    coverage_weight = 1.0 if analyst_count >= 3 else 0.5
    rps = 0.70 * sim + 0.30 * (100.0 * coverage_weight)
    return round(rps, 1)


def _params_hash(request: PeerSearchRequest) -> str:
    payload = {
        "watchlist_size": request.watchlist_size,
        "region": request.region,
        "use_transcripts": request.use_transcripts,
        "sector_lock": request.sector_lock,
        "min_market_cap_usd": request.min_market_cap_usd,
        "max_market_cap_usd": request.max_market_cap_usd,
        "exclude_tickers": sorted(request.exclude_tickers),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]


class SimilarityEngine:
    """
    Stateless engine. Caller provides pre-loaded data dicts.
    All data must be point-in-time safe before being passed in.
    """

    def compute(
        self,
        request: PeerSearchRequest,
        query_info: dict,
        universe_members: list[dict],
        price_data: dict[str, np.ndarray],      # ticker -> adj_close array (chronological)
        spy_prices: np.ndarray,                  # SPY adj_close array
        fundamentals_data: dict[str, dict],      # ticker -> fundamentals dict
        price_metadata: dict[str, dict],         # ticker -> {days_available, last_date}
        fundamentals_metadata: dict[str, dict],  # ticker -> {period_end, filed_date}
        semantic_scores: dict[str, float] | None = None,  # ticker -> 0-10 semantic score
    ) -> PeerSearchResponse:
        t_start = time.time()
        as_of = request.as_of_date or date.today()

        query_ticker = request.ticker
        query_prices = price_data.get(query_ticker, np.array([]))
        query_fund = fundamentals_data.get(query_ticker, {})
        query_gics = {
            "sector": query_info.get("gics_sector"),
            "industry_group": query_info.get("gics_industry_group"),
            "industry": query_info.get("gics_industry"),
            "sub_industry": query_info.get("gics_sub_industry"),
        }

        # Filter candidates
        candidates = [
            m for m in universe_members
            if m["ticker"] != query_ticker
            and m["ticker"] not in request.exclude_tickers
            and m.get("is_active", True)
        ]

        if request.sector_lock:
            candidates = [
                m for m in candidates
                if m.get("gics_sector") == query_info.get("gics_sector")
            ]

        if request.min_market_cap_usd is not None:
            candidates = [
                m for m in candidates
                if (m.get("market_cap_usd_mm") or 0) >= request.min_market_cap_usd
            ]

        if request.max_market_cap_usd is not None:
            candidates = [
                m for m in candidates
                if (m.get("market_cap_usd_mm") or float("inf")) <= request.max_market_cap_usd
            ]

        peers: list[PeerRecord] = []

        for member in candidates:
            ticker = member["ticker"]
            peer_prices = price_data.get(ticker, np.array([]))
            peer_fund = fundamentals_data.get(ticker, {})
            flags: list[str] = []

            if len(peer_prices) < 63:
                continue  # not enough price history — exclude entirely

            # ── Score each component ──────────────────────────────────────────

            s1, f1 = score_return_correlation(peer_prices, query_prices)
            s2, f2 = score_beta_proximity(peer_prices, query_prices, spy_prices)
            s3, f3 = score_volatility_similarity(peer_prices, query_prices)

            peer_gics = {
                "sector": member.get("gics_sector"),
                "industry_group": member.get("gics_industry_group"),
                "industry": member.get("gics_industry"),
                "sub_industry": member.get("gics_sub_industry"),
            }
            s4, f4 = score_gics_alignment(peer_gics, query_gics)

            s5, f5 = score_revenue_mix(
                peer_fund.get("segment_revenue_mix"),
                query_fund.get("segment_revenue_mix"),
                member.get("sic_code"),
                query_info.get("sic_code"),
            )

            s6, f6 = score_revenue_growth_proximity(
                peer_fund.get("revenue_growth_yoy"),
                query_fund.get("revenue_growth_yoy"),
            )

            peer_margins = {
                "gross": peer_fund.get("gross_margin"),
                "ebitda": peer_fund.get("ebitda_margin"),
                "fcf": peer_fund.get("fcf_margin"),
            }
            query_margins = {
                "gross": query_fund.get("gross_margin"),
                "ebitda": query_fund.get("ebitda_margin"),
                "fcf": query_fund.get("fcf_margin"),
            }
            s7, f7 = score_margin_profile(peer_margins, query_margins)

            s8, f8 = score_leverage_proximity(
                peer_fund.get("net_debt_ebitda"),
                query_fund.get("net_debt_ebitda"),
            )

            # Use TTM EV/EBITDA derived locally (Phase 2 adds NTM)
            peer_ev_ebitda = _estimate_ev_ebitda(peer_prices, peer_fund)
            query_ev_ebitda = _estimate_ev_ebitda(query_prices, query_fund)
            s9, f9 = score_valuation_proximity(peer_ev_ebitda, query_ev_ebitda)

            # Component 10: Semantic similarity (optional)
            s10 = semantic_scores.get(ticker) if semantic_scores else None
            if s10 is None and request.use_transcripts:
                flags.append("no_semantic")

            flags = f1 + f2 + f3 + f4 + f5 + f6 + f7 + f8 + f9 + flags

            raw_sim = s1 + s2 + s3 + s4 + s5 + s6 + s7 + s8 + s9
            if s10 is not None:
                raw_sim += s10
            sim_score = _rescale_to_100(raw_sim, use_transcripts=(s10 is not None))

            # Phase 1: no analyst estimates → RPS simplified
            rps = _compute_research_priority_score(sim_score, analyst_count=0)

            # ── Price snapshot ────────────────────────────────────────────────
            price_snap = _compute_price_snapshot(peer_prices)
            pmeta = price_metadata.get(ticker, {})
            fmeta = fundamentals_metadata.get(ticker, {})

            peer_record = PeerRecord(
                ticker=ticker,
                company_name=member.get("company_name", ticker),
                gics_sector=member.get("gics_sector"),
                gics_industry_group=member.get("gics_industry_group"),
                gics_industry=member.get("gics_industry"),
                gics_sub_industry=member.get("gics_sub_industry"),
                market_cap_usd_mm=member.get("market_cap_usd_mm"),
                similarity_score=sim_score,
                research_priority_score=rps,
                score_components=ScoreComponents(
                    return_correlation=s1,
                    beta_proximity=s2,
                    volatility_similarity=s3,
                    gics_alignment=s4,
                    revenue_mix_cosine=s5,
                    revenue_growth_proximity=s6,
                    margin_profile_distance=s7,
                    leverage_proximity=s8,
                    valuation_proximity=s9,
                    semantic_similarity=s10,
                ),
                score_metadata=ScoreMetadata(
                    as_of_date=as_of,
                    price_days_available=pmeta.get("days_available", len(peer_prices)),
                    fundamentals_period_end=fmeta.get("period_end"),
                    fundamentals_filed_date=fmeta.get("filed_date"),
                    fundamentals_source=peer_fund.get("source", "edgar_xbrl"),
                    flags=flags,
                ),
                fundamentals=FundamentalsSnapshot(
                    revenue_ttm_mm=_to_mm(peer_fund.get("revenue_ttm")),
                    gross_margin=peer_fund.get("gross_margin"),
                    ebitda_margin=peer_fund.get("ebitda_margin"),
                    fcf_margin=peer_fund.get("fcf_margin"),
                    net_debt_ebitda=peer_fund.get("net_debt_ebitda"),
                    revenue_growth_yoy=peer_fund.get("revenue_growth_yoy"),
                    piotroski_f_score=peer_fund.get("piotroski_f_score"),
                ),
                price=price_snap,
            )
            peers.append(peer_record)

        # Sort by RPS descending, take top N
        peers.sort(key=lambda p: p.research_priority_score, reverse=True)
        peers = peers[: request.watchlist_size]

        elapsed_ms = int((time.time() - t_start) * 1000)

        return PeerSearchResponse(
            query=QueryInfo(
                ticker=query_ticker,
                company_name=query_info.get("company_name", query_ticker),
                gics_sector=query_info.get("gics_sector"),
                gics_sub_industry=query_info.get("gics_sub_industry"),
                market_cap_usd_mm=query_info.get("market_cap_usd_mm"),
                as_of_date=as_of,
            ),
            peers=peers,
            total_candidates_evaluated=len(candidates),
            watchlist_size=request.watchlist_size,
            computation_ms=elapsed_ms,
            cached=False,
        )


def _estimate_ev_ebitda(prices: np.ndarray, fund: dict) -> Optional[float]:
    """Rough TTM EV/EBITDA from price data and fundamentals. Phase 2 replaces with NTM."""
    if not fund or fund.get("ebitda_ttm") is None or fund["ebitda_ttm"] <= 0:
        return None
    if fund.get("shares_outstanding") is None or len(prices) == 0:
        return None
    market_cap = prices[-1] * fund["shares_outstanding"]
    net_debt = fund.get("net_debt") or 0.0
    ev = market_cap + net_debt
    ebitda = fund["ebitda_ttm"]
    ratio = ev / ebitda
    if ratio < 0 or ratio > 200:
        return None
    return round(ratio, 2)


def _compute_price_snapshot(prices: np.ndarray) -> PriceSnapshot:
    if len(prices) == 0:
        return PriceSnapshot()
    last = float(prices[-1])
    chg_1m = _period_return(prices, 21)
    chg_3m = _period_return(prices, 63)
    chg_6m = _period_return(prices, 126)
    return PriceSnapshot(
        last_price=round(last, 2),
        price_change_1m=chg_1m,
        price_change_3m=chg_3m,
        price_change_6m=chg_6m,
    )


def _period_return(prices: np.ndarray, days: int) -> Optional[float]:
    if len(prices) < days + 1:
        return None
    start = prices[-(days + 1)]
    end = prices[-1]
    if start == 0:
        return None
    return round((end / start) - 1.0, 4)


def _to_mm(val: Optional[float]) -> Optional[float]:
    if val is None:
        return None
    return round(val / 1_000_000, 2)
