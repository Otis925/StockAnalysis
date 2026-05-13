"""
EDGAR 10-K business description text fetcher.

Primary: SEC EDGAR full-text search API — fetches Item 1 (Business) section text.
Fallback: Synthetic description from company metadata (ticker + GICS).
           Deterministic and consistent; suitable for local dev and scoring tests.

The fetched/generated text is used only for TF-IDF semantic similarity scoring.
It is never displayed to users.
"""
import hashlib
import logging
import re
import httpx
from typing import Optional

log = logging.getLogger(__name__)

EDGAR_SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik}.json"
EDGAR_FILING_URL = "https://www.sec.gov/Archives/edgar/{path}"

_GICS_KEYWORDS = {
    "Information Technology": "software technology cloud computing digital platform data artificial intelligence semiconductor",
    "Health Care": "pharmaceutical biotechnology medical device clinical drug healthcare patient treatment",
    "Financials": "banking financial services insurance asset management lending credit capital markets",
    "Consumer Discretionary": "retail consumer products e-commerce fashion automotive entertainment leisure",
    "Consumer Staples": "food beverage household products grocery distribution consumer packaged goods",
    "Industrials": "manufacturing aerospace defense logistics transportation infrastructure engineering",
    "Energy": "oil gas petroleum exploration production refining renewable energy power",
    "Materials": "chemicals mining metals materials packaging specialty industrial raw",
    "Real Estate": "real estate investment trust property management commercial residential leasing",
    "Communication Services": "media telecommunications wireless broadband internet content streaming advertising",
    "Utilities": "electric power natural gas water utility regulated infrastructure distribution",
}


def _synthetic_description(
    ticker: str,
    company_name: str,
    gics_sector: Optional[str],
    gics_sub_industry: Optional[str],
    sic_code: Optional[str],
) -> str:
    """
    Generate a deterministic synthetic business description from company metadata.
    Used when real 10-K text is unavailable. Never displayed to users.
    """
    sector_kw = _GICS_KEYWORDS.get(gics_sector or "", "business services operations")
    sub = (gics_sub_industry or "").lower().replace("&", "and")
    sic = sic_code or ""

    # Seeded shuffle for some variation per ticker (keeps it deterministic)
    seed = int(hashlib.sha256(ticker.encode()).hexdigest()[:4], 16)
    words = sector_kw.split()
    rotated = words[seed % len(words):] + words[:seed % len(words)]
    extra = " ".join(rotated[:5])

    return (
        f"{company_name} is a company in the {gics_sector or 'diversified'} sector "
        f"operating in {sub or 'general business'} services. "
        f"The company focuses on {extra} activities "
        f"with SIC code {sic or 'N/A'} and delivers value through its core operations."
    )


class EdgarTextFetcher:
    """
    Fetches 10-K Item 1 (Business) section text from EDGAR.
    Returns at most 4000 characters — enough for TF-IDF, cheap on memory.
    """

    HEADERS = {"User-Agent": "PeerLens research-tool contact@example.com"}
    TIMEOUT = 20.0

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=self.TIMEOUT, headers=self.HEADERS)

    async def get_business_description(
        self,
        ticker: str,
        cik: Optional[str],
        company_name: str = "",
        gics_sector: Optional[str] = None,
        gics_sub_industry: Optional[str] = None,
        sic_code: Optional[str] = None,
    ) -> str:
        """
        Returns Item 1 text if EDGAR fetch succeeds; synthetic description otherwise.
        Always returns a non-empty string.
        """
        if cik:
            try:
                text = await self._fetch_item1(cik)
                if text and len(text) > 100:
                    return text[:4000]
            except Exception as exc:
                log.debug("EDGAR text fetch failed for %s: %s", ticker, exc)

        return _synthetic_description(ticker, company_name, gics_sector, gics_sub_industry, sic_code)

    async def _fetch_item1(self, cik: str) -> Optional[str]:
        """Fetch most recent 10-K filing text from EDGAR and extract Item 1 section."""
        cik_padded = cik.zfill(10)
        url = EDGAR_SUBMISSIONS_URL.format(cik=cik_padded)
        resp = await self.client.get(url)
        if resp.status_code != 200:
            return None

        data = resp.json()
        filings = data.get("filings", {}).get("recent", {})
        forms = filings.get("form", [])
        accessions = filings.get("accessionNumber", [])
        primary_docs = filings.get("primaryDocument", [])

        # Find most recent 10-K
        for form, accession, doc in zip(forms, accessions, primary_docs):
            if form == "10-K":
                path = accession.replace("-", "")
                file_url = f"https://www.sec.gov/Archives/edgar/full-index/{accession[:10].split('-')[0]}/{accession}"
                # Use the direct EDGAR viewer URL to get the primary document
                doc_url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{path.replace('-', '')}/{doc}"
                try:
                    doc_resp = await self.client.get(doc_url)
                    if doc_resp.status_code == 200:
                        return self._extract_item1(doc_resp.text)
                except Exception:
                    pass
                break

        return None

    def _extract_item1(self, html: str) -> str:
        """Extract Item 1 Business section text from 10-K HTML."""
        # Strip HTML tags
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()

        # Find Item 1 section boundary
        patterns = [
            r"item\s+1[.\s]+business\b",
            r"item\s+1\b",
        ]
        start = -1
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                start = m.end()
                break

        if start == -1:
            return text[:2000]

        # Find end of Item 1 (start of Item 1A or Item 2)
        end_patterns = [
            r"item\s+1a[.\s]",
            r"item\s+2[.\s]",
        ]
        end = len(text)
        for pat in end_patterns:
            m = re.search(pat, text[start:start + 20000], re.IGNORECASE)
            if m:
                end = start + m.start()
                break

        return text[start:end].strip()


_fetcher_instance: Optional[EdgarTextFetcher] = None


def get_edgar_text_fetcher() -> EdgarTextFetcher:
    global _fetcher_instance
    if _fetcher_instance is None:
        _fetcher_instance = EdgarTextFetcher()
    return _fetcher_instance
