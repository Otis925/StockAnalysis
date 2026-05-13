"""
Nightly price refresh Celery task.
Fetches latest price bars for all universe members and stores to DB.
"""
import asyncio
import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, select

from app.tasks.celery_app import celery
from app.database import sync_engine
from app.models.universe import UniverseMember
from app.models.price import PriceBar
from app.data.price_fetcher import get_price_fetcher
from app.cache.redis_client import cache_delete_pattern

log = logging.getLogger(__name__)


@celery.task(name="app.tasks.price_refresh.refresh_all_prices", bind=True, max_retries=3)
def refresh_all_prices(self):
    """Fetch and store latest prices for all active universe members."""
    log.info("Starting nightly price refresh")
    asyncio.run(_refresh_prices_async())


async def _refresh_prices_async():
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(UniverseMember).where(UniverseMember.is_active == True)
        )
        members = result.scalars().all()
        tickers = [m.ticker for m in members]
        tickers.append("SPY")  # Always refresh benchmark

    end = date.today()
    start = end - timedelta(days=30)  # Only fetch last 30 days incrementally

    fetcher = get_price_fetcher()
    log.info("Fetching prices for %d tickers (%s to %s)", len(tickers), start, end)

    batch_size = 100
    total_stored = 0

    for i in range(0, len(tickers), batch_size):
        batch = tickers[i:i + batch_size]
        price_dict = await fetcher.fetch_many(batch, start, end)

        async with AsyncSessionLocal() as db:
            for ticker, closes in price_dict.items():
                try:
                    n = len(closes)
                    import pandas as pd
                    dates = pd.bdate_range(start=start, end=end, freq="B")[-n:]

                    existing_result = await db.execute(
                        select(PriceBar.date).where(
                            and_(
                                PriceBar.ticker == ticker,
                                PriceBar.date >= start,
                                PriceBar.date <= end,
                            )
                        )
                    )
                    existing = {r[0] for r in existing_result.fetchall()}

                    new_bars = []
                    for dt, close in zip(dates, closes):
                        d = dt.date()
                        if d not in existing:
                            new_bars.append(PriceBar(
                                ticker=ticker,
                                date=d,
                                close=float(close),
                                adj_close=float(close),
                                source="yfinance",
                            ))

                    if new_bars:
                        db.add_all(new_bars)
                        total_stored += len(new_bars)
                except Exception as exc:
                    log.error("Error storing prices for %s: %s", ticker, exc)

            await db.commit()

    # Invalidate all peer score caches after price refresh
    await cache_delete_pattern("peers:*")
    log.info("Price refresh complete. Stored %d new bars. Cache invalidated.", total_stored)
