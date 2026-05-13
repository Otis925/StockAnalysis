"""
TextEmbedding: stores TF-IDF document vectors per ticker.
Keyed by (ticker, model_name) so we can evolve the embedding strategy.
"""
import json
from datetime import date
from sqlalchemy import Column, String, Date, Text, UniqueConstraint
from app.database import Base


class TextEmbedding(Base):
    __tablename__ = "text_embeddings"

    ticker = Column(String(10), primary_key=True)
    model_name = Column(String(64), primary_key=True)   # e.g. "tfidf-v1"
    computed_date = Column(Date, nullable=False)
    source = Column(String(32), nullable=False, default="synthetic")  # "edgar" | "synthetic"
    # Serialized list[float] — TF-IDF vector over shared vocabulary
    vector_json = Column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint("ticker", "model_name", name="uq_embedding_ticker_model"),
    )

    def get_vector(self) -> list[float]:
        return json.loads(self.vector_json)

    def set_vector(self, v: list[float]) -> None:
        self.vector_json = json.dumps(v)
