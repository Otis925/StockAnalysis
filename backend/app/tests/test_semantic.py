"""
Unit tests for the semantic similarity component.
Tests: TF-IDF vectorizer, cosine similarity, score range, synthetic description.
No API calls, no DB, no filesystem.
"""
import pytest
from app.scoring.semantic import SemanticSimilarityEngine
from app.data.edgar_text_fetcher import _synthetic_description


# ─── Synthetic description ────────────────────────────────────────────────────

class TestSyntheticDescription:
    def test_returns_non_empty_string(self):
        desc = _synthetic_description("AAPL", "Apple Inc.", "Information Technology", "Technology Hardware", "3571")
        assert isinstance(desc, str)
        assert len(desc) > 50

    def test_deterministic_same_ticker(self):
        desc1 = _synthetic_description("NVDA", "NVIDIA", "Information Technology", "Semiconductors", "3674")
        desc2 = _synthetic_description("NVDA", "NVIDIA", "Information Technology", "Semiconductors", "3674")
        assert desc1 == desc2

    def test_different_tickers_different_output(self):
        desc_a = _synthetic_description("AAPL", "Apple Inc.", "Information Technology", "Technology Hardware", "3571")
        desc_b = _synthetic_description("XOM", "ExxonMobil", "Energy", "Oil & Gas", "2911")
        assert desc_a != desc_b

    def test_contains_sector_keywords(self):
        desc = _synthetic_description("AAPL", "Apple Inc.", "Information Technology", "Tech Hardware", "3571")
        assert any(kw in desc.lower() for kw in ["software", "technology", "digital", "cloud", "semiconductor"])

    def test_handles_none_sector(self):
        desc = _synthetic_description("XX", "Unknown Corp", None, None, None)
        assert isinstance(desc, str)
        assert len(desc) > 20


# ─── SemanticSimilarityEngine ─────────────────────────────────────────────────

def _make_corpus() -> dict[str, str]:
    return {
        "AAPL": "Apple designs consumer electronics iPhone Mac iPad software App Store ecosystem",
        "MSFT": "Microsoft develops cloud computing Azure software Office enterprise business productivity",
        "GOOG": "Alphabet Google search engine advertising cloud computing YouTube digital media",
        "XOM": "ExxonMobil petroleum oil exploration production refining energy chemicals upstream",
        "CVX": "Chevron oil gas energy exploration production refining petroleum chemicals",
        "JPM": "JPMorgan Chase banking financial services investment banking asset management lending",
        "BAC": "Bank of America banking financial services lending credit cards consumer deposits",
    }


class TestSemanticEngine:
    def test_fit_and_score(self):
        eng = SemanticSimilarityEngine()
        eng.fit(_make_corpus())
        score = eng.score("AAPL", "MSFT")
        assert score is not None
        assert 0.0 <= score <= 10.0

    def test_same_ticker_scores_10(self):
        eng = SemanticSimilarityEngine()
        corpus = _make_corpus()
        eng.fit(corpus)
        score = eng.score("AAPL", "AAPL")
        assert score == pytest.approx(10.0, abs=0.01)

    def test_similar_sectors_score_higher_than_dissimilar(self):
        eng = SemanticSimilarityEngine()
        eng.fit(_make_corpus())
        # XOM and CVX (both oil) should be more similar than XOM and AAPL (tech)
        oil_sim = eng.score("XOM", "CVX")
        cross_sim = eng.score("XOM", "AAPL")
        assert oil_sim is not None and cross_sim is not None
        assert oil_sim > cross_sim

    def test_similar_financials_score_higher_than_cross_sector(self):
        eng = SemanticSimilarityEngine()
        eng.fit(_make_corpus())
        bank_sim = eng.score("JPM", "BAC")
        cross_sim = eng.score("JPM", "XOM")
        assert bank_sim is not None and cross_sim is not None
        assert bank_sim > cross_sim

    def test_missing_ticker_returns_none(self):
        eng = SemanticSimilarityEngine()
        eng.fit(_make_corpus())
        assert eng.score("UNKNOWN", "AAPL") is None
        assert eng.score("AAPL", "UNKNOWN") is None

    def test_unfitted_returns_none(self):
        eng = SemanticSimilarityEngine()
        assert eng.score("AAPL", "MSFT") is None

    def test_all_scores_in_range(self):
        eng = SemanticSimilarityEngine()
        corpus = _make_corpus()
        eng.fit(corpus)
        tickers = list(corpus.keys())
        for t1 in tickers:
            for t2 in tickers:
                s = eng.score(t1, t2)
                assert s is not None
                assert 0.0 <= s <= 10.0, f"Score out of range for {t1},{t2}: {s}"

    def test_get_all_scores_excludes_query_ticker(self):
        eng = SemanticSimilarityEngine()
        eng.fit(_make_corpus())
        scores = eng.get_all_scores_for_query("AAPL")
        assert "AAPL" not in scores

    def test_get_all_scores_covers_all_peers(self):
        corpus = _make_corpus()
        eng = SemanticSimilarityEngine()
        eng.fit(corpus)
        scores = eng.get_all_scores_for_query("AAPL")
        expected_peers = set(corpus.keys()) - {"AAPL"}
        assert set(scores.keys()) == expected_peers

    def test_scores_are_symmetric(self):
        eng = SemanticSimilarityEngine()
        eng.fit(_make_corpus())
        s_ab = eng.score("AAPL", "MSFT")
        s_ba = eng.score("MSFT", "AAPL")
        assert s_ab == pytest.approx(s_ba, abs=0.001)

    def test_empty_fit_raises_or_returns_none(self):
        eng = SemanticSimilarityEngine()
        # Fitting with a single document should not crash
        eng.fit({"A": "technology software cloud"})
        score = eng.score("A", "A")
        assert score is not None

    def test_score_deterministic(self):
        corpus = _make_corpus()
        eng1 = SemanticSimilarityEngine()
        eng2 = SemanticSimilarityEngine()
        eng1.fit(corpus)
        eng2.fit(corpus)
        for t1, t2 in [("AAPL", "MSFT"), ("XOM", "CVX"), ("JPM", "BAC")]:
            assert eng1.score(t1, t2) == eng2.score(t1, t2)


# ─── Integration: build_semantic_engine ───────────────────────────────────────

class TestBuildSemanticEngine:
    @pytest.mark.asyncio
    async def test_build_from_universe_members(self):
        from app.scoring.semantic import build_semantic_engine

        members = [
            {"ticker": "AAPL", "company_name": "Apple Inc.", "gics_sector": "Information Technology", "gics_sub_industry": "Technology Hardware", "sic_code": "3571"},
            {"ticker": "MSFT", "company_name": "Microsoft", "gics_sector": "Information Technology", "gics_sub_industry": "Systems Software", "sic_code": "7372"},
            {"ticker": "XOM", "company_name": "ExxonMobil", "gics_sector": "Energy", "gics_sub_industry": "Integrated Oil & Gas", "sic_code": "2911"},
        ]
        eng = await build_semantic_engine(members)
        score = eng.score("AAPL", "MSFT")
        assert score is not None
        assert 0.0 <= score <= 10.0

    @pytest.mark.asyncio
    async def test_tech_more_similar_than_energy(self):
        from app.scoring.semantic import build_semantic_engine

        members = [
            {"ticker": "AAPL", "company_name": "Apple Inc.", "gics_sector": "Information Technology", "gics_sub_industry": "Technology Hardware", "sic_code": "3571"},
            {"ticker": "MSFT", "company_name": "Microsoft", "gics_sector": "Information Technology", "gics_sub_industry": "Systems Software", "sic_code": "7372"},
            {"ticker": "XOM", "company_name": "ExxonMobil", "gics_sector": "Energy", "gics_sub_industry": "Integrated Oil & Gas", "sic_code": "2911"},
        ]
        eng = await build_semantic_engine(members)
        tech_sim = eng.score("AAPL", "MSFT")
        cross_sim = eng.score("AAPL", "XOM")
        assert tech_sim is not None and cross_sim is not None
        assert tech_sim > cross_sim
