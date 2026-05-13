"""
/api/screen — filter the universe by fundamental/estimate criteria.
Returns ranked results without a query ticker (absolute screening, not peer-relative).

Scoring: simple weighted composite of absolute metrics (not percentile-relative),
so results are comparable across calls.
"""
import logging
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.universe import UniverseMember
from app.models.fundamentals import Fundamentals
from app.data.estimates_fetcher import get_estimates_for_tickers

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/screen", tags=["screen"])


class ScreenRecord(BaseModel):
    ticker: str
    company_name: str
    gics_sector: Optional[str]
    gics_sub_industry: Optional[str]
    market_cap_usd_mm: Optional[float]
    screen_score: float             # 0-100 composite
    # Fundamentals
    revenue_growth_yoy: Optional[float]
    ebitda_margin: Optional[float]
    fcf_margin: Optional[float]
    net_debt_ebitda: Optional[float]
    piotroski_f_score: Optional[int]
    # Estimates
    ntm_eps_revision_3m: Optional[float]
    short_interest_pct: Optional[float]
    consensus_label: Optional[str]
    analyst_count: Optional[int]
    ev_ntm_ebitda: Optional[float]


class ScreenResponse(BaseModel):
    results: list[ScreenRecord]
    total_matched: int
    as_of_date: str


def _screen_score(fund: dict, est: dict) -> float:
    """
    Composite screen score (0–100). Absolute scale — not peer-relative.
    Components (equal weight):
      1. Piotroski F-Score       (0-9 → 0-20 pts)
      2. EPS Revision 3M         (-50% to +50% → 0-20 pts)
      3. Short Interest (inv)    (50% to 0% → 0-20 pts)
      4. Analyst Consensus       (1-5 rating → 0-20 pts)
      5. EBITDA Margin           (0-40% → 0-20 pts)
    """
    total = 0.0
    weight = 0.0

    # Piotroski
    pf = fund.get("piotroski_f_score")
    if pf is not None:
        total += 20.0 * float(pf) / 9.0
        weight += 20.0

    # EPS revision
    rev = est.get("ntm_eps_revision_3m")
    if rev is not None:
        import numpy as np
        rev_clipped = float(np.clip(rev, -0.5, 0.5))
        total += 20.0 * (rev_clipped + 0.5) / 1.0
        weight += 20.0

    # Short interest (inverted)
    si = est.get("short_interest_pct_float")
    if si is not None:
        import numpy as np
        si_clipped = float(np.clip(si, 0.0, 0.50))
        total += 20.0 * (1.0 - si_clipped / 0.50)
        weight += 20.0

    # Analyst consensus (mean_rating 1-5)
    rating = est.get("mean_rating")
    if rating is not None:
        import numpy as np
        r = float(np.clip(rating, 1.0, 5.0))
        total += 20.0 * (r - 1.0) / 4.0
        weight += 20.0

    # EBITDA margin
    em = fund.get("ebitda_margin")
    if em is not None:
        import numpy as np
        total += 20.0 * float(np.clip(em, 0.0, 0.40)) / 0.40
        weight += 20.0

    if weight <= 0:
        return 0.0
    return round(total * (100.0 / weight), 1)


@router.get("", response_model=ScreenResponse)
async def screen_universe(
    sector: Optional[str] = Query(None, description="GICS sector filter"),
    min_market_cap_usd: Optional[float] = Query(None, description="Min market cap (USD millions)"),
    max_market_cap_usd: Optional[float] = Query(None, description="Max market cap (USD millions)"),
    min_screen_score: Optional[float] = Query(None, ge=0, le=100, description="Min composite screen score"),
    max_short_interest: Optional[float] = Query(None, ge=0, le=1, description="Max short interest % of float"),
    consensus: Optional[str] = Query(None, description="Buy | Hold | Sell"),
    min_rev_growth: Optional[float] = Query(None, description="Min YoY revenue growth (e.g. 0.10 = 10%)"),
    min_piotroski: Optional[int] = Query(None, ge=0, le=9, description="Min Piotroski F-Score"),
    min_ebitda_margin: Optional[float] = Query(None, description="Min EBITDA margin (e.g. 0.15 = 15%)"),
    watchlist_size: int = Query(25, ge=5, le=100, description="Max results to return"),
    db: AsyncSession = Depends(get_db),
):
    as_of = date.today()

    # ── Load universe ──────────────────────────────────────────────────────────
    q = select(UniverseMember).where(UniverseMember.is_active == True)
    if sector:
        q = q.where(UniverseMember.gics_sector == sector)
    if min_market_cap_usd is not None:
        q = q.where(UniverseMember.market_cap_usd_mm >= min_market_cap_usd)
    if max_market_cap_usd is not None:
        q = q.where(UniverseMember.market_cap_usd_mm <= max_market_cap_usd)

    result = await db.execute(q)
    members = result.scalars().all()

    # ── Load fundamentals ──────────────────────────────────────────────────────
    tickers = [m.ticker for m in members]
    fund_result = await db.execute(
        select(Fundamentals)
        .where(Fundamentals.ticker.in_(tickers), Fundamentals.filed_date <= as_of)
        .order_by(Fundamentals.ticker, Fundamentals.filed_date.desc())
    )
    all_fund = fund_result.scalars().all()
    fund_map: dict[str, Fundamentals] = {}
    for f in all_fund:
        if f.ticker not in fund_map:
            fund_map[f.ticker] = f

    # ── Load estimates ─────────────────────────────────────────────────────────
    estimates = await get_estimates_for_tickers(tickers, as_of)

    # ── Filter + score ─────────────────────────────────────────────────────────
    records: list[ScreenRecord] = []
    for member in members:
        ticker = member.ticker
        fund = fund_map.get(ticker)
        est = estimates.get(ticker, {})

        fund_dict = {
            "piotroski_f_score": fund.piotroski_f_score if fund else None,
            "ebitda_margin": fund.ebitda_margin if fund else None,
            "revenue_growth_yoy": fund.revenue_growth_yoy if fund else None,
        }

        # Apply filters
        if min_rev_growth is not None:
            if fund_dict.get("revenue_growth_yoy") is None or fund_dict["revenue_growth_yoy"] < min_rev_growth:
                continue
        if min_piotroski is not None:
            if fund_dict.get("piotroski_f_score") is None or fund_dict["piotroski_f_score"] < min_piotroski:
                continue
        if min_ebitda_margin is not None:
            if fund_dict.get("ebitda_margin") is None or fund_dict["ebitda_margin"] < min_ebitda_margin:
                continue
        if max_short_interest is not None:
            si = est.get("short_interest_pct_float")
            if si is None or si > max_short_interest:
                continue
        if consensus:
            if est.get("consensus_label", "").lower() != consensus.lower():
                continue

        score = _screen_score(fund_dict, est)

        if min_screen_score is not None and score < min_screen_score:
            continue

        records.append(ScreenRecord(
            ticker=ticker,
            company_name=member.company_name,
            gics_sector=member.gics_sector,
            gics_sub_industry=member.gics_sub_industry,
            market_cap_usd_mm=member.market_cap_usd_mm,
            screen_score=score,
            revenue_growth_yoy=fund.revenue_growth_yoy if fund else None,
            ebitda_margin=fund.ebitda_margin if fund else None,
            fcf_margin=fund.fcf_margin if fund else None,
            net_debt_ebitda=fund.net_debt_ebitda if fund else None,
            piotroski_f_score=fund.piotroski_f_score if fund else None,
            ntm_eps_revision_3m=est.get("ntm_eps_revision_3m"),
            short_interest_pct=est.get("short_interest_pct_float"),
            consensus_label=est.get("consensus_label"),
            analyst_count=est.get("analyst_count"),
            ev_ntm_ebitda=est.get("ev_ntm_ebitda"),
        ))

    records.sort(key=lambda r: r.screen_score, reverse=True)
    total_matched = len(records)
    records = records[:watchlist_size]

    return ScreenResponse(
        results=records,
        total_matched=total_matched,
        as_of_date=as_of.isoformat(),
    )
