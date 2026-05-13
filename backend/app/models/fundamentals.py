from sqlalchemy import String, Float, Integer, Date, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date
from typing import Optional
from app.database import Base


class Fundamentals(Base):
    """As-reported fundamentals from EDGAR XBRL, standardized TTM."""
    __tablename__ = "fundamentals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    filed_date: Mapped[date] = mapped_column(Date, nullable=False)
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
    fiscal_quarter: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[str] = mapped_column(String(30), nullable=False, default="edgar_xbrl")

    # Income statement (TTM, in USD)
    revenue_ttm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gross_profit_ttm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ebitda_ttm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    net_income_ttm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    operating_income_ttm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Balance sheet (point-in-time at period_end)
    total_assets: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_debt: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cash_and_equivalents: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    net_debt: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    shares_outstanding: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Cash flow (TTM)
    operating_cf_ttm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    capex_ttm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fcf_ttm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Derived ratios (computed at ingest time from TTM)
    gross_margin: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ebitda_margin: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fcf_margin: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    net_debt_ebitda: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    revenue_growth_yoy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Piotroski signal components (9-point, stored individually)
    piotroski_roa_positive: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piotroski_cfo_positive: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piotroski_delta_roa: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piotroski_accruals: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piotroski_delta_leverage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piotroski_delta_liquidity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piotroski_no_dilution: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piotroski_delta_gross_margin: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piotroski_delta_asset_turnover: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    piotroski_f_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Segment revenue vector (JSON: {segment_name: pct_of_revenue})
    segment_revenue_mix: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index("ix_fundamentals_ticker_filed", "ticker", "filed_date"),
        Index("ix_fundamentals_ticker_period", "ticker", "period_end"),
    )
