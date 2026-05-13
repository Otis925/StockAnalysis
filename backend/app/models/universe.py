from sqlalchemy import String, Float, Boolean, Date, Index
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date
from app.database import Base


class UniverseMember(Base):
    __tablename__ = "universe"

    ticker: Mapped[str] = mapped_column(String(10), primary_key=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    exchange: Mapped[str] = mapped_column(String(10), nullable=True)
    cik: Mapped[str] = mapped_column(String(20), nullable=True)
    sic_code: Mapped[str] = mapped_column(String(10), nullable=True)

    # GICS classification (4 levels)
    gics_sector: Mapped[str] = mapped_column(String(100), nullable=True)
    gics_industry_group: Mapped[str] = mapped_column(String(100), nullable=True)
    gics_industry: Mapped[str] = mapped_column(String(100), nullable=True)
    gics_sub_industry: Mapped[str] = mapped_column(String(100), nullable=True)
    gics_sector_code: Mapped[str] = mapped_column(String(10), nullable=True)
    gics_industry_group_code: Mapped[str] = mapped_column(String(10), nullable=True)
    gics_industry_code: Mapped[str] = mapped_column(String(10), nullable=True)
    gics_sub_industry_code: Mapped[str] = mapped_column(String(10), nullable=True)

    market_cap_usd_mm: Mapped[float] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    added_date: Mapped[date] = mapped_column(Date, nullable=True)
    removed_date: Mapped[date] = mapped_column(Date, nullable=True)
    last_updated: Mapped[date] = mapped_column(Date, nullable=True)

    __table_args__ = (
        Index("ix_universe_gics_sector", "gics_sector"),
        Index("ix_universe_gics_sub_industry", "gics_sub_industry"),
        Index("ix_universe_is_active", "is_active"),
    )
