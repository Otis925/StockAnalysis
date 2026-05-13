"""
Tests for portfolio overlap scoring logic.
Pure unit tests — no DB or network required.
"""
import pytest


# ── Overlap score formula ──────────────────────────────────────────────────────

class TestOverlapScore:
    """Test the overlap score formula: avg_rps * (0.5 + 0.5 * breadth)."""

    def _compute_overlap(self, avg_rps: float, appears_in: int, n_queries: int) -> float:
        breadth = float(appears_in) / float(n_queries)
        return round(avg_rps * (0.5 + 0.5 * breadth), 1)

    def test_appears_in_all_queries(self):
        # Full breadth: 5/5, avg_rps=80 → 80 * (0.5 + 0.5) = 80
        score = self._compute_overlap(avg_rps=80.0, appears_in=5, n_queries=5)
        assert score == pytest.approx(80.0, abs=0.2)

    def test_appears_in_none(self):
        # appears_in=0/5: 0 breadth → 80 * 0.5 = 40
        score = self._compute_overlap(avg_rps=80.0, appears_in=0, n_queries=5)
        assert score == pytest.approx(40.0, abs=0.2)

    def test_appears_in_half(self):
        # appears_in=2/4: 0.5 breadth → 80 * (0.5 + 0.25) = 60
        score = self._compute_overlap(avg_rps=80.0, appears_in=2, n_queries=4)
        assert score == pytest.approx(60.0, abs=0.2)

    def test_high_rps_with_low_breadth_vs_low_rps_with_high_breadth(self):
        # 90 RPS in 1/10: 90 * (0.5 + 0.05) = 49.5
        # 60 RPS in 10/10: 60 * 1.0 = 60
        score_narrow = self._compute_overlap(avg_rps=90.0, appears_in=1, n_queries=10)
        score_broad = self._compute_overlap(avg_rps=60.0, appears_in=10, n_queries=10)
        assert score_broad > score_narrow  # breadth rewards consistency

    def test_zero_rps_gives_zero(self):
        score = self._compute_overlap(avg_rps=0.0, appears_in=5, n_queries=5)
        assert score == 0.0

    def test_deterministic(self):
        s1 = self._compute_overlap(75.0, 3, 5)
        s2 = self._compute_overlap(75.0, 3, 5)
        assert s1 == s2


# ── Portfolio request validation ───────────────────────────────────────────────

class TestPortfolioRequest:
    def test_too_many_tickers_rejected(self):
        from pydantic import ValidationError
        from app.api.portfolio import PortfolioRequest
        with pytest.raises(ValidationError):
            PortfolioRequest(tickers=["AAPL"] * 21, watchlist_size=10)

    def test_empty_tickers_rejected(self):
        from pydantic import ValidationError
        from app.api.portfolio import PortfolioRequest
        with pytest.raises(ValidationError):
            PortfolioRequest(tickers=[], watchlist_size=10)

    def test_watchlist_size_too_large_rejected(self):
        from pydantic import ValidationError
        from app.api.portfolio import PortfolioRequest
        with pytest.raises(ValidationError):
            PortfolioRequest(tickers=["AAPL"], watchlist_size=51)

    def test_valid_request(self):
        from app.api.portfolio import PortfolioRequest
        req = PortfolioRequest(tickers=["aapl", "msft"], watchlist_size=10)
        assert req.tickers == ["AAPL", "MSFT"]  # uppercased

    def test_single_ticker_valid(self):
        from app.api.portfolio import PortfolioRequest
        req = PortfolioRequest(tickers=["GOOG"])
        assert req.tickers == ["GOOG"]

    def test_max_tickers_valid(self):
        from app.api.portfolio import PortfolioRequest
        tickers = [f"T{i:02d}" for i in range(20)]
        req = PortfolioRequest(tickers=tickers)
        assert len(req.tickers) == 20

    def test_max_watchlist_size_valid(self):
        from app.api.portfolio import PortfolioRequest
        req = PortfolioRequest(tickers=["AAPL"], watchlist_size=50)
        assert req.watchlist_size == 50

    def test_tickers_stripped_and_uppercased(self):
        from app.api.portfolio import PortfolioRequest
        req = PortfolioRequest(tickers=["  aapl  ", "msft"])
        assert "AAPL" in req.tickers
        assert "MSFT" in req.tickers
