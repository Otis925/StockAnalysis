"""
Unit tests for ConvictionEngine — all 6 components plus rescaling logic.
Uses entirely synthetic data; no API calls, no DB, no filesystem.
"""
import pytest
from app.scoring.conviction import (
    ConvictionEngine,
    _percentile_rank,
    _score_eps_revision,
    _score_price_momentum,
    _score_valuation_discount,
    _score_short_interest,
    _score_analyst_consensus,
    _score_piotroski,
)
from app.schemas.responses import (
    PeerRecord,
    ScoreComponents,
    ScoreMetadata,
    FundamentalsSnapshot,
    PriceSnapshot,
    ConvictionComponents,
)
from datetime import date


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_peer(
    ticker: str,
    similarity_score: float = 70.0,
    piotroski: int = 6,
    price_1m: float = 0.05,
    price_3m: float = 0.10,
    price_6m: float = 0.15,
    last_price: float = 100.0,
) -> PeerRecord:
    return PeerRecord(
        ticker=ticker,
        company_name=f"Company {ticker}",
        gics_sector="Technology",
        similarity_score=similarity_score,
        research_priority_score=similarity_score,
        score_components=ScoreComponents(
            return_correlation=10.0,
            beta_proximity=7.0,
            volatility_similarity=7.0,
            gics_alignment=15.0,
            revenue_mix_cosine=7.0,
            revenue_growth_proximity=7.0,
            margin_profile_distance=7.0,
            leverage_proximity=4.0,
            valuation_proximity=4.0,
        ),
        score_metadata=ScoreMetadata(
            as_of_date=date(2024, 1, 1),
            price_days_available=252,
        ),
        fundamentals=FundamentalsSnapshot(piotroski_f_score=piotroski),
        price=PriceSnapshot(
            last_price=last_price,
            price_change_1m=price_1m,
            price_change_3m=price_3m,
            price_change_6m=price_6m,
        ),
    )


def _make_estimates(ticker: str, **overrides) -> dict:
    defaults = {
        "ticker": ticker,
        "ntm_eps_revision_3m": 0.05,
        "ev_ntm_ebitda": 15.0,
        "short_interest_pct_float": 0.05,
        "mean_rating": 4.0,
        "analyst_count": 15,
    }
    defaults.update(overrides)
    return defaults


# ─── Percentile rank ──────────────────────────────────────────────────────────

class TestPercentileRank:
    def test_single_value(self):
        assert _percentile_rank(5.0, [5.0]) == 0.5

    def test_empty_returns_half(self):
        assert _percentile_rank(5.0, []) == 0.5

    def test_bottom_of_range(self):
        # Value is the minimum — should be near 0
        pct = _percentile_rank(1.0, [1.0, 2.0, 3.0, 4.0, 5.0])
        assert pct == pytest.approx(0.1, abs=0.01)

    def test_top_of_range(self):
        pct = _percentile_rank(5.0, [1.0, 2.0, 3.0, 4.0, 5.0])
        assert pct == pytest.approx(0.9, abs=0.01)

    def test_middle_value(self):
        pct = _percentile_rank(3.0, [1.0, 2.0, 3.0, 4.0, 5.0])
        assert pct == pytest.approx(0.5, abs=0.01)

    def test_ties_midrank(self):
        # Three equal values — midrank should be 0.5 each
        pct = _percentile_rank(3.0, [3.0, 3.0, 3.0])
        assert pct == pytest.approx(0.5, abs=0.01)

    def test_output_in_unit_interval(self):
        import random
        vals = [random.uniform(-10, 10) for _ in range(20)]
        for v in vals:
            pct = _percentile_rank(v, vals)
            assert 0.0 <= pct <= 1.0


# ─── EPS revision ─────────────────────────────────────────────────────────────

class TestEpsRevision:
    def test_none_when_missing(self):
        assert _score_eps_revision("AAPL", {}) is None

    def test_highest_revision_scores_near_20(self):
        estimates = {
            "AAPL": {"ntm_eps_revision_3m": 0.20},
            "MSFT": {"ntm_eps_revision_3m": -0.10},
            "GOOG": {"ntm_eps_revision_3m": -0.05},
        }
        score = _score_eps_revision("AAPL", estimates)
        assert score is not None
        assert score >= 15.0

    def test_lowest_revision_scores_near_0(self):
        estimates = {
            "AAPL": {"ntm_eps_revision_3m": 0.20},
            "MSFT": {"ntm_eps_revision_3m": -0.20},
        }
        score = _score_eps_revision("MSFT", estimates)
        assert score is not None
        assert score <= 5.0

    def test_winsorized_at_bounds(self):
        # Extreme values should be clipped to ±0.5
        estimates = {
            "A": {"ntm_eps_revision_3m": 2.0},  # clips to 0.5
            "B": {"ntm_eps_revision_3m": -2.0},  # clips to -0.5
        }
        score_a = _score_eps_revision("A", estimates)
        score_b = _score_eps_revision("B", estimates)
        assert score_a is not None
        assert score_b is not None
        assert score_a > score_b

    def test_returns_in_range(self):
        estimates = {
            "A": {"ntm_eps_revision_3m": 0.10},
            "B": {"ntm_eps_revision_3m": 0.05},
            "C": {"ntm_eps_revision_3m": -0.05},
        }
        for t in ["A", "B", "C"]:
            s = _score_eps_revision(t, estimates)
            assert s is not None
            assert 0.0 <= s <= 20.0


# ─── Price momentum ───────────────────────────────────────────────────────────

class TestPriceMomentum:
    def _make_peers(self):
        return [
            _make_peer("AAPL", price_1m=0.10, price_3m=0.15, price_6m=0.20),
            _make_peer("MSFT", price_1m=0.02, price_3m=0.05, price_6m=0.08),
            _make_peer("GOOG", price_1m=-0.05, price_3m=-0.08, price_6m=-0.10),
        ]

    def test_best_momentum_scores_highest(self):
        peers = self._make_peers()
        score_aapl = _score_price_momentum("AAPL", peers)
        score_goog = _score_price_momentum("GOOG", peers)
        assert score_aapl is not None
        assert score_goog is not None
        assert score_aapl > score_goog

    def test_missing_ticker_returns_none(self):
        peers = self._make_peers()
        assert _score_price_momentum("UNKNOWN", peers) is None

    def test_returns_in_range(self):
        peers = self._make_peers()
        for ticker in ["AAPL", "MSFT", "GOOG"]:
            s = _score_price_momentum(ticker, peers)
            assert s is not None
            assert 0.0 <= s <= 20.0

    def test_no_price_data_returns_none(self):
        # Peers with all None prices
        peers = [
            PeerRecord(
                ticker="A",
                company_name="A",
                similarity_score=50.0,
                research_priority_score=50.0,
                score_components=ScoreComponents(
                    return_correlation=0, beta_proximity=0, volatility_similarity=0,
                    gics_alignment=0, revenue_mix_cosine=0, revenue_growth_proximity=0,
                    margin_profile_distance=0, leverage_proximity=0, valuation_proximity=0,
                ),
                score_metadata=ScoreMetadata(as_of_date=date(2024, 1, 1), price_days_available=0),
                fundamentals=FundamentalsSnapshot(),
                price=PriceSnapshot(price_change_1m=None, price_change_3m=None, price_change_6m=None),
            )
        ]
        assert _score_price_momentum("A", peers) is None


# ─── Valuation discount ───────────────────────────────────────────────────────

class TestValuationDiscount:
    def test_cheapest_scores_highest(self):
        peers = [_make_peer("A"), _make_peer("B"), _make_peer("C")]
        estimates = {
            "A": {"ev_ntm_ebitda": 8.0},   # cheapest
            "B": {"ev_ntm_ebitda": 15.0},
            "C": {"ev_ntm_ebitda": 30.0},  # most expensive
        }
        score_a = _score_valuation_discount("A", peers, estimates)
        score_c = _score_valuation_discount("C", peers, estimates)
        assert score_a is not None and score_c is not None
        assert score_a > score_c

    def test_none_when_insufficient_data(self):
        peers = [_make_peer("A")]
        estimates = {"A": {"ev_ntm_ebitda": 15.0}}
        # Need at least 2 peers with data
        assert _score_valuation_discount("A", peers, estimates) is None

    def test_none_when_no_estimate(self):
        peers = [_make_peer("A"), _make_peer("B")]
        estimates = {}
        assert _score_valuation_discount("A", peers, estimates) is None

    def test_returns_in_range(self):
        peers = [_make_peer("A"), _make_peer("B"), _make_peer("C")]
        estimates = {
            "A": {"ev_ntm_ebitda": 10.0},
            "B": {"ev_ntm_ebitda": 20.0},
            "C": {"ev_ntm_ebitda": 30.0},
        }
        for t in ["A", "B", "C"]:
            s = _score_valuation_discount(t, peers, estimates)
            assert s is not None
            assert 0.0 <= s <= 20.0


# ─── Short interest ───────────────────────────────────────────────────────────

class TestShortInterest:
    def test_low_si_scores_highest(self):
        estimates = {
            "A": {"short_interest_pct_float": 0.02},
            "B": {"short_interest_pct_float": 0.15},
        }
        score_a = _score_short_interest("A", estimates)
        score_b = _score_short_interest("B", estimates)
        assert score_a is not None and score_b is not None
        assert score_a > score_b

    def test_none_when_missing(self):
        assert _score_short_interest("A", {}) is None

    def test_returns_in_range(self):
        estimates = {
            "A": {"short_interest_pct_float": 0.05},
            "B": {"short_interest_pct_float": 0.20},
        }
        for t in ["A", "B"]:
            s = _score_short_interest(t, estimates)
            assert s is not None
            assert 0.0 <= s <= 15.0


# ─── Analyst consensus ────────────────────────────────────────────────────────

class TestAnalystConsensus:
    def test_strong_buy_scores_near_15(self):
        estimates = {"A": {"mean_rating": 5.0}}
        s = _score_analyst_consensus("A", estimates)
        assert s == pytest.approx(15.0, abs=0.01)

    def test_sell_scores_near_0(self):
        estimates = {"A": {"mean_rating": 1.0}}
        s = _score_analyst_consensus("A", estimates)
        assert s == pytest.approx(0.0, abs=0.01)

    def test_neutral_when_no_coverage(self):
        s = _score_analyst_consensus("A", {})
        assert s == pytest.approx(7.5, abs=0.01)

    def test_returns_in_range(self):
        for rating in [1.0, 2.5, 3.0, 4.0, 5.0]:
            estimates = {"A": {"mean_rating": rating}}
            s = _score_analyst_consensus("A", estimates)
            assert s is not None
            assert 0.0 <= s <= 15.0


# ─── Piotroski ────────────────────────────────────────────────────────────────

class TestPiotroski:
    def test_score_9_gives_10(self):
        peer = _make_peer("A", piotroski=9)
        assert _score_piotroski(peer) == pytest.approx(10.0, abs=0.01)

    def test_score_0_gives_0(self):
        peer = _make_peer("A", piotroski=0)
        assert _score_piotroski(peer) == pytest.approx(0.0, abs=0.01)

    def test_score_5_gives_half(self):
        peer = _make_peer("A", piotroski=5)
        expected = 10.0 * 5 / 9
        assert _score_piotroski(peer) == pytest.approx(expected, abs=0.01)

    def test_none_when_missing(self):
        peer = _make_peer("A")
        peer.fundamentals.piotroski_f_score = None
        assert _score_piotroski(peer) is None


# ─── ConvictionEngine integration ─────────────────────────────────────────────

class TestConvictionEngine:
    def _make_peer_set(self):
        peers = [
            _make_peer("AAPL", similarity_score=80.0, piotroski=8, price_1m=0.10),
            _make_peer("MSFT", similarity_score=75.0, piotroski=6, price_1m=0.02),
            _make_peer("GOOG", similarity_score=70.0, piotroski=4, price_1m=-0.05),
        ]
        estimates = {
            "AAPL": _make_estimates("AAPL", ntm_eps_revision_3m=0.15, ev_ntm_ebitda=20.0, mean_rating=4.5),
            "MSFT": _make_estimates("MSFT", ntm_eps_revision_3m=0.05, ev_ntm_ebitda=25.0, mean_rating=4.0),
            "GOOG": _make_estimates("GOOG", ntm_eps_revision_3m=-0.05, ev_ntm_ebitda=30.0, mean_rating=3.5),
        }
        return peers, estimates

    def test_all_peers_get_conviction_scores(self):
        eng = ConvictionEngine()
        peers, estimates = self._make_peer_set()
        result = eng.compute(peers, estimates)
        for p in result:
            assert p.conviction_score is not None
            assert 0.0 <= p.conviction_score <= 100.0

    def test_conviction_components_populated(self):
        eng = ConvictionEngine()
        peers, estimates = self._make_peer_set()
        result = eng.compute(peers, estimates)
        for p in result:
            assert p.conviction_components is not None

    def test_rescaling_sums_to_100_max(self):
        eng = ConvictionEngine()
        peers, estimates = self._make_peer_set()
        result = eng.compute(peers, estimates)
        for p in result:
            # All components available, so max_possible = 100
            # Score must be in [0, 100]
            assert p.conviction_score <= 100.0

    def test_rps_updated_after_conviction(self):
        eng = ConvictionEngine()
        peers, estimates = self._make_peer_set()
        peers = eng.compute(peers, estimates)
        peers = eng.update_rps(peers, estimates)
        # RPS should differ from raw similarity score
        for p in peers:
            assert p.research_priority_score != p.similarity_score

    def test_rps_sorts_descending(self):
        eng = ConvictionEngine()
        peers, estimates = self._make_peer_set()
        peers = eng.compute(peers, estimates)
        peers = eng.update_rps(peers, estimates)
        rps_scores = [p.research_priority_score for p in peers]
        assert rps_scores == sorted(rps_scores, reverse=True)

    def test_missing_estimates_partial_score(self):
        eng = ConvictionEngine()
        peers = [_make_peer("A"), _make_peer("B")]
        # No estimates at all
        estimates = {}
        result = eng.compute(peers, estimates)
        for p in result:
            # Should still get a score from price momentum and piotroski
            assert p.conviction_score is not None

    def test_single_peer_gets_percentile_half(self):
        """Single peer in set → all percentile scores are 0.5 → expected mid-scores."""
        eng = ConvictionEngine()
        peers = [_make_peer("SOLO")]
        estimates = {"SOLO": _make_estimates("SOLO")}
        result = eng.compute(peers, estimates)
        assert result[0].conviction_score is not None
        cc = result[0].conviction_components
        # EPS revision: 0.5 percentile → 10.0
        assert cc.eps_revision_momentum == pytest.approx(10.0, abs=0.01)
        # Short interest: inverted, 0.5 percentile → 7.5
        assert cc.short_interest == pytest.approx(7.5, abs=0.01)

    def test_conviction_score_stable_same_input(self):
        """Same input must always produce the same score (deterministic)."""
        eng = ConvictionEngine()
        peers_a, estimates = self._make_peer_set()
        peers_b, _ = self._make_peer_set()
        result_a = eng.compute(peers_a, estimates)
        result_b = eng.compute(peers_b, estimates)
        for a, b in zip(result_a, result_b):
            assert a.conviction_score == b.conviction_score
