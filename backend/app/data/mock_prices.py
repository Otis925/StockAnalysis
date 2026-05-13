"""
Synthetic price generator for local development and testing.
Produces deterministic GBM paths seeded by ticker name.
NOT for production use — never display these prices to users.
"""
import hashlib
import numpy as np
from datetime import date, timedelta


def synthetic_prices(ticker: str, n_days: int = 365, base_price: float = 100.0) -> np.ndarray:
    """
    Generate a deterministic synthetic price series for a ticker.
    Seed is derived from ticker string so NVDA always gets the same path.
    """
    seed = int(hashlib.sha256(ticker.encode()).hexdigest()[:8], 16) % (2**31)
    rng = np.random.default_rng(seed)
    # Randomize drift and vol slightly per ticker
    drift = rng.uniform(-0.0002, 0.0006)
    vol = rng.uniform(0.010, 0.030)
    log_rets = rng.normal(drift, vol, n_days)
    prices = base_price * np.exp(np.cumsum(log_rets))
    return np.insert(prices, 0, base_price).astype(np.float64)


def get_mock_prices_for_universe(tickers: list[str], as_of: date) -> dict[str, np.ndarray]:
    """Return synthetic price arrays for a list of tickers."""
    return {ticker: synthetic_prices(ticker, n_days=365) for ticker in tickers}
