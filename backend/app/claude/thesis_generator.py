"""
ThesisGenerator: Claude-powered investment thesis cards.
One card per peer, streamed via SSE. LLM output is purely explanatory —
it NEVER modifies or feeds back into conviction/similarity scores.

Card fields:
  moat             — competitive advantage summary
  drawdown_risk    — key downside risks
  catalyst         — near-term price catalyst
  exit_criteria    — conditions that invalidate the thesis
  conviction_rationale — why conviction score is high/low given the data
"""
import json
import logging
from datetime import datetime, timezone
from typing import AsyncIterator

import anthropic

from app.config import settings
from app.schemas.responses import PeerRecord, ThesisCard, ThesisStreamEvent

log = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a systematic equity research assistant. Your role is to write structured,
factual investment thesis cards based strictly on the quantitative data provided.

Rules:
- Ground every statement in the provided metrics. Do not speculate beyond the data.
- Each field must be 1-2 sentences. No lists, no headers, no markdown within fields.
- Avoid filler phrases ("it is worth noting", "importantly", "in conclusion").
- Conviction rationale must explicitly reference at least two conviction score components.
- Tone: institutional, direct, precise. No promotional language.
"""

_CARD_SCHEMA = """\
Respond with a single JSON object with exactly these keys:
{
  "moat": "<1-2 sentences on competitive advantage>",
  "drawdown_risk": "<1-2 sentences on primary downside risk>",
  "catalyst": "<1-2 sentences on near-term price catalyst>",
  "exit_criteria": "<1-2 sentences on what would invalidate this thesis>",
  "conviction_rationale": "<1-2 sentences referencing conviction score components>"
}
Do not include any text outside the JSON object.
"""


def _format_peer_prompt(query_ticker: str, peer: PeerRecord) -> str:
    f = peer.fundamentals
    e = peer.estimates
    cc = peer.conviction_components

    lines = [
        f"QUERY TICKER: {query_ticker}",
        f"PEER TICKER: {peer.ticker} ({peer.company_name})",
        f"GICS: {peer.gics_sector} / {peer.gics_sub_industry}",
        f"Market Cap: ${peer.market_cap_usd_mm:.0f}M" if peer.market_cap_usd_mm else "Market Cap: N/A",
        "",
        "── SIMILARITY SCORE ──",
        f"Overall Similarity: {peer.similarity_score:.1f}/100",
        f"Research Priority Score: {peer.research_priority_score:.1f}/100",
        "",
        "── FINANCIALS (TTM) ──",
        f"Revenue: ${f.revenue_ttm_mm:.0f}M" if f.revenue_ttm_mm else "Revenue: N/A",
        f"Gross Margin: {f.gross_margin*100:.1f}%" if f.gross_margin else "Gross Margin: N/A",
        f"EBITDA Margin: {f.ebitda_margin*100:.1f}%" if f.ebitda_margin else "EBITDA Margin: N/A",
        f"FCF Margin: {f.fcf_margin*100:.1f}%" if f.fcf_margin else "FCF Margin: N/A",
        f"Net Debt/EBITDA: {f.net_debt_ebitda:.1f}x" if f.net_debt_ebitda else "Net Debt/EBITDA: N/A",
        f"Revenue Growth YoY: {f.revenue_growth_yoy*100:.1f}%" if f.revenue_growth_yoy else "Revenue Growth: N/A",
        f"Piotroski F-Score: {f.piotroski_f_score}/9" if f.piotroski_f_score is not None else "Piotroski: N/A",
    ]

    if e:
        lines += [
            "",
            "── ANALYST ESTIMATES ──",
            f"NTM EPS Consensus: ${e.ntm_eps_consensus:.2f}" if e.ntm_eps_consensus else "NTM EPS: N/A",
            f"EPS Revision (3M): {e.ntm_eps_revision_3m*100:+.1f}%" if e.ntm_eps_revision_3m else "EPS Revision: N/A",
            f"EV/NTM EBITDA: {e.ev_ntm_ebitda:.1f}x" if e.ev_ntm_ebitda else "EV/EBITDA: N/A",
            f"Analyst Consensus: {e.consensus_label} ({e.analyst_count} analysts)" if e.analyst_count else f"Consensus: {e.consensus_label or 'N/A'}",
            f"Short Interest: {e.short_interest_pct*100:.1f}% of float" if e.short_interest_pct else "Short Interest: N/A",
        ]

    if cc and peer.conviction_score is not None:
        lines += [
            "",
            "── CONVICTION SCORE ──",
            f"Overall Conviction: {peer.conviction_score:.1f}/100",
            f"EPS Revision Momentum: {cc.eps_revision_momentum:.1f}/20" if cc.eps_revision_momentum is not None else "EPS Revision: N/A",
            f"Price Momentum vs Peers: {cc.price_momentum:.1f}/20" if cc.price_momentum is not None else "Price Momentum: N/A",
            f"Valuation Discount: {cc.valuation_discount:.1f}/20" if cc.valuation_discount is not None else "Valuation Discount: N/A",
            f"Short Interest Score: {cc.short_interest:.1f}/15" if cc.short_interest is not None else "Short Interest: N/A",
            f"Analyst Consensus Score: {cc.analyst_consensus:.1f}/15" if cc.analyst_consensus is not None else "Analyst Consensus: N/A",
            f"Piotroski Score: {cc.piotroski_f_score:.1f}/10" if cc.piotroski_f_score is not None else "Piotroski: N/A",
        ]

    lines.append("")
    lines.append(_CARD_SCHEMA)
    return "\n".join(lines)


class ThesisGenerator:
    """
    Generates streaming thesis cards for a list of PeerRecords.
    Yields ThesisStreamEvent objects as Claude responds.
    """

    def __init__(self):
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not configured")
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    async def generate_stream(
        self,
        query_ticker: str,
        peers: list[PeerRecord],
        max_peers: int = 3,
    ) -> AsyncIterator[ThesisStreamEvent]:
        """
        Streams thesis cards one by one. Yields a 'card' event for each peer,
        an 'error' event if a card fails, and a 'done' event at the end.
        """
        top_peers = peers[:max_peers]

        for rank, peer in enumerate(top_peers, start=1):
            try:
                card = await self._generate_card(query_ticker, peer, rank)
                yield ThesisStreamEvent(
                    event="card",
                    rank=rank,
                    ticker=peer.ticker,
                    card=card,
                )
            except Exception as exc:
                log.warning("Thesis generation failed for %s: %s", peer.ticker, exc)
                yield ThesisStreamEvent(
                    event="error",
                    rank=rank,
                    ticker=peer.ticker,
                    error=str(exc),
                )

        yield ThesisStreamEvent(event="done")

    async def _generate_card(
        self,
        query_ticker: str,
        peer: PeerRecord,
        rank: int,
    ) -> ThesisCard:
        prompt = _format_peer_prompt(query_ticker, peer)

        # Use streaming to get incremental output, collect full text
        full_text = ""
        input_tokens = 0
        output_tokens = 0

        with self.client.messages.stream(
            model=settings.claude_model,
            max_tokens=settings.thesis_max_tokens,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text in stream.text_stream:
                full_text += text

            # Get final usage from the completed message
            final_msg = stream.get_final_message()
            input_tokens = final_msg.usage.input_tokens
            output_tokens = final_msg.usage.output_tokens

        parsed = self._parse_card(full_text)

        return ThesisCard(
            ticker=peer.ticker,
            company_name=peer.company_name,
            rank=rank,
            moat=parsed.get("moat", ""),
            drawdown_risk=parsed.get("drawdown_risk", ""),
            catalyst=parsed.get("catalyst", ""),
            exit_criteria=parsed.get("exit_criteria", ""),
            conviction_rationale=parsed.get("conviction_rationale", ""),
            generated_at=datetime.now(timezone.utc).isoformat(),
            model_version=settings.claude_model,
            input_token_count=input_tokens,
            output_token_count=output_tokens,
        )

    def _parse_card(self, text: str) -> dict:
        """Extract JSON object from Claude response. Tolerates leading/trailing prose."""
        text = text.strip()
        # Find first { and last }
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError(f"No JSON object in response: {text[:200]}")
        json_str = text[start:end]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON in thesis response: {exc}") from exc
