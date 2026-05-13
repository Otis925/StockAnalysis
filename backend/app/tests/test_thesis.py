"""
Thesis generator tests — structural and regression checks.
Requires ANTHROPIC_API_KEY in env. Tests marked with @pytest.mark.live
are skipped in CI unless the env var is present.

Structural tests: verify the prompt formatter and JSON parser work correctly
without calling Claude. Live tests verify Claude returns parseable output.
"""
import json
import os
import pytest
from datetime import date
from unittest.mock import MagicMock, patch

from app.schemas.responses import (
    PeerRecord,
    ScoreComponents,
    ScoreMetadata,
    FundamentalsSnapshot,
    PriceSnapshot,
    EstimatesSnapshot,
    ConvictionComponents,
)
from app.claude.thesis_generator import ThesisGenerator, _format_peer_prompt, _CARD_SCHEMA


# ─── Fixtures ─────────────────────────────────────────────────────────────────

def _make_full_peer() -> PeerRecord:
    return PeerRecord(
        ticker="NVDA",
        company_name="NVIDIA Corporation",
        gics_sector="Information Technology",
        gics_sub_industry="Semiconductors",
        market_cap_usd_mm=1_000_000.0,
        similarity_score=82.5,
        research_priority_score=85.0,
        conviction_score=78.0,
        score_components=ScoreComponents(
            return_correlation=13.0,
            beta_proximity=8.0,
            volatility_similarity=7.5,
            gics_alignment=15.0,
            revenue_mix_cosine=8.0,
            revenue_growth_proximity=9.0,
            margin_profile_distance=8.0,
            leverage_proximity=4.0,
            valuation_proximity=3.5,
        ),
        score_metadata=ScoreMetadata(
            as_of_date=date(2024, 1, 1),
            price_days_available=252,
        ),
        fundamentals=FundamentalsSnapshot(
            revenue_ttm_mm=44_870.0,
            gross_margin=0.727,
            ebitda_margin=0.548,
            fcf_margin=0.430,
            net_debt_ebitda=-1.2,
            revenue_growth_yoy=1.22,
            piotroski_f_score=8,
        ),
        estimates=EstimatesSnapshot(
            ntm_eps_consensus=24.50,
            ntm_eps_revision_3m=0.18,
            ev_ntm_ebitda=35.0,
            analyst_count=42,
            mean_rating=4.7,
            consensus_label="Buy",
            short_interest_pct=0.015,
        ),
        conviction_components=ConvictionComponents(
            eps_revision_momentum=17.5,
            price_momentum=16.0,
            valuation_discount=8.0,
            short_interest=13.5,
            analyst_consensus=14.0,
            piotroski_f_score=8.9,
        ),
        price=PriceSnapshot(
            last_price=495.0,
            price_change_1m=0.12,
            price_change_3m=0.28,
            price_change_6m=0.65,
        ),
    )


# ─── Prompt formatter tests ───────────────────────────────────────────────────

class TestFormatPeerPrompt:
    def test_contains_query_ticker(self):
        peer = _make_full_peer()
        prompt = _format_peer_prompt("AMD", peer)
        assert "QUERY TICKER: AMD" in prompt

    def test_contains_peer_ticker(self):
        peer = _make_full_peer()
        prompt = _format_peer_prompt("AMD", peer)
        assert "PEER TICKER: NVDA" in prompt

    def test_contains_conviction_score(self):
        peer = _make_full_peer()
        prompt = _format_peer_prompt("AMD", peer)
        assert "78.0/100" in prompt

    def test_contains_all_conviction_components(self):
        peer = _make_full_peer()
        prompt = _format_peer_prompt("AMD", peer)
        assert "EPS Revision Momentum" in prompt
        assert "Price Momentum vs Peers" in prompt
        assert "Valuation Discount" in prompt
        assert "Short Interest Score" in prompt
        assert "Analyst Consensus Score" in prompt
        assert "Piotroski Score" in prompt

    def test_contains_schema_instructions(self):
        peer = _make_full_peer()
        prompt = _format_peer_prompt("AMD", peer)
        assert "moat" in prompt
        assert "drawdown_risk" in prompt
        assert "catalyst" in prompt
        assert "exit_criteria" in prompt
        assert "conviction_rationale" in prompt

    def test_contains_fundamentals(self):
        peer = _make_full_peer()
        prompt = _format_peer_prompt("AMD", peer)
        assert "Gross Margin" in prompt
        assert "EBITDA Margin" in prompt
        assert "Piotroski F-Score: 8/9" in prompt

    def test_no_estimates_skips_section(self):
        peer = _make_full_peer()
        peer.estimates = None
        prompt = _format_peer_prompt("AMD", peer)
        assert "ANALYST ESTIMATES" not in prompt

    def test_no_conviction_skips_section(self):
        peer = _make_full_peer()
        peer.conviction_components = None
        peer.conviction_score = None
        prompt = _format_peer_prompt("AMD", peer)
        assert "CONVICTION SCORE" not in prompt


# ─── JSON parser tests ────────────────────────────────────────────────────────

class TestParseCard:
    def _generator(self):
        # Bypass the API key check for unit tests
        with patch.object(ThesisGenerator, "__init__", lambda self: None):
            gen = ThesisGenerator.__new__(ThesisGenerator)
            return gen

    def test_clean_json(self):
        gen = self._generator()
        raw = json.dumps({
            "moat": "Strong IP moat.",
            "drawdown_risk": "Multiple compression risk.",
            "catalyst": "Next earnings beat.",
            "exit_criteria": "EPS revision turns negative.",
            "conviction_rationale": "High EPS revision and low SI.",
        })
        parsed = gen._parse_card(raw)
        assert parsed["moat"] == "Strong IP moat."
        assert "conviction_rationale" in parsed

    def test_json_with_prose_wrapper(self):
        gen = self._generator()
        raw = 'Here is the thesis card:\n{"moat": "M", "drawdown_risk": "D", "catalyst": "C", "exit_criteria": "E", "conviction_rationale": "R"}\nEnd.'
        parsed = gen._parse_card(raw)
        assert parsed["moat"] == "M"

    def test_invalid_json_raises(self):
        gen = self._generator()
        with pytest.raises(ValueError, match="Invalid JSON"):
            gen._parse_card('{"moat": "unclosed}')

    def test_no_json_raises(self):
        gen = self._generator()
        with pytest.raises(ValueError, match="No JSON"):
            gen._parse_card("This is just plain text with no JSON.")


# ─── Card field validation ────────────────────────────────────────────────────

REQUIRED_FIELDS = {"moat", "drawdown_risk", "catalyst", "exit_criteria", "conviction_rationale"}


def _assert_card_structure(card_dict: dict):
    for field in REQUIRED_FIELDS:
        assert field in card_dict, f"Missing field: {field}"
        assert isinstance(card_dict[field], str), f"Field {field} must be a string"
        assert len(card_dict[field]) > 10, f"Field {field} is too short: {card_dict[field]!r}"
        assert len(card_dict[field]) < 1000, f"Field {field} is too long"


class TestCardStructure:
    """Validate that a well-formed synthetic card passes all structural checks."""

    def test_synthetic_card_passes_validation(self):
        synthetic = {
            "moat": "NVIDIA's CUDA ecosystem and HBM memory expertise create substantial switching costs.",
            "drawdown_risk": "AI spending slowdown or China export restrictions could compress multiples sharply.",
            "catalyst": "Next-gen Blackwell GPU ramp driving data center revenue acceleration in H2.",
            "exit_criteria": "NTM EPS revisions turn negative for two consecutive quarters.",
            "conviction_rationale": "EPS revision momentum of 17.5/20 and low short interest (13.5/15) support high conviction.",
        }
        _assert_card_structure(synthetic)


# ─── Live integration tests ───────────────────────────────────────────────────

@pytest.mark.live
@pytest.mark.skipif(
    not os.environ.get("ANTHROPIC_API_KEY"),
    reason="ANTHROPIC_API_KEY not set — skipping live Claude test",
)
class TestThesisGeneratorLive:
    """
    These tests call the real Claude API. Run with:
        ANTHROPIC_API_KEY=sk-... pytest -m live
    """

    @pytest.mark.asyncio
    async def test_generate_card_returns_valid_structure(self):
        gen = ThesisGenerator()
        peer = _make_full_peer()
        card = await gen._generate_card("AMD", peer, rank=1)

        assert card.ticker == "NVDA"
        assert card.rank == 1
        assert len(card.moat) > 10
        assert len(card.drawdown_risk) > 10
        assert len(card.catalyst) > 10
        assert len(card.exit_criteria) > 10
        assert len(card.conviction_rationale) > 10
        assert card.input_token_count is not None
        assert card.output_token_count is not None

    @pytest.mark.asyncio
    async def test_generate_stream_yields_card_then_done(self):
        gen = ThesisGenerator()
        peer = _make_full_peer()
        events = []
        async for event in gen.generate_stream("AMD", [peer], max_peers=1):
            events.append(event)

        assert events[-1].event == "done"
        card_events = [e for e in events if e.event == "card"]
        assert len(card_events) == 1
        assert card_events[0].ticker == "NVDA"
        assert card_events[0].card is not None

    @pytest.mark.asyncio
    async def test_conviction_rationale_references_components(self):
        """Regression: rationale must cite at least one quantitative data point."""
        gen = ThesisGenerator()
        peer = _make_full_peer()
        card = await gen._generate_card("AMD", peer, rank=1)

        rationale = card.conviction_rationale.lower()
        # Check that at least one score component is mentioned
        mentions_data = any(
            term in rationale
            for term in ["eps", "momentum", "short interest", "piotroski", "valuation", "analyst", "/20", "/15", "/10"]
        )
        assert mentions_data, f"Conviction rationale does not reference scoring data: {card.conviction_rationale}"

    @pytest.mark.asyncio
    async def test_output_token_budget(self):
        """Ensure response stays within expected token budget."""
        gen = ThesisGenerator()
        peer = _make_full_peer()
        card = await gen._generate_card("AMD", peer, rank=1)
        # Should be well under max_tokens (600)
        assert card.output_token_count is not None
        assert card.output_token_count < 600
