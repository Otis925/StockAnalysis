"""
Tests for the screen score logic and screener endpoint.
Pure unit tests — no DB required.
"""
import pytest
import numpy as np

# Import the scoring function directly
from app.api.screen import _screen_score


class TestScreenScore:
    """Test the absolute composite screen score (0-100)."""

    def _fund(self, piotroski=None, ebitda_margin=None, revenue_growth_yoy=None):
        return {
            "piotroski_f_score": piotroski,
            "ebitda_margin": ebitda_margin,
            "revenue_growth_yoy": revenue_growth_yoy,
        }

    def _est(self, eps_rev=None, si=None, rating=None):
        return {
            "ntm_eps_revision_3m": eps_rev,
            "short_interest_pct_float": si,
            "mean_rating": rating,
        }

    def test_all_missing_returns_zero(self):
        score = _screen_score(self._fund(), self._est())
        assert score == 0.0

    def test_score_in_range(self):
        fund = self._fund(piotroski=7, ebitda_margin=0.25)
        est = self._est(eps_rev=0.05, si=0.02, rating=4.0)
        score = _screen_score(fund, est)
        assert 0.0 <= score <= 100.0

    def test_perfect_fundamentals(self):
        fund = self._fund(piotroski=9, ebitda_margin=0.40)
        est = self._est(eps_rev=0.50, si=0.0, rating=5.0)
        score = _screen_score(fund, est)
        assert score == pytest.approx(100.0, abs=1.0)

    def test_worst_fundamentals(self):
        fund = self._fund(piotroski=0, ebitda_margin=0.0)
        est = self._est(eps_rev=-0.50, si=0.50, rating=1.0)
        score = _screen_score(fund, est)
        assert score == pytest.approx(0.0, abs=1.0)

    def test_piotroski_only(self):
        # Only Piotroski provided: score = 20 * (9/9) = 20, rescaled to 100
        score = _screen_score(self._fund(piotroski=9), self._est())
        assert score == pytest.approx(100.0, abs=0.1)

    def test_piotroski_zero(self):
        score = _screen_score(self._fund(piotroski=0), self._est())
        assert score == pytest.approx(0.0, abs=0.1)

    def test_piotroski_mid(self):
        score = _screen_score(self._fund(piotroski=4), self._est())
        # 20 * 4/9 ≈ 8.89, rescaled to 100
        expected = round(20.0 * 4.0 / 9.0 * (100.0 / 20.0), 1)
        assert score == pytest.approx(expected, abs=0.2)

    def test_eps_revision_clipped_positive(self):
        # +100% should be clipped to +50%
        fund = self._fund()
        est = self._est(eps_rev=1.0)
        score_1 = _screen_score(fund, est)
        est2 = self._est(eps_rev=0.50)
        score_2 = _screen_score(fund, est2)
        assert score_1 == score_2

    def test_eps_revision_negative_clipped(self):
        fund = self._fund()
        est = self._est(eps_rev=-1.0)  # Below -50% floor
        score_1 = _screen_score(fund, est)
        est2 = self._est(eps_rev=-0.50)
        score_2 = _screen_score(fund, est2)
        assert score_1 == score_2

    def test_high_short_interest_penalty(self):
        est_low_si = self._est(si=0.0)
        est_high_si = self._est(si=0.50)
        score_low = _screen_score(self._fund(), est_low_si)
        score_high = _screen_score(self._fund(), est_high_si)
        assert score_low > score_high

    def test_ebitda_margin_capped_at_40pct(self):
        # 80% margin should be treated same as 40%
        score_40 = _screen_score(self._fund(ebitda_margin=0.40), self._est())
        score_80 = _screen_score(self._fund(ebitda_margin=0.80), self._est())
        assert score_40 == score_80

    def test_analyst_rating_5_beats_1(self):
        est_buy = self._est(rating=5.0)
        est_sell = self._est(rating=1.0)
        fund = self._fund()
        assert _screen_score(fund, est_buy) > _screen_score(fund, est_sell)

    def test_partial_data_rescales(self):
        # Only Piotroski + EPS: 2 components, rescaled so max is still 100
        fund = self._fund(piotroski=9)
        est = self._est(eps_rev=0.5)
        score = _screen_score(fund, est)
        assert score == pytest.approx(100.0, abs=0.1)

    def test_deterministic(self):
        fund = self._fund(piotroski=6, ebitda_margin=0.20)
        est = self._est(eps_rev=0.02, si=0.05, rating=3.5)
        score1 = _screen_score(fund, est)
        score2 = _screen_score(fund, est)
        assert score1 == score2

    def test_returns_float(self):
        score = _screen_score(self._fund(piotroski=5), self._est(rating=3.0))
        assert isinstance(score, float)
