"""
Unit tests for similarity score components.
Each test uses deterministic synthetic data — no live API calls.
"""
import numpy as np
import pytest
from app.scoring.components import (
    score_return_correlation,
    score_beta_proximity,
    score_volatility_similarity,
    score_gics_alignment,
    score_revenue_mix,
    score_revenue_growth_proximity,
    score_margin_profile,
    score_leverage_proximity,
    score_valuation_proximity,
)


def make_prices(n=252, drift=0.0001, vol=0.015, seed=42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    log_rets = rng.normal(drift, vol, n)
    prices = 100.0 * np.exp(np.cumsum(log_rets))
    return np.insert(prices, 0, 100.0)


# ─── Component 1 ──────────────────────────────────────────────────────────────

class TestReturnCorrelation:
    def test_identical_prices_max_score(self):
        p = make_prices(seed=1)
        score, flags = score_return_correlation(p, p)
        assert score == pytest.approx(15.0, abs=0.01)
        assert not flags

    def test_anti_correlated_min_score(self):
        p1 = make_prices(seed=1)
        # Mirror: log returns negated → anti-correlated
        log_rets = np.diff(np.log(p1))
        neg_rets = -log_rets
        p2 = 100.0 * np.exp(np.cumsum(neg_rets))
        p2 = np.insert(p2, 0, 100.0)
        score, _ = score_return_correlation(p2, p1)
        assert score < 2.0  # near minimum

    def test_insufficient_data_returns_zero(self):
        p = make_prices(n=30, seed=1)  # < 63 days
        score, flags = score_return_correlation(p, p)
        assert score == 0.0
        assert "insufficient_price_history" in flags

    def test_score_in_valid_range(self):
        for seed in range(10):
            p1 = make_prices(seed=seed)
            p2 = make_prices(seed=seed + 100)
            score, _ = score_return_correlation(p1, p2)
            assert 0.0 <= score <= 15.0


# ─── Component 2 ──────────────────────────────────────────────────────────────

class TestBetaProximity:
    def test_same_beta_max_score(self):
        spy = make_prices(seed=0)
        # peer and query both have ~beta=1 (random walk with same seed)
        p = make_prices(seed=0)
        score, _ = score_beta_proximity(p, p, spy)
        assert score == pytest.approx(10.0, abs=0.5)

    def test_large_beta_diff_zero_score(self):
        spy = make_prices(seed=0)
        # peer: high beta (3x leverage)
        rets_spy = np.diff(np.log(spy))
        rets_high = rets_spy * 4.0  # beta ~4
        p_high = 100.0 * np.exp(np.cumsum(rets_high))
        p_high = np.insert(p_high, 0, 100.0)
        p_low = make_prices(seed=1, vol=0.005)  # low beta

        score, _ = score_beta_proximity(p_high, p_low, spy)
        assert score == 0.0  # |delta_beta| >= 1.5

    def test_score_in_valid_range(self):
        spy = make_prices(seed=0)
        for seed in range(5):
            p1 = make_prices(seed=seed)
            p2 = make_prices(seed=seed + 50)
            score, _ = score_beta_proximity(p1, p2, spy)
            assert 0.0 <= score <= 10.0


# ─── Component 3 ──────────────────────────────────────────────────────────────

class TestVolatilitySimilarity:
    def test_same_vol_max_score(self):
        p = make_prices(vol=0.015, seed=5)
        score, _ = score_volatility_similarity(p, p)
        assert score == pytest.approx(10.0, abs=0.01)

    def test_large_vol_diff_zero_score(self):
        p_high = make_prices(vol=0.05, seed=1)   # 79% ann vol
        p_low = make_prices(vol=0.002, seed=2)   # 3% ann vol
        score, _ = score_volatility_similarity(p_high, p_low)
        assert score == 0.0

    def test_score_in_valid_range(self):
        p1 = make_prices(vol=0.01, seed=1)
        p2 = make_prices(vol=0.02, seed=2)
        score, _ = score_volatility_similarity(p1, p2)
        assert 0.0 <= score <= 10.0


# ─── Component 4 ──────────────────────────────────────────────────────────────

class TestGICSAlignment:
    def test_sub_industry_match_full_score(self):
        gics = {"sector": "IT", "industry_group": "Semi", "industry": "Semi", "sub_industry": "Semiconductors"}
        score, _ = score_gics_alignment(gics, gics)
        assert score == 15.0

    def test_industry_match_ten_points(self):
        query = {"sector": "IT", "industry_group": "Semi", "industry": "Semis", "sub_industry": "Semiconductors"}
        peer = {"sector": "IT", "industry_group": "Semi", "industry": "Semis", "sub_industry": "Semiconductor Equipment"}
        score, _ = score_gics_alignment(peer, query)
        assert score == 10.0

    def test_sector_match_five_points(self):
        query = {"sector": "IT", "industry_group": "Software", "industry": "Software", "sub_industry": "App Software"}
        peer = {"sector": "IT", "industry_group": "Semi", "industry": "Semis", "sub_industry": "Semiconductors"}
        score, _ = score_gics_alignment(peer, query)
        assert score == 5.0

    def test_no_match_zero_points(self):
        query = {"sector": "Healthcare", "industry_group": "Pharma", "industry": "Pharma", "sub_industry": "Pharma"}
        peer = {"sector": "Energy", "industry_group": "Oil", "industry": "E&P", "sub_industry": "E&P"}
        score, _ = score_gics_alignment(peer, query)
        assert score == 0.0

    def test_missing_gics_zero_with_flag(self):
        score, flags = score_gics_alignment({}, {})
        assert score == 0.0
        assert "missing_gics" in flags


# ─── Component 5 ──────────────────────────────────────────────────────────────

class TestRevenueMix:
    def test_identical_mix_max_score(self):
        mix = {"hardware": 0.7, "software": 0.3}
        score, flags = score_revenue_mix(mix, mix, None, None)
        assert score == pytest.approx(10.0, abs=0.01)
        assert not flags

    def test_orthogonal_mix_low_score(self):
        m1 = {"hardware": 1.0}
        m2 = {"software": 1.0}
        score, _ = score_revenue_mix(m1, m2, None, None)
        assert score == pytest.approx(0.0, abs=0.01)

    def test_sic_fallback_same_4digit(self):
        score, flags = score_revenue_mix(None, None, "3674", "3674")
        assert score == 8.0
        assert "sic_fallback" in " ".join(flags)

    def test_sic_fallback_same_2digit(self):
        score, flags = score_revenue_mix(None, None, "3674", "3699")
        assert score == 3.0


# ─── Component 6 ──────────────────────────────────────────────────────────────

class TestRevenueGrowthProximity:
    def test_identical_growth_max_score(self):
        score, _ = score_revenue_growth_proximity(0.20, 0.20)
        assert score == pytest.approx(10.0)

    def test_within_10pct_high_score(self):
        score, _ = score_revenue_growth_proximity(0.20, 0.25)
        # delta=0.05, max_delta=0.40 → score = 10*(1-0.05/0.40) = 8.75
        assert score == pytest.approx(8.75, abs=0.01)

    def test_beyond_threshold_zero(self):
        score, _ = score_revenue_growth_proximity(-0.10, 0.50)
        assert score == 0.0

    def test_missing_value_flag(self):
        score, flags = score_revenue_growth_proximity(None, 0.20)
        assert score == 0.0
        assert flags


# ─── Component 7 ──────────────────────────────────────────────────────────────

class TestMarginProfile:
    def test_identical_margins_max_score(self):
        m = {"gross": 0.75, "ebitda": 0.60, "fcf": 0.50}
        score, _ = score_margin_profile(m, m)
        assert score == pytest.approx(10.0, abs=0.01)

    def test_large_distance_low_score(self):
        m1 = {"gross": 0.80, "ebitda": 0.70, "fcf": 0.60}
        m2 = {"gross": 0.10, "ebitda": 0.05, "fcf": -0.10}
        score, _ = score_margin_profile(m1, m2)
        assert score < 1.0  # exp(-large/0.25) ≈ 0

    def test_missing_dimension_flagged(self):
        m_peer = {"gross": 0.50, "ebitda": None, "fcf": 0.20}
        m_query = {"gross": 0.50, "ebitda": 0.30, "fcf": 0.20}
        score, flags = score_margin_profile(m_peer, m_query)
        assert "missing_margin_ebitda" in flags

    def test_score_in_valid_range(self):
        for val in [0.0, 0.1, 0.3, 0.5, 0.8, 1.0]:
            m = {"gross": val, "ebitda": val * 0.7, "fcf": val * 0.5}
            score, _ = score_margin_profile(m, {"gross": 0.5, "ebitda": 0.3, "fcf": 0.2})
            assert 0.0 <= score <= 10.0


# ─── Component 8 ──────────────────────────────────────────────────────────────

class TestLeverageProximity:
    def test_identical_leverage_max_score(self):
        score, _ = score_leverage_proximity(2.0, 2.0)
        assert score == pytest.approx(5.0)

    def test_large_diff_zero(self):
        score, _ = score_leverage_proximity(10.0, 0.0)
        assert score == 0.0

    def test_missing_leverage_flag(self):
        score, flags = score_leverage_proximity(None, 2.0)
        assert score == 0.0
        assert flags


# ─── Component 9 ──────────────────────────────────────────────────────────────

class TestValuationProximity:
    def test_identical_multiple_max_score(self):
        score, _ = score_valuation_proximity(25.0, 25.0)
        assert score == pytest.approx(5.0)

    def test_beyond_threshold_zero(self):
        score, _ = score_valuation_proximity(5.0, 55.0)
        assert score == 0.0

    def test_moderate_diff_partial_score(self):
        # delta=10, score = 5*(1-10/20) = 2.5
        score, _ = score_valuation_proximity(15.0, 25.0)
        assert score == pytest.approx(2.5)


# ─── Integration: Total score sums ────────────────────────────────────────────

class TestSimilarityScoreIntegration:
    def test_max_possible_score_near_100(self):
        """All components at max → total rescaled to ~100."""
        from app.scoring.similarity import _rescale_to_100
        max_raw = 15 + 10 + 10 + 15 + 10 + 10 + 10 + 5 + 5  # = 90 without semantic
        rescaled = _rescale_to_100(max_raw, use_transcripts=False)
        assert rescaled == pytest.approx(100.0, abs=0.1)

    def test_zero_score_stays_zero(self):
        from app.scoring.similarity import _rescale_to_100
        assert _rescale_to_100(0.0, use_transcripts=False) == 0.0
