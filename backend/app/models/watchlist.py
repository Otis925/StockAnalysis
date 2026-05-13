from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    query_ticker = Column(String(10), nullable=False)
    watchlist_size = Column(Integer, nullable=False, default=25)
    sector_lock = Column(String(4), nullable=False, default="false")
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_run_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="watchlists")
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")
    score_history = relationship("ScoreHistory", back_populates="watchlist", cascade="all, delete-orphan")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    watchlist_id = Column(String(36), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False, index=True)
    peer_ticker = Column(String(10), nullable=False)
    peer_name = Column(String(256), nullable=True)
    rps = Column(Float, nullable=True)
    similarity_score = Column(Float, nullable=True)
    conviction_score = Column(Float, nullable=True)
    captured_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    watchlist = relationship("Watchlist", back_populates="items")
