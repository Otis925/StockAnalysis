from datetime import datetime, date
from sqlalchemy import Column, String, Date, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class ScoreHistory(Base):
    """Daily RPS snapshot per peer per watchlist — used for alert delta computation."""
    __tablename__ = "score_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    watchlist_id = Column(String(36), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False, index=True)
    peer_ticker = Column(String(10), nullable=False)
    score_date = Column(Date, nullable=False)
    rps = Column(Float, nullable=True)
    similarity_score = Column(Float, nullable=True)
    conviction_score = Column(Float, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    watchlist = relationship("Watchlist", back_populates="score_history")


class AlertLog(Base):
    """Record of fired score alerts."""
    __tablename__ = "alert_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    watchlist_id = Column(String(36), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False, index=True)
    peer_ticker = Column(String(10), nullable=False)
    alert_date = Column(Date, nullable=False)
    prev_rps = Column(Float, nullable=True)
    curr_rps = Column(Float, nullable=True)
    delta = Column(Float, nullable=True)
    webhook_url = Column(String(512), nullable=True)
    delivered = Column(String(16), nullable=False, default="pending")  # pending | ok | failed
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
