"""
Price fetcher abstraction. YFinanceFetcher for dev; PolygonFetcher for prod.
IMPORTANT: yfinance data must not be displayed to end users — used for
internal score computation only. Display prices fetched from Polygon.
"""
from abc import ABC, abstractmethod
from datetime import date, timedelta
from typing import Optional
import numpy as np
import pandas as pd
import httpx
import logging

from app.config import settings

log = logging.getLogger(__name__)


class PriceFetcher(ABC):
    @abstractmethod
    async def fetch_adj_closes(
        self,
        ticker: str,
        start: date,
        end: date,
    ) -> Optional[np.ndarray]:
        """Return chronological array of adj close prices. None on failure."""
        ...

    @abstractmethod
    async def fetch_many(
        self,
        tickers: list[str],
        start: date,
        end: date,
    ) -> dict[str, np.ndarray]:
        """Batch fetch. Returns {ticker: adj_close_array}."""
        ...


class YFinanceFetcher(PriceFetcher):
    """Free fallback — internal computation only, no display to users."""

    async def fetch_adj_closes(self, ticker: str, start: date, end: date) -> Optional[np.ndarray]:
        try:
            import yfinance as yf
            df = yf.download(
                ticker,
                start=start.isoformat(),
                end=(end + timedelta(days=1)).isoformat(),
                auto_adjust=True,
                progress=False,
                threads=False,
            )
            if df.empty:
                log.warning("yfinance: no data for %s", ticker)
                return None
            closes = df["Close"].dropna().values.flatten()
            return closes.astype(np.float64)
        except Exception as exc:
            log.error("yfinance fetch failed for %s: %s", ticker, exc)
            return None

    async def fetch_many(self, tickers: list[str], start: date, end: date) -> dict[str, np.ndarray]:
        try:
            import yfinance as yf
            raw = yf.download(
                tickers,
                start=start.isoformat(),
                end=(end + timedelta(days=1)).isoformat(),
                auto_adjust=True,
                progress=False,
                threads=True,
                group_by="ticker",
            )
            result = {}
            if len(tickers) == 1:
                closes = raw["Close"].dropna().values.flatten()
                if len(closes) > 0:
                    result[tickers[0]] = closes.astype(np.float64)
                return result

            for ticker in tickers:
                try:
                    col = raw[ticker]["Close"] if ticker in raw.columns.get_level_values(0) else raw["Close"]
                    closes = col.dropna().values.flatten()
                    if len(closes) > 0:
                        result[ticker] = closes.astype(np.float64)
                except Exception:
                    continue
            return result
        except Exception as exc:
            log.error("yfinance batch fetch failed: %s", exc)
            return {}


class PolygonFetcher(PriceFetcher):
    """Production price fetcher using Polygon.io — display-safe."""

    BASE = "https://api.polygon.io/v2/aggs/ticker"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    async def fetch_adj_closes(self, ticker: str, start: date, end: date) -> Optional[np.ndarray]:
        url = f"{self.BASE}/{ticker}/range/1/day/{start.isoformat()}/{end.isoformat()}"
        params = {"adjusted": "true", "sort": "asc", "limit": 1000, "apiKey": self.api_key}
        try:
            resp = await self.client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if not results:
                return None
            closes = np.array([r["c"] for r in results], dtype=np.float64)
            return closes
        except Exception as exc:
            log.error("Polygon fetch failed for %s: %s", ticker, exc)
            return None

    async def fetch_many(self, tickers: list[str], start: date, end: date) -> dict[str, np.ndarray]:
        import asyncio
        tasks = [self.fetch_adj_closes(t, start, end) for t in tickers]
        results = await asyncio.gather(*tasks)
        return {t: r for t, r in zip(tickers, results) if r is not None}


class MockFetcher(PriceFetcher):
    """Deterministic synthetic price generator. Local dev only. Never display to users."""

    async def fetch_adj_closes(self, ticker: str, start: date, end: date) -> Optional[np.ndarray]:
        from app.data.mock_prices import synthetic_prices
        n = (end - start).days
        return synthetic_prices(ticker, n_days=max(n, 100))

    async def fetch_many(self, tickers: list[str], start: date, end: date) -> dict[str, np.ndarray]:
        from app.data.mock_prices import synthetic_prices
        n = (end - start).days
        return {t: synthetic_prices(t, n_days=max(n, 100)) for t in tickers}


def get_price_fetcher() -> PriceFetcher:
    if settings.price_source == "mock":
        return MockFetcher()
    if settings.price_source == "polygon" and settings.polygon_api_key:
        return PolygonFetcher(settings.polygon_api_key)
    return YFinanceFetcher()
