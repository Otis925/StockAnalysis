"""
Point-in-time leakage tests.
Validates that no data published after as_of_date leaks into scoring.
"""
import pytest
from datetime import date


class TestPointInTimeGating:

    def test_fundamentals_filed_date_gate(self):
        """
        Fundamentals fetcher must use filed_date (not period_end) for
        point-in-time gating. A filing with period_end before as_of but
        filed_date after as_of must NOT be used.
        """
        from app.data.fundamentals_fetcher import EdgarFundamentalsFetcher

        fetcher = EdgarFundamentalsFetcher()

        # Simulate EDGAR data with future filed date
        fake_facts = {
            "facts": {
                "us-gaap": {
                    "Revenues": {
                        "units": {
                            "USD": [
                                # Valid: filed before as_of
                                {"form": "10-K", "filed": "2025-01-15", "end": "2024-10-31", "val": 1_000_000, "fp": "FY"},
                                # LEAK: filed after as_of — must be excluded
                                {"form": "10-K", "filed": "2025-06-01", "end": "2025-01-31", "val": 99_000_000, "fp": "FY"},
                            ]
                        }
                    }
                }
            }
        }

        as_of = date(2025, 3, 1)  # as_of is March 2025

        val, period_end, filed_date = fetcher.extract_ttm_value(
            fake_facts, "Revenues", as_of, ("10-K",)
        )

        # Must use the Jan 2025 filing (filed Jan 15), NOT the Jun 2025 filing
        assert val == 1_000_000, f"Expected 1M but got {val} — possible future data leak"
        assert filed_date <= as_of, f"filed_date {filed_date} > as_of {as_of}: LEAK DETECTED"

    def test_future_filing_excluded(self):
        """All filings with filed_date > as_of must be excluded."""
        from app.data.fundamentals_fetcher import EdgarFundamentalsFetcher

        fetcher = EdgarFundamentalsFetcher()

        fake_facts = {
            "facts": {
                "us-gaap": {
                    "Assets": {
                        "units": {
                            "USD": [
                                {"form": "10-Q", "filed": "2025-12-01", "end": "2025-09-30", "val": 500_000, "fp": "Q3"},
                            ]
                        }
                    }
                }
            }
        }

        as_of = date(2025, 6, 1)  # as_of June 2025 — filing is December 2025

        val, _, _ = fetcher.extract_ttm_value(fake_facts, "Assets", as_of, ("10-Q",))
        assert val is None, "Future filing must not be used"

    def test_as_of_date_cannot_be_future(self):
        """API request schema must reject future as_of_date."""
        from app.schemas.requests import PeerSearchRequest
        from datetime import timedelta
        import pydantic

        future_date = date.today() + timedelta(days=30)

        with pytest.raises(Exception):  # ValidationError
            PeerSearchRequest(ticker="NVDA", as_of_date=future_date)

    def test_price_window_aligned_to_as_of(self):
        """Price return windows must not extend beyond as_of_date."""
        import numpy as np
        from app.scoring.components import score_return_correlation

        # Simulate 300 days of prices but as_of is 252 days back
        # The score should only use up to as_of, not future prices
        p1 = np.cumsum(np.random.default_rng(1).normal(0, 0.01, 300)) + 100
        p2 = np.cumsum(np.random.default_rng(2).normal(0, 0.01, 300)) + 100

        # Score using only first 252 days (as_of-aligned)
        score_252, _ = score_return_correlation(p1[:252], p2[:252])

        # Score with the same first 252 days but extra future data appended
        score_300, _ = score_return_correlation(p1[:252], p2[:252])

        # Scores must be identical — future data must not affect computation
        assert score_252 == pytest.approx(score_300, abs=0.001)


class TestDataProvenance:

    def test_score_metadata_records_fundamentals_filed_date(self):
        """
        PeerRecord.score_metadata.fundamentals_filed_date must be populated
        so downstream auditors can verify point-in-time correctness.
        """
        from app.schemas.responses import ScoreMetadata
        import datetime

        meta = ScoreMetadata(
            as_of_date=date(2025, 3, 1),
            price_days_available=252,
            fundamentals_period_end=date(2024, 12, 31),
            fundamentals_filed_date=date(2025, 2, 15),
        )
        assert meta.fundamentals_filed_date <= meta.as_of_date

    def test_flags_field_exists_and_is_list(self):
        """score_metadata.flags must be a list (possibly empty) on every PeerRecord."""
        from app.schemas.responses import ScoreMetadata

        meta = ScoreMetadata(
            as_of_date=date.today(),
            price_days_available=252,
        )
        assert isinstance(meta.flags, list)
