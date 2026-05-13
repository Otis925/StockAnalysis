from sqlalchemy import String, Float, Integer, Date, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date
from typing import Optional
from app.database import Base


class AnalystEstimates(Base):
    """
    Per-ticker analyst estimate snapshot, refreshed daily.
    Stores current + 63-business-day-ago NTM EPS for revision momentum.
    Source: FMP (licensed) or mock (development).
    """
    __tablename__ = "analyst_estimates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), nullable=False)
    as_of_date: Mapped[date] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="mock")

    # NTM EPS estimates
    ntm_eps_consensus: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ntm_eps_consensus_3m_ago: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ntm_revenue_consensus: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ntm_ebitda_consensus: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # NTM multiples
    ev_ntm_ebitda: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pe_ntm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Analyst ratings
    analyst_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    buy_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hold_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sell_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mean_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    price_target_median: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Short interest
    short_interest_pct_float: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    shares_float: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    short_shares: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint("ticker", "as_of_date", name="uq_estimates_ticker_date"),
        Index("ix_estimates_ticker_date", "ticker", "as_of_date"),
    )
