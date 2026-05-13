"""
Semantic similarity component (10 pts).
Uses TF-IDF cosine similarity on 10-K business description text.

The TF-IDF model is fit on the full corpus of company descriptions
(all universe members) and then used to transform individual documents
into sparse vectors for cosine comparison.

Score interpretation:
  cosine = 1.0  →  identical text profile  →  10.0 pts
  cosine = 0.0  →  completely dissimilar   →  0.0 pts
"""
import numpy as np
import logging
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

log = logging.getLogger(__name__)

MODEL_NAME = "tfidf-v1"

_STOP_WORDS = [
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "company", "corporation", "inc", "ltd", "llc",
    "its", "their", "our", "we", "you", "it", "he", "she", "they", "this",
    "that", "these", "those", "as", "not", "no", "also", "through", "into",
    "during", "which", "who", "what", "when", "where", "how", "all", "each",
]


class SemanticSimilarityEngine:
    """
    Fits a TF-IDF model on a corpus of company descriptions,
    then provides per-pair cosine similarity lookup.
    """

    def __init__(self):
        self._vectorizer: Optional[TfidfVectorizer] = None
        self._tickers: list[str] = []
        self._matrix = None  # sparse matrix (n_docs, n_features)

    def fit(self, ticker_texts: dict[str, str]) -> None:
        """
        Fit on {ticker: description_text} dict.
        Must be called before score().
        """
        tickers = list(ticker_texts.keys())
        texts = [ticker_texts[t] for t in tickers]

        self._vectorizer = TfidfVectorizer(
            stop_words=_STOP_WORDS,
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True,
            min_df=1,
        )
        self._matrix = self._vectorizer.fit_transform(texts)
        self._tickers = tickers
        log.debug("TF-IDF fitted on %d documents, %d features", len(tickers), self._matrix.shape[1])

    def score(self, query_ticker: str, peer_ticker: str) -> Optional[float]:
        """
        Returns semantic similarity score (0–10) for a ticker pair.
        Returns None if either ticker is not in the corpus.
        """
        if self._matrix is None or self._vectorizer is None:
            return None

        try:
            q_idx = self._tickers.index(query_ticker)
            p_idx = self._tickers.index(peer_ticker)
        except ValueError:
            return None

        q_vec = self._matrix[q_idx]
        p_vec = self._matrix[p_idx]
        cos = float(cosine_similarity(q_vec, p_vec)[0, 0])
        cos = float(np.clip(cos, 0.0, 1.0))
        return round(10.0 * cos, 4)

    def get_all_scores_for_query(self, query_ticker: str) -> dict[str, float]:
        """
        Returns {peer_ticker: score} for all tickers in corpus vs. query.
        Efficient batch computation using matrix multiplication.
        """
        if self._matrix is None or query_ticker not in self._tickers:
            return {}

        q_idx = self._tickers.index(query_ticker)
        q_vec = self._matrix[q_idx]
        # cosine similarity vs. all documents
        sims = cosine_similarity(q_vec, self._matrix)[0]
        return {
            t: round(10.0 * float(np.clip(s, 0.0, 1.0)), 4)
            for t, s in zip(self._tickers, sims)
            if t != query_ticker
        }


async def build_semantic_engine(
    universe_members: list[dict],
) -> SemanticSimilarityEngine:
    """
    Build and fit a SemanticSimilarityEngine using synthetic descriptions.
    Called once per API request when use_transcripts=True.

    For production with real EDGAR text: replace the synthetic description
    with fetched 10-K text from EdgarTextFetcher.
    """
    from app.data.edgar_text_fetcher import _synthetic_description

    ticker_texts = {}
    for member in universe_members:
        ticker = member["ticker"]
        desc = _synthetic_description(
            ticker=ticker,
            company_name=member.get("company_name", ticker),
            gics_sector=member.get("gics_sector"),
            gics_sub_industry=member.get("gics_sub_industry"),
            sic_code=member.get("sic_code"),
        )
        ticker_texts[ticker] = desc

    engine = SemanticSimilarityEngine()
    engine.fit(ticker_texts)
    return engine
