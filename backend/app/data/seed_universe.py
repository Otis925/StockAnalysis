"""
Seed the universe table with S&P 500 constituents.
Run: python -m app.data.seed_universe
"""
import asyncio
import logging
from datetime import date
from sqlalchemy import text, insert, update
from app.database import sync_engine, Base
from app.models.universe import UniverseMember
from app.data.universe_loader import UniverseLoader

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


async def seed():
    loader = UniverseLoader()
    log.info("Fetching universe members...")
    members = await loader.fetch_sp500_constituents()
    log.info("Fetched %d members", len(members))

    from sqlalchemy.orm import Session
    with Session(sync_engine) as session:
        for m in members:
            existing = session.get(UniverseMember, m["ticker"])
            if existing:
                existing.company_name = m["company_name"]
                existing.gics_sector = m.get("gics_sector")
                existing.gics_sub_industry = m.get("gics_sub_industry")
                existing.is_active = True
                existing.last_updated = date.today()
            else:
                session.add(UniverseMember(
                    ticker=m["ticker"],
                    company_name=m["company_name"],
                    exchange=m.get("exchange"),
                    gics_sector=m.get("gics_sector"),
                    gics_industry_group=m.get("gics_industry_group"),
                    gics_industry=m.get("gics_industry"),
                    gics_sub_industry=m.get("gics_sub_industry"),
                    market_cap_usd_mm=m.get("market_cap_usd_mm"),
                    is_active=True,
                    added_date=date.today(),
                    last_updated=date.today(),
                ))
        session.commit()
    log.info("Seeded %d universe members", len(members))


if __name__ == "__main__":
    asyncio.run(seed())
