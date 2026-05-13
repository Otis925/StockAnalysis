from sqlalchemy import String, Float, BigInteger, Date, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date
from app.database import Base


class PriceBar(Base):
    """Daily OHLCV bar. Primary key is (ticker, date)."""
    __tablename__ = "price_bars"

    ticker: Mapped[str] = mapped_column(String(10), primary_key=True)
    date: Mapped[date] = mapped_column(Date, primary_key=True)

    open: Mapped[float] = mapped_column(Float, nullable=True)
    high: Mapped[float] = mapped_column(Float, nullable=True)
    low: Mapped[float] = mapped_column(Float, nullable=True)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=True)
    vwap: Mapped[float] = mapped_column(Float, nullable=True)
    adj_close: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="yfinance")

    __table_args__ = (
        Index("ix_price_bars_ticker_date", "ticker", "date"),
        Index("ix_price_bars_date", "date"),
    )
