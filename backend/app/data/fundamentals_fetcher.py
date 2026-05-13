"""
EDGAR XBRL fundamentals fetcher.
Uses SEC EDGAR public API — public domain data, no license restrictions.
Point-in-time: all lookups gate on filed_date <= as_of_date.
"""
import httpx
import logging
import asyncio
from datetime import date, timedelta
from typing import Optional

log = logging.getLogger(__name__)

EDGAR_BASE = "https://data.sec.gov/api/xbrl/companyfacts"
EDGAR_COMPANY = "https://data.sec.gov/submissions"
HEADERS = {"User-Agent": "PeerLens research-tool contact@peerlens.dev"}

# Maps EDGAR concept names to our internal fields
CONCEPT_MAP = {
    "Revenues": "revenue",
    "RevenueFromContractWithCustomerExcludingAssessedTax": "revenue",
    "SalesRevenueNet": "revenue",
    "GrossProfit": "gross_profit",
    "OperatingIncomeLoss": "operating_income",
    "NetIncomeLoss": "net_income",
    "Assets": "total_assets",
    "LongTermDebt": "long_term_debt",
    "ShortTermBorrowings": "short_term_debt",
    "CashAndCashEquivalentsAtCarryingValue": "cash",
    "CommonStockSharesOutstanding": "shares_outstanding",
    "NetCashProvidedByUsedInOperatingActivities": "operating_cf",
    "PaymentsToAcquirePropertyPlantAndEquipment": "capex",
    "PaymentsForProceedsFromBusinessesAndInterestInAffiliates": "capex_alt",
}


class EdgarFundamentalsFetcher:

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers=HEADERS,
            follow_redirects=True,
        )

    async def get_cik(self, ticker: str) -> Optional[str]:
        """Look up CIK from SEC company tickers JSON."""
        try:
            resp = await self.client.get(
                "https://www.sec.gov/files/company_tickers.json"
            )
            data = resp.json()
            for entry in data.values():
                if entry.get("ticker", "").upper() == ticker.upper():
                    return str(entry["cik_str"]).zfill(10)
            return None
        except Exception as exc:
            log.error("CIK lookup failed for %s: %s", ticker, exc)
            return None

    async def fetch_company_facts(self, cik: str) -> Optional[dict]:
        url = f"{EDGAR_BASE}/CIK{cik}.json"
        try:
            resp = await self.client.get(url)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            log.error("EDGAR company facts fetch failed CIK %s: %s", cik, exc)
            return None

    def extract_ttm_value(
        self,
        facts: dict,
        concept: str,
        as_of: date,
        form_types: tuple = ("10-K", "10-Q"),
    ) -> tuple[Optional[float], Optional[date], Optional[date]]:
        """
        Extract the most recent filed value for a concept available as of as_of.
        Returns (value, period_end, filed_date).
        Point-in-time: only considers filings with filed <= as_of.
        """
        try:
            us_gaap = facts.get("facts", {}).get("us-gaap", {})
            concept_data = us_gaap.get(concept, {})
            units = concept_data.get("units", {})
            usd_entries = units.get("USD", units.get("shares", []))

            valid = [
                e for e in usd_entries
                if e.get("form") in form_types
                and e.get("filed")
                and date.fromisoformat(e["filed"]) <= as_of
                and e.get("val") is not None
            ]
            if not valid:
                return None, None, None

            # Sort by filed date descending
            valid.sort(key=lambda e: e["filed"], reverse=True)
            best = valid[0]
            return (
                float(best["val"]),
                date.fromisoformat(best["end"]) if best.get("end") else None,
                date.fromisoformat(best["filed"]),
            )
        except Exception:
            return None, None, None

    def compute_ttm(
        self,
        facts: dict,
        concept: str,
        as_of: date,
    ) -> Optional[float]:
        """
        Sum last four quarters (10-Q frames) filed <= as_of, or use
        10-K annual value if that's more recent.
        """
        try:
            us_gaap = facts.get("facts", {}).get("us-gaap", {})
            concept_data = us_gaap.get(concept, {})
            units = concept_data.get("units", {})
            entries = units.get("USD", [])

            quarterly = sorted(
                [
                    e for e in entries
                    if e.get("form") == "10-Q"
                    and e.get("filed")
                    and date.fromisoformat(e["filed"]) <= as_of
                    and e.get("val") is not None
                    and e.get("fp", "").startswith("Q")
                ],
                key=lambda e: e["filed"],
                reverse=True,
            )

            annual = sorted(
                [
                    e for e in entries
                    if e.get("form") == "10-K"
                    and e.get("filed")
                    and date.fromisoformat(e["filed"]) <= as_of
                    and e.get("val") is not None
                ],
                key=lambda e: e["filed"],
                reverse=True,
            )

            # Use last four quarters if we have them
            if len(quarterly) >= 4:
                ttm = sum(e["val"] for e in quarterly[:4])
                return float(ttm)

            # Fallback: most recent annual
            if annual:
                return float(annual[0]["val"])

            return None
        except Exception:
            return None

    async def get_fundamentals(
        self,
        ticker: str,
        cik: str,
        as_of: date,
    ) -> Optional[dict]:
        """
        Returns a dict with standardized fundamental fields.
        All values are point-in-time (filed_date <= as_of).
        """
        facts = await self.fetch_company_facts(cik)
        if not facts:
            return None

        revenue = self._try_concepts(facts, ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"], as_of)
        gross_profit = self.compute_ttm(facts, "GrossProfit", as_of)
        operating_income = self.compute_ttm(facts, "OperatingIncomeLoss", as_of)
        net_income = self.compute_ttm(facts, "NetIncomeLoss", as_of)
        operating_cf = self.compute_ttm(facts, "NetCashProvidedByUsedInOperatingActivities", as_of)
        capex = self.compute_ttm(facts, "PaymentsToAcquirePropertyPlantAndEquipment", as_of)

        # Balance sheet (point-in-time, not TTM)
        total_assets, period_end, filed_date = self.extract_ttm_value(facts, "Assets", as_of, ("10-K", "10-Q"))
        long_term_debt, _, _ = self.extract_ttm_value(facts, "LongTermDebt", as_of, ("10-K", "10-Q"))
        cash, _, _ = self.extract_ttm_value(facts, "CashAndCashEquivalentsAtCarryingValue", as_of, ("10-K", "10-Q"))
        shares, _, _ = self.extract_ttm_value(facts, "CommonStockSharesOutstanding", as_of, ("10-K", "10-Q"))

        # Prior year revenue for growth
        if period_end:
            prior_year_as_of = date(as_of.year - 1, as_of.month, as_of.day)
            revenue_prior = self._try_concepts(facts, ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"], prior_year_as_of)
        else:
            revenue_prior = None

        # Compute derived fields
        net_debt = None
        if long_term_debt is not None and cash is not None:
            net_debt = long_term_debt - cash

        fcf = None
        if operating_cf is not None and capex is not None:
            fcf = operating_cf - capex

        # Margins
        gross_margin = (gross_profit / revenue) if (gross_profit and revenue and revenue > 0) else None
        ebitda_ttm = operating_income  # approximation; Phase 2 adds D&A add-back
        ebitda_margin = (ebitda_ttm / revenue) if (ebitda_ttm and revenue and revenue > 0) else None
        fcf_margin = (fcf / revenue) if (fcf and revenue and revenue > 0) else None

        net_debt_ebitda = None
        if net_debt is not None and ebitda_ttm and ebitda_ttm > 0:
            net_debt_ebitda = net_debt / ebitda_ttm
        elif net_debt is not None and ebitda_ttm and ebitda_ttm < 0:
            net_debt_ebitda = None  # undefined for negative EBITDA

        revenue_growth_yoy = None
        if revenue and revenue_prior and revenue_prior > 0:
            revenue_growth_yoy = (revenue / revenue_prior) - 1.0

        # Piotroski F-Score (simplified — full implementation uses 2-year comparison)
        f_score, piotroski_signals = self._compute_piotroski(
            roa=net_income / total_assets if (net_income and total_assets and total_assets > 0) else None,
            cfo=operating_cf,
            net_income=net_income,
            total_assets=total_assets,
        )

        return {
            "ticker": ticker,
            "source": "edgar_xbrl",
            "period_end": period_end.isoformat() if period_end else None,
            "filed_date": filed_date.isoformat() if filed_date else None,
            "revenue_ttm": revenue,
            "gross_profit_ttm": gross_profit,
            "ebitda_ttm": ebitda_ttm,
            "net_income_ttm": net_income,
            "operating_cf_ttm": operating_cf,
            "capex_ttm": capex,
            "fcf_ttm": fcf,
            "total_assets": total_assets,
            "total_debt": long_term_debt,
            "cash_and_equivalents": cash,
            "net_debt": net_debt,
            "shares_outstanding": shares,
            "gross_margin": gross_margin,
            "ebitda_margin": ebitda_margin,
            "fcf_margin": fcf_margin,
            "net_debt_ebitda": net_debt_ebitda,
            "revenue_growth_yoy": revenue_growth_yoy,
            "piotroski_f_score": f_score,
            **piotroski_signals,
            "segment_revenue_mix": None,  # Phase 2: parse EDGAR segments
        }

    def _try_concepts(self, facts: dict, concepts: list[str], as_of: date) -> Optional[float]:
        for concept in concepts:
            val = self.compute_ttm(facts, concept, as_of)
            if val is not None:
                return val
        return None

    def _compute_piotroski(
        self,
        roa: Optional[float],
        cfo: Optional[float],
        net_income: Optional[float],
        total_assets: Optional[float],
    ) -> tuple[Optional[int], dict]:
        """Partial Piotroski — Phase 1 implements 4 of 9 signals from available data."""
        signals = {}
        score = 0

        if roa is not None:
            s = 1 if roa > 0 else 0
            signals["piotroski_roa_positive"] = s
            score += s
        else:
            signals["piotroski_roa_positive"] = None

        if cfo is not None:
            s = 1 if cfo > 0 else 0
            signals["piotroski_cfo_positive"] = s
            score += s
        else:
            signals["piotroski_cfo_positive"] = None

        if net_income is not None and total_assets is not None and total_assets > 0:
            cfo_roa = cfo / total_assets if cfo else 0
            actual_roa = net_income / total_assets
            s = 1 if cfo_roa > actual_roa else 0  # accruals signal
            signals["piotroski_accruals"] = s
            score += s
        else:
            signals["piotroski_accruals"] = None

        for key in ["piotroski_delta_roa", "piotroski_delta_leverage", "piotroski_delta_liquidity",
                    "piotroski_no_dilution", "piotroski_delta_gross_margin", "piotroski_delta_asset_turnover"]:
            signals[key] = None

        return score if signals else None, signals
