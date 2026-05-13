"""
Analyst estimates fetcher.
Primary: Financial Modeling Prep (FMP) — requires FMP_API_KEY.
Fallback: Deterministic mock seeded by ticker (local dev, no API needed).

FMP licensing: display allowed under commercial license; no redistribution of
raw estimate data to third parties without separate agreement.
"""
import hashlib
import httpx
import logging
from datetime import date
from typing import Optional

from app.config import settings

log = logging.getLogger(__name__)

FMP_BASE = "https://financialmodelingprep.com/api/v3"


# ─── Mock fetcher ─────────────────────────────────────────────────────────────

def _ticker_seed(ticker: str) -> int:
    return int(hashlib.sha256(ticker.encode()).hexdigest()[:8], 16) % (2**31)


def mock_estimates(ticker: str, as_of: date) -> dict:
    """
    Deterministic synthetic estimates seeded by ticker string.
    Always returns the same values for the same ticker — suitable for
    score stability tests. NOT real market data.
    """
    import numpy as np
    rng = np.random.default_rng(_ticker_seed(ticker))

    # Analyst count: 5-45
    analyst_count = int(rng.integers(5, 46))
    # Rating distribution (biased toward buy for tech names)
    buy_pct = rng.uniform(0.35, 0.85)
    sell_pct = rng.uniform(0.02, 0.15)
    hold_pct = 1.0 - buy_pct - sell_pct
    buy_count = int(round(analyst_count * buy_pct))
    sell_count = int(round(analyst_count * sell_pct))
    hold_count = analyst_count - buy_count - sell_count
    mean_rating = (buy_count * 4.5 + hold_count * 3.0 + sell_count * 1.5) / max(analyst_count, 1)

    # NTM EPS
    base_eps = rng.uniform(1.0, 15.0)
    # EPS revision (3M): -15% to +20%
    revision_pct = rng.uniform(-0.15, 0.20)
    ntm_eps_now = round(float(base_eps), 2)
    ntm_eps_3m_ago = round(float(base_eps / (1 + revision_pct)), 2)

    # NTM EV/EBITDA: vary by "quality" of ticker
    ev_ntm_ebitda = round(float(rng.uniform(8.0, 45.0)), 1)

    # Short interest: 1-20% of float
    short_interest_pct = round(float(rng.uniform(0.01, 0.20)), 4)

    # Price target: simulate as 15-30% above/below current (we don't have current price here)
    price_target_median = None  # omit — requires current price context

    label_map = {(True, False): "Buy", (False, False): "Hold", (False, True): "Sell"}
    consensus_label = label_map.get(
        (buy_count > hold_count and buy_count > sell_count,
         sell_count > buy_count and sell_count > hold_count),
        "Hold",
    )

    return {
        "ticker": ticker,
        "as_of_date": as_of.isoformat(),
        "source": "mock",
        "ntm_eps_consensus": ntm_eps_now,
        "ntm_eps_consensus_3m_ago": ntm_eps_3m_ago,
        "ntm_eps_revision_3m": revision_pct,
        "ntm_revenue_consensus": None,
        "ntm_ebitda_consensus": None,
        "ev_ntm_ebitda": ev_ntm_ebitda,
        "pe_ntm": None,
        "analyst_count": analyst_count,
        "buy_count": buy_count,
        "hold_count": hold_count,
        "sell_count": sell_count,
        "mean_rating": round(mean_rating, 2),
        "consensus_label": consensus_label,
        "short_interest_pct_float": short_interest_pct,
        "price_target_median": price_target_median,
    }


# ─── FMP fetcher ──────────────────────────────────────────────────────────────

class FMPEstimatesFetcher:

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=15.0)

    async def get_estimates(self, ticker: str, as_of: date) -> Optional[dict]:
        try:
            # Analyst recommendations
            rec_resp = await self.client.get(
                f"{FMP_BASE}/analyst-stock-recommendations/{ticker}",
                params={"limit": 1, "apikey": self.api_key},
            )
            rec_data = rec_resp.json()

            # Analyst estimates (annual NTM)
            est_resp = await self.client.get(
                f"{FMP_BASE}/analyst-estimates/{ticker}",
                params={"period": "annual", "limit": 4, "apikey": self.api_key},
            )
            est_data = est_resp.json()

            # Short interest
            si_resp = await self.client.get(
                f"{FMP_BASE}/shares_float/{ticker}",
                params={"apikey": self.api_key},
            )
            si_data = si_resp.json()

            return self._normalize(ticker, as_of, rec_data, est_data, si_data)
        except Exception as exc:
            log.warning("FMP estimates fetch failed for %s: %s", ticker, exc)
            return None

    def _normalize(self, ticker: str, as_of: date, rec: list, est: list, si: list) -> dict:
        # Recommendations
        analyst_count, buy_count, hold_count, sell_count, mean_rating = 0, 0, 0, 0, 3.0
        if rec:
            latest = rec[0]
            buy_count = (latest.get("strongBuy", 0) or 0) + (latest.get("buy", 0) or 0)
            hold_count = latest.get("hold", 0) or 0
            sell_count = (latest.get("sell", 0) or 0) + (latest.get("strongSell", 0) or 0)
            analyst_count = buy_count + hold_count + sell_count
            if analyst_count > 0:
                mean_rating = (buy_count * 4.5 + hold_count * 3.0 + sell_count * 1.5) / analyst_count

        # Estimates — find current and 3-month-ago NTM EPS
        ntm_eps_now, ntm_eps_3m_ago = None, None
        if est:
            ntm_eps_now = est[0].get("estimatedEpsAvg")
            ntm_eps_3m_ago = est[1].get("estimatedEpsAvg") if len(est) > 1 else ntm_eps_now

        rev = None
        if ntm_eps_now and ntm_eps_3m_ago and abs(ntm_eps_3m_ago) > 0.001:
            rev = (ntm_eps_now - ntm_eps_3m_ago) / abs(ntm_eps_3m_ago)

        # Short interest
        si_pct = None
        if si:
            float_shares = si[0].get("floatShares") or si[0].get("outstandingShares")
            short_shares = si[0].get("shortInterest")
            if float_shares and short_shares and float_shares > 0:
                si_pct = short_shares / float_shares

        label = "Buy" if buy_count > hold_count else ("Sell" if sell_count > buy_count else "Hold")

        return {
            "ticker": ticker,
            "as_of_date": as_of.isoformat(),
            "source": "fmp",
            "ntm_eps_consensus": ntm_eps_now,
            "ntm_eps_consensus_3m_ago": ntm_eps_3m_ago,
            "ntm_eps_revision_3m": rev,
            "ev_ntm_ebitda": None,
            "analyst_count": analyst_count,
            "buy_count": buy_count,
            "hold_count": hold_count,
            "sell_count": sell_count,
            "mean_rating": round(mean_rating, 2),
            "consensus_label": label,
            "short_interest_pct_float": si_pct,
            "price_target_median": None,
        }


# ─── Factory ──────────────────────────────────────────────────────────────────

async def get_estimates_for_tickers(
    tickers: list[str],
    as_of: date,
) -> dict[str, dict]:
    """
    Returns estimates dict keyed by ticker.
    Uses FMP if key configured, otherwise deterministic mock.
    """
    if settings.estimates_source == "fmp" and settings.fmp_api_key:
        import asyncio
        fetcher = FMPEstimatesFetcher(settings.fmp_api_key)
        tasks = {t: fetcher.get_estimates(t, as_of) for t in tickers}
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        out = {}
        for ticker, result in zip(tickers, results):
            if isinstance(result, dict) and result:
                out[ticker] = result
            else:
                log.warning("FMP failed for %s, using mock", ticker)
                out[ticker] = mock_estimates(ticker, as_of)
        return out
    else:
        return {t: mock_estimates(t, as_of) for t in tickers}
