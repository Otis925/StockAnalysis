from pydantic import BaseModel, field_validator, model_validator, Field
from typing import Optional
from datetime import date
import re


class PeerSearchRequest(BaseModel):
    ticker: str = Field(..., description="Primary query ticker, US exchange listed")
    watchlist_size: int = Field(25, description="Number of peers to return")
    region: str = Field("US", description="Market region")
    use_transcripts: bool = Field(True, description="Include semantic similarity from 10-K/transcripts")
    use_analyst_estimates: bool = Field(True, description="Include conviction score components requiring estimates")
    use_legacy_score: bool = Field(False, description="Generate LLM qualitative Legacy Conviction Score")
    as_of_date: Optional[date] = Field(None, description="Point-in-time date. Null = today.")
    sector_lock: bool = Field(False, description="Restrict candidates to same GICS sector as query")
    min_market_cap_usd: Optional[float] = Field(None, description="Min market cap filter in USD millions")
    max_market_cap_usd: Optional[float] = Field(None, description="Max market cap filter in USD millions")
    exclude_tickers: list[str] = Field(default_factory=list, description="Tickers to exclude from results")
    generate_thesis: bool = Field(False, description="Generate Claude thesis cards for top 3 peers")

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, v: str) -> str:
        v = v.upper().strip()
        if not re.match(r"^[A-Z]{1,5}$", v):
            raise ValueError(f"Invalid ticker format: {v}. Must be 1-5 uppercase letters.")
        return v

    @field_validator("watchlist_size")
    @classmethod
    def validate_watchlist_size(cls, v: int) -> int:
        if v not in (10, 25, 50):
            raise ValueError("watchlist_size must be 10, 25, or 50")
        return v

    @field_validator("region")
    @classmethod
    def validate_region(cls, v: str) -> str:
        if v not in ("US", "GLOBAL"):
            raise ValueError("region must be 'US' or 'GLOBAL'")
        return v

    @field_validator("as_of_date")
    @classmethod
    def validate_as_of_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("as_of_date cannot be in the future")
        return v

    @field_validator("exclude_tickers")
    @classmethod
    def validate_exclude_tickers(cls, v: list[str]) -> list[str]:
        if len(v) > 20:
            raise ValueError("Maximum 20 tickers in exclude_tickers")
        return [t.upper().strip() for t in v]

    @model_validator(mode="after")
    def validate_market_cap_range(self) -> "PeerSearchRequest":
        if (
            self.min_market_cap_usd is not None
            and self.max_market_cap_usd is not None
            and self.min_market_cap_usd >= self.max_market_cap_usd
        ):
            raise ValueError("min_market_cap_usd must be less than max_market_cap_usd")
        return self
