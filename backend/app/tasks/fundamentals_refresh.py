"""
Weekly fundamentals refresh. Fetches EDGAR XBRL data for all universe members.
"""
import asyncio
import logging
from datetime import date
from sqlalchemy import select, and_

from app.tasks.celery_app import celery
from app.models.universe import UniverseMember
from app.models.fundamentals import Fundamentals
from app.data.fundamentals_fetcher import EdgarFundamentalsFetcher

log = logging.getLogger(__name__)
fetcher = EdgarFundamentalsFetcher()


@celery.task(name="app.tasks.fundamentals_refresh.refresh_all_fundamentals")
def refresh_all_fundamentals():
    asyncio.run(_refresh_fundamentals_async())


async def _refresh_fundamentals_async():
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(UniverseMember).where(UniverseMember.is_active == True)
        )
        members = result.scalars().all()

    log.info("Refreshing fundamentals for %d members", len(members))
    today = date.today()

    for member in members:
        try:
            await _refresh_one(member.ticker, member.cik, today)
            await asyncio.sleep(0.1)  # polite crawl rate for EDGAR
        except Exception as exc:
            log.error("Fundamentals refresh failed for %s: %s", member.ticker, exc)

    log.info("Fundamentals refresh complete")


async def _refresh_one(ticker: str, cik: str, as_of: date):
    if not cik:
        cik = await fetcher.get_cik(ticker)
        if not cik:
            log.warning("No CIK found for %s", ticker)
            return

    fund_data = await fetcher.get_fundamentals(ticker, cik, as_of)
    if not fund_data:
        return

    filed_date_str = fund_data.get("filed_date")
    if not filed_date_str:
        return

    filed_date = date.fromisoformat(filed_date_str)
    period_end_str = fund_data.get("period_end")
    period_end = date.fromisoformat(period_end_str) if period_end_str else filed_date

    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        # Check if we already have this filing
        existing = await db.execute(
            select(Fundamentals).where(
                and_(
                    Fundamentals.ticker == ticker,
                    Fundamentals.filed_date == filed_date,
                )
            )
        )
        if existing.scalar_one_or_none():
            return  # Already have this filing

        fund = Fundamentals(
            ticker=ticker,
            period_end=period_end,
            filed_date=filed_date,
            fiscal_year=period_end.year,
            fiscal_quarter=((period_end.month - 1) // 3) + 1,
            source=fund_data.get("source", "edgar_xbrl"),
            revenue_ttm=fund_data.get("revenue_ttm"),
            gross_profit_ttm=fund_data.get("gross_profit_ttm"),
            ebitda_ttm=fund_data.get("ebitda_ttm"),
            net_income_ttm=fund_data.get("net_income_ttm"),
            operating_cf_ttm=fund_data.get("operating_cf_ttm"),
            capex_ttm=fund_data.get("capex_ttm"),
            fcf_ttm=fund_data.get("fcf_ttm"),
            total_assets=fund_data.get("total_assets"),
            total_debt=fund_data.get("total_debt"),
            cash_and_equivalents=fund_data.get("cash_and_equivalents"),
            net_debt=fund_data.get("net_debt"),
            shares_outstanding=fund_data.get("shares_outstanding"),
            gross_margin=fund_data.get("gross_margin"),
            ebitda_margin=fund_data.get("ebitda_margin"),
            fcf_margin=fund_data.get("fcf_margin"),
            net_debt_ebitda=fund_data.get("net_debt_ebitda"),
            revenue_growth_yoy=fund_data.get("revenue_growth_yoy"),
            piotroski_f_score=fund_data.get("piotroski_f_score"),
            piotroski_roa_positive=fund_data.get("piotroski_roa_positive"),
            piotroski_cfo_positive=fund_data.get("piotroski_cfo_positive"),
            piotroski_accruals=fund_data.get("piotroski_accruals"),
            segment_revenue_mix=fund_data.get("segment_revenue_mix"),
        )
        db.add(fund)
        await db.commit()
        log.info("Stored fundamentals for %s (filed %s)", ticker, filed_date)
