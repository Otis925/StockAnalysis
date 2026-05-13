from sqlalchemy import String, Float, Date, DateTime, JSON, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date, datetime
from typing import Optional
from app.database import Base


class PeerScoreCache(Base):
    """Persisted score cache — supplements Redis for long-lived historical queries."""
    __tablename__ = "peer_score_cache"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    query_ticker: Mapped[str] = mapped_column(String(10), nullable=False)
    peer_ticker: Mapped[str] = mapped_column(String(10), nullable=False)
    as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
    params_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    score_components: Mapped[dict] = mapped_column(JSON, nullable=False)
    score_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    computed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    __table_args__ = (
        UniqueConstraint("query_ticker", "peer_ticker", "as_of_date", "params_hash", name="uq_peer_score"),
        Index("ix_peer_cache_query_date", "query_ticker", "as_of_date"),
    )
