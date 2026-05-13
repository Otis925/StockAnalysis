"""
/api/report/{ticker} — downloadable PDF peer analysis report.
Generates a clean single-page PDF with: query summary, peer table, key metrics,
and disclaimer. No LLM calls — deterministic, fast.
"""
import io
import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.universe import UniverseMember
from app.schemas.requests import PeerSearchRequest
from app.scoring.similarity import SimilarityEngine, _params_hash
from app.scoring.conviction import ConvictionEngine
from app.data.estimates_fetcher import get_estimates_for_tickers
from app.cache.redis_client import cache_get
from app.api.peers import _load_prices, _load_fundamentals, _member_to_dict
from app.schemas.responses import PeerSearchResponse, EstimatesSnapshot

from fpdf import FPDF
import numpy as np
from datetime import timedelta

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/report", tags=["report"])

_sim_engine = SimilarityEngine()
_conv_engine = ConvictionEngine()


def _pct(v, decimals=1):
    if v is None:
        return "—"
    sign = "+" if v >= 0 else ""
    return f"{sign}{v*100:.{decimals}f}%"


def _num(v, decimals=1, suffix=""):
    if v is None:
        return "—"
    return f"{v:.{decimals}f}{suffix}"


def _cap(mm):
    if mm is None:
        return "—"
    if mm >= 1_000_000:
        return f"${mm/1_000_000:.1f}T"
    if mm >= 1_000:
        return f"${mm/1_000:.1f}B"
    return f"${mm:.0f}M"


class PeerReport(FPDF):
    def __init__(self, query_ticker: str, as_of: str):
        super().__init__(orientation="L", unit="mm", format="A4")
        self.query_ticker = query_ticker
        self.as_of = as_of
        self.set_margins(12, 12, 12)
        self.set_auto_page_break(auto=True, margin=12)

    def header(self):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(30, 90, 200)
        self.cell(0, 8, "PeerLens", ln=False)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, f"Peer Analysis Report — {self.query_ticker} — As of {self.as_of}", align="R", ln=True)
        self.set_draw_color(200, 200, 210)
        self.line(12, self.get_y(), self.w - 12, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(150, 150, 150)
        self.cell(0, 4, "Research use only. Not investment advice. Data from public EDGAR filings.", align="C", ln=True)


def _build_pdf(response: PeerSearchResponse) -> bytes:
    query = response.query
    peers = response.peers

    pdf = PeerReport(query_ticker=query.ticker, as_of=str(query.as_of_date))
    pdf.add_page()

    # ── Query summary ──────────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 20, 40)
    pdf.cell(0, 8, f"{query.ticker} — {query.company_name}", ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(80, 80, 100)
    meta_parts = []
    if query.gics_sector:
        meta_parts.append(query.gics_sector)
    if query.gics_sub_industry:
        meta_parts.append(query.gics_sub_industry)
    if query.market_cap_usd_mm:
        meta_parts.append(_cap(query.market_cap_usd_mm))
    pdf.cell(0, 5, " · ".join(meta_parts), ln=True)
    pdf.ln(4)

    # ── Stats row ─────────────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(60, 60, 80)
    stats = [
        ("Peers Evaluated", str(response.total_candidates_evaluated)),
        ("Watchlist Size", str(response.watchlist_size)),
        ("Conviction Scoring", "Enabled" if response.conviction_enabled else "Disabled"),
        ("Methodology", f"v{response.methodology_version}"),
    ]
    col_w = (pdf.w - 24) / len(stats)
    for label, val in stats:
        x = pdf.get_x()
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(120, 120, 140)
        pdf.cell(col_w, 4, label, ln=False)
    pdf.ln(4)
    for label, val in stats:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(30, 30, 60)
        pdf.cell(col_w, 5, val, ln=False)
    pdf.ln(8)

    # ── Peer table ─────────────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(255, 255, 255)
    pdf.set_fill_color(40, 60, 130)

    has_conviction = response.conviction_enabled
    cols = [
        ("#", 8),
        ("Ticker", 18),
        ("Company", 55),
        ("Sector", 40),
        ("Sim", 16),
        ("Conv" if has_conviction else "RPS", 16),
        ("RPS", 16),
        ("Mkt Cap", 22),
        ("EPS Rev" if has_conviction else "3M Ret", 18),
        ("EBITDA Mgn", 22),
    ]
    total_w = sum(c[1] for c in cols)

    for col_name, col_w in cols:
        pdf.cell(col_w, 6, col_name, border=0, fill=True, align="C")
    pdf.ln()

    pdf.set_font("Helvetica", "", 7.5)
    for i, peer in enumerate(peers[:25]):
        row_fill = (i % 2 == 0)
        if row_fill:
            pdf.set_fill_color(242, 244, 252)
            pdf.set_text_color(30, 30, 60)
        else:
            pdf.set_fill_color(255, 255, 255)
            pdf.set_text_color(30, 30, 60)

        f = peer.fundamentals
        e = peer.estimates

        row = [
            (str(i + 1), "C"),
            (peer.ticker, "C"),
            (peer.company_name[:30], "L"),
            ((peer.gics_sub_industry or peer.gics_sector or "—")[:24], "L"),
            (f"{peer.similarity_score:.0f}", "C"),
            (f"{peer.conviction_score:.0f}" if (has_conviction and peer.conviction_score is not None) else f"{peer.research_priority_score:.0f}", "C"),
            (f"{peer.research_priority_score:.0f}", "C"),
            (_cap(peer.market_cap_usd_mm), "R"),
            (_pct(e.ntm_eps_revision_3m) if (has_conviction and e) else _pct(peer.price.price_change_3m), "R"),
            (_pct(f.ebitda_margin), "R"),
        ]

        for (text, align), (_, col_w) in zip(row, cols):
            pdf.cell(col_w, 5, text, border=0, fill=True, align=align)
        pdf.ln()

    pdf.ln(4)

    # ── Conviction legend (if enabled) ────────────────────────────────────────
    if has_conviction:
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(40, 40, 80)
        pdf.cell(0, 5, "Conviction Score Components (peer-relative percentile)", ln=True)
        pdf.set_font("Helvetica", "", 7.5)
        pdf.set_text_color(80, 80, 100)
        pdf.cell(0, 4,
            "EPS Rev Momentum (20) · Price Momentum vs Peers (20) · Valuation Discount (20) · "
            "Short Interest inv. (15) · Analyst Consensus (15) · Piotroski F-Score (10) = 100",
            ln=True
        )
        pdf.ln(2)

    # ── Disclaimer ────────────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "I", 6.5)
    pdf.set_text_color(150, 150, 160)
    pdf.multi_cell(0, 3.5,
        "This report is generated from public data (SEC EDGAR, synthetic price data) for research purposes only. "
        "Similarity and Conviction Scores are systematic, model-based outputs and do not constitute investment advice. "
        "Past performance is not indicative of future results. Always verify data independently."
    )

    buf = io.BytesIO()
    buf.write(pdf.output())
    buf.seek(0)
    return buf.read()


@router.get("/{ticker}")
async def download_report(
    ticker: str,
    watchlist_size: int = 25,
    use_analyst_estimates: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Generate and return a PDF peer analysis report for a ticker."""
    ticker = ticker.upper()
    as_of = date.today()

    query_member = await db.get(UniverseMember, ticker)
    if not query_member:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not in universe.")

    if watchlist_size not in (10, 25, 50):
        watchlist_size = 25

    universe_result = await db.execute(
        select(UniverseMember).where(UniverseMember.is_active == True)
    )
    universe_members = [_member_to_dict(m) for m in universe_result.scalars().all()]
    all_tickers = [m["ticker"] for m in universe_members]

    price_data, price_metadata = await _load_prices(db, all_tickers, as_of)
    spy_prices = price_data.get("SPY", np.array([]))
    fundamentals_data, fundamentals_metadata = await _load_fundamentals(db, all_tickers, as_of)

    from app.schemas.requests import PeerSearchRequest
    req = PeerSearchRequest(
        ticker=ticker,
        watchlist_size=watchlist_size,
        region="US",
        use_transcripts=False,
        use_analyst_estimates=use_analyst_estimates,
        use_legacy_score=False,
        generate_thesis=False,
    )

    peer_response = _sim_engine.compute(
        request=req,
        query_info=_member_to_dict(query_member),
        universe_members=universe_members,
        price_data=price_data,
        spy_prices=spy_prices,
        fundamentals_data=fundamentals_data,
        price_metadata=price_metadata,
        fundamentals_metadata=fundamentals_metadata,
    )

    if use_analyst_estimates:
        peer_tickers = [p.ticker for p in peer_response.peers]
        estimates = await get_estimates_for_tickers(peer_tickers, as_of)
        for peer in peer_response.peers:
            est = estimates.get(peer.ticker, {})
            if est:
                peer.estimates = EstimatesSnapshot(
                    ntm_eps_consensus=est.get("ntm_eps_consensus"),
                    ntm_eps_revision_3m=est.get("ntm_eps_revision_3m"),
                    ev_ntm_ebitda=est.get("ev_ntm_ebitda"),
                    analyst_count=est.get("analyst_count"),
                    mean_rating=est.get("mean_rating"),
                    consensus_label=est.get("consensus_label"),
                    short_interest_pct=est.get("short_interest_pct_float"),
                    price_target_median=est.get("price_target_median"),
                )
        peer_response.peers = _conv_engine.compute(peer_response.peers, estimates)
        peer_response.peers = _conv_engine.update_rps(peer_response.peers, estimates)
        peer_response.conviction_enabled = True

    pdf_bytes = _build_pdf(peer_response)
    filename = f"PeerLens_{ticker}_{as_of.isoformat()}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
