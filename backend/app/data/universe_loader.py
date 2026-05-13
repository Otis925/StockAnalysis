"""
Universe loader: fetches S&P 500 (and optionally Russell 3000) constituent lists
with GICS classifications. Uses Wikipedia for S&P 500 (free, for dev) and
a bundled static file for GICS mappings.
"""
import httpx
import logging
import re
from datetime import date
from typing import Optional

log = logging.getLogger(__name__)


class UniverseLoader:

    async def fetch_sp500_constituents(self) -> list[dict]:
        """
        Fetches S&P 500 constituents from Wikipedia.
        For production, replace with Polygon.io /v3/reference/tickers?index=SPX.
        Returns list of dicts with ticker, company_name, gics_sector, gics_sub_industry.
        """
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                resp = await client.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "parse",
                        "page": "List_of_S%26P_500_companies",
                        "prop": "wikitext",
                        "format": "json",
                    }
                )
                data = resp.json()
                wikitext = data.get("parse", {}).get("wikitext", {}).get("*", "")
                return self._parse_sp500_wikitext(wikitext)
        except Exception as exc:
            log.error("Wikipedia S&P 500 fetch failed: %s", exc)
            return self._get_fallback_universe()

    def _parse_sp500_wikitext(self, wikitext: str) -> list[dict]:
        """Parse MediaWiki table format for S&P 500 constituents."""
        members = []
        # Pattern matches table rows: | TICKER || Company || GICS Sector || ...
        row_pattern = re.compile(
            r'\|\s*\[\[([A-Z.]{1,6})\]\]\s*\|\|\s*([^\|]+?)\s*\|\|\s*([^\|]+?)\s*\|\|\s*([^\|]+?)\s*\|',
            re.MULTILINE,
        )
        for match in row_pattern.finditer(wikitext):
            ticker = match.group(1).strip().replace(".", "-")
            company = match.group(2).strip()
            sector = match.group(3).strip()
            sub_industry = match.group(4).strip()

            if not re.match(r"^[A-Z\-]{1,6}$", ticker):
                continue

            members.append({
                "ticker": ticker,
                "company_name": company,
                "exchange": "NYSE/NASDAQ",
                "gics_sector": sector if sector else None,
                "gics_industry_group": None,
                "gics_industry": None,
                "gics_sub_industry": sub_industry if sub_industry else None,
                "market_cap_usd_mm": None,
                "is_active": True,
                "added_date": None,
            })

        if len(members) < 100:
            log.warning("Parsed only %d members from Wikipedia, using fallback", len(members))
            return self._get_fallback_universe()

        log.info("Loaded %d S&P 500 members from Wikipedia", len(members))
        return members

    def _get_fallback_universe(self) -> list[dict]:
        """Curated fallback list covering all GICS sectors (60 tickers)."""
        return [
            # Information Technology
            {"ticker": "AAPL", "company_name": "Apple Inc", "gics_sector": "Information Technology", "gics_sub_industry": "Technology Hardware, Storage & Peripherals"},
            {"ticker": "MSFT", "company_name": "Microsoft Corporation", "gics_sector": "Information Technology", "gics_sub_industry": "Systems Software"},
            {"ticker": "NVDA", "company_name": "NVIDIA Corporation", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductors"},
            {"ticker": "AMD", "company_name": "Advanced Micro Devices", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductors"},
            {"ticker": "INTC", "company_name": "Intel Corporation", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductors"},
            {"ticker": "AVGO", "company_name": "Broadcom Inc", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductors"},
            {"ticker": "QCOM", "company_name": "Qualcomm Inc", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductors"},
            {"ticker": "MRVL", "company_name": "Marvell Technology", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductors"},
            {"ticker": "MU", "company_name": "Micron Technology", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductors"},
            {"ticker": "TXN", "company_name": "Texas Instruments", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductors"},
            {"ticker": "AMAT", "company_name": "Applied Materials", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductor Materials & Equipment"},
            {"ticker": "LRCX", "company_name": "Lam Research", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductor Materials & Equipment"},
            {"ticker": "KLAC", "company_name": "KLA Corporation", "gics_sector": "Information Technology", "gics_sub_industry": "Semiconductor Materials & Equipment"},
            {"ticker": "ADBE", "company_name": "Adobe Inc", "gics_sector": "Information Technology", "gics_sub_industry": "Application Software"},
            {"ticker": "CRM", "company_name": "Salesforce Inc", "gics_sector": "Information Technology", "gics_sub_industry": "Application Software"},
            {"ticker": "NOW", "company_name": "ServiceNow Inc", "gics_sector": "Information Technology", "gics_sub_industry": "Application Software"},
            {"ticker": "ORCL", "company_name": "Oracle Corporation", "gics_sector": "Information Technology", "gics_sub_industry": "Systems Software"},
            {"ticker": "IBM", "company_name": "IBM Corporation", "gics_sector": "Information Technology", "gics_sub_industry": "IT Consulting & Other Services"},
            {"ticker": "CSCO", "company_name": "Cisco Systems", "gics_sector": "Information Technology", "gics_sub_industry": "Communications Equipment"},
            {"ticker": "ACN", "company_name": "Accenture plc", "gics_sector": "Information Technology", "gics_sub_industry": "IT Consulting & Other Services"},
            # Communication Services
            {"ticker": "GOOGL", "company_name": "Alphabet Inc Class A", "gics_sector": "Communication Services", "gics_sub_industry": "Interactive Media & Services"},
            {"ticker": "META", "company_name": "Meta Platforms Inc", "gics_sector": "Communication Services", "gics_sub_industry": "Interactive Media & Services"},
            {"ticker": "NFLX", "company_name": "Netflix Inc", "gics_sector": "Communication Services", "gics_sub_industry": "Movies & Entertainment"},
            {"ticker": "DIS", "company_name": "Walt Disney Co", "gics_sector": "Communication Services", "gics_sub_industry": "Movies & Entertainment"},
            {"ticker": "T", "company_name": "AT&T Inc", "gics_sector": "Communication Services", "gics_sub_industry": "Integrated Telecommunication Services"},
            {"ticker": "VZ", "company_name": "Verizon Communications", "gics_sector": "Communication Services", "gics_sub_industry": "Integrated Telecommunication Services"},
            # Consumer Discretionary
            {"ticker": "AMZN", "company_name": "Amazon.com Inc", "gics_sector": "Consumer Discretionary", "gics_sub_industry": "Internet & Direct Marketing Retail"},
            {"ticker": "TSLA", "company_name": "Tesla Inc", "gics_sector": "Consumer Discretionary", "gics_sub_industry": "Automobile Manufacturers"},
            {"ticker": "HD", "company_name": "Home Depot Inc", "gics_sector": "Consumer Discretionary", "gics_sub_industry": "Home Improvement Retail"},
            {"ticker": "MCD", "company_name": "McDonald's Corp", "gics_sector": "Consumer Discretionary", "gics_sub_industry": "Restaurants"},
            {"ticker": "NKE", "company_name": "Nike Inc", "gics_sector": "Consumer Discretionary", "gics_sub_industry": "Footwear"},
            {"ticker": "SBUX", "company_name": "Starbucks Corp", "gics_sector": "Consumer Discretionary", "gics_sub_industry": "Restaurants"},
            # Consumer Staples
            {"ticker": "WMT", "company_name": "Walmart Inc", "gics_sector": "Consumer Staples", "gics_sub_industry": "Hypermarkets & Super Centers"},
            {"ticker": "PG", "company_name": "Procter & Gamble", "gics_sector": "Consumer Staples", "gics_sub_industry": "Household Products"},
            {"ticker": "KO", "company_name": "Coca-Cola Co", "gics_sector": "Consumer Staples", "gics_sub_industry": "Soft Drinks & Non-alcoholic Beverages"},
            {"ticker": "PEP", "company_name": "PepsiCo Inc", "gics_sector": "Consumer Staples", "gics_sub_industry": "Soft Drinks & Non-alcoholic Beverages"},
            {"ticker": "COST", "company_name": "Costco Wholesale", "gics_sector": "Consumer Staples", "gics_sub_industry": "Hypermarkets & Super Centers"},
            # Healthcare
            {"ticker": "UNH", "company_name": "UnitedHealth Group", "gics_sector": "Health Care", "gics_sub_industry": "Managed Health Care"},
            {"ticker": "JNJ", "company_name": "Johnson & Johnson", "gics_sector": "Health Care", "gics_sub_industry": "Pharmaceuticals"},
            {"ticker": "LLY", "company_name": "Eli Lilly and Co", "gics_sector": "Health Care", "gics_sub_industry": "Pharmaceuticals"},
            {"ticker": "ABBV", "company_name": "AbbVie Inc", "gics_sector": "Health Care", "gics_sub_industry": "Pharmaceuticals"},
            {"ticker": "MRK", "company_name": "Merck & Co", "gics_sector": "Health Care", "gics_sub_industry": "Pharmaceuticals"},
            {"ticker": "TMO", "company_name": "Thermo Fisher Scientific", "gics_sector": "Health Care", "gics_sub_industry": "Life Sciences Tools & Services"},
            # Financials
            {"ticker": "JPM", "company_name": "JPMorgan Chase & Co", "gics_sector": "Financials", "gics_sub_industry": "Diversified Banks"},
            {"ticker": "BAC", "company_name": "Bank of America", "gics_sector": "Financials", "gics_sub_industry": "Diversified Banks"},
            {"ticker": "WFC", "company_name": "Wells Fargo & Co", "gics_sector": "Financials", "gics_sub_industry": "Diversified Banks"},
            {"ticker": "GS", "company_name": "Goldman Sachs Group", "gics_sector": "Financials", "gics_sub_industry": "Investment Banking & Brokerage"},
            {"ticker": "MS", "company_name": "Morgan Stanley", "gics_sector": "Financials", "gics_sub_industry": "Investment Banking & Brokerage"},
            {"ticker": "BRK-B", "company_name": "Berkshire Hathaway B", "gics_sector": "Financials", "gics_sub_industry": "Multi-line Insurance"},
            # Industrials
            {"ticker": "CAT", "company_name": "Caterpillar Inc", "gics_sector": "Industrials", "gics_sub_industry": "Construction Machinery & Heavy Trucks"},
            {"ticker": "DE", "company_name": "Deere & Company", "gics_sector": "Industrials", "gics_sub_industry": "Agricultural & Farm Machinery"},
            {"ticker": "BA", "company_name": "Boeing Co", "gics_sector": "Industrials", "gics_sub_industry": "Aerospace & Defense"},
            {"ticker": "RTX", "company_name": "RTX Corporation", "gics_sector": "Industrials", "gics_sub_industry": "Aerospace & Defense"},
            {"ticker": "HON", "company_name": "Honeywell International", "gics_sector": "Industrials", "gics_sub_industry": "Industrial Conglomerates"},
            # Energy
            {"ticker": "XOM", "company_name": "Exxon Mobil Corp", "gics_sector": "Energy", "gics_sub_industry": "Integrated Oil & Gas"},
            {"ticker": "CVX", "company_name": "Chevron Corporation", "gics_sector": "Energy", "gics_sub_industry": "Integrated Oil & Gas"},
            {"ticker": "COP", "company_name": "ConocoPhillips", "gics_sector": "Energy", "gics_sub_industry": "Oil & Gas Exploration & Production"},
            # Materials
            {"ticker": "LIN", "company_name": "Linde plc", "gics_sector": "Materials", "gics_sub_industry": "Industrial Gases"},
            {"ticker": "APD", "company_name": "Air Products & Chemicals", "gics_sector": "Materials", "gics_sub_industry": "Industrial Gases"},
            # Real Estate
            {"ticker": "PLD", "company_name": "Prologis Inc", "gics_sector": "Real Estate", "gics_sub_industry": "Industrial REITs"},
            {"ticker": "AMT", "company_name": "American Tower Corp", "gics_sector": "Real Estate", "gics_sub_industry": "Specialized REITs"},
            # Utilities
            {"ticker": "NEE", "company_name": "NextEra Energy", "gics_sector": "Utilities", "gics_sub_industry": "Electric Utilities"},
            {"ticker": "DUK", "company_name": "Duke Energy Corp", "gics_sector": "Utilities", "gics_sub_industry": "Electric Utilities"},
            # SPY benchmark (not a peer result candidate, used for beta)
            {"ticker": "SPY", "company_name": "SPDR S&P 500 ETF", "gics_sector": "_benchmark", "gics_sub_industry": None},
        ]
