from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class ScoreComponents(BaseModel):
    return_correlation: float
    beta_proximity: float
    volatility_similarity: float
    gics_alignment: float
    revenue_mix_cosine: float
    revenue_growth_proximity: float
    margin_profile_distance: float
    leverage_proximity: float
    valuation_proximity: float
    semantic_similarity: Optional[float] = None


class ConvictionComponents(BaseModel):
    eps_revision_momentum: Optional[float] = None    # 0-20
    price_momentum: Optional[float] = None           # 0-20
    valuation_discount: Optional[float] = None       # 0-20
    short_interest: Optional[float] = None           # 0-15
    analyst_consensus: Optional[float] = None        # 0-15
    piotroski_f_score: Optional[float] = None        # 0-10


class ScoreMetadata(BaseModel):
    as_of_date: date
    price_days_available: int
    fundamentals_period_end: Optional[date] = None
    fundamentals_filed_date: Optional[date] = None
    fundamentals_source: str = "edgar_xbrl"
    estimates_source: Optional[str] = None
    flags: list[str] = Field(default_factory=list)


class FundamentalsSnapshot(BaseModel):
    revenue_ttm_mm: Optional[float] = None
    gross_margin: Optional[float] = None
    ebitda_margin: Optional[float] = None
    fcf_margin: Optional[float] = None
    net_debt_ebitda: Optional[float] = None
    revenue_growth_yoy: Optional[float] = None
    piotroski_f_score: Optional[int] = None


class EstimatesSnapshot(BaseModel):
    ntm_eps_consensus: Optional[float] = None
    ntm_eps_revision_3m: Optional[float] = None     # fractional change, e.g. 0.08 = +8%
    ev_ntm_ebitda: Optional[float] = None
    analyst_count: Optional[int] = None
    mean_rating: Optional[float] = None             # 1-5 scale
    consensus_label: Optional[str] = None           # "Buy" / "Hold" / "Sell"
    short_interest_pct: Optional[float] = None
    price_target_median: Optional[float] = None


class PriceSnapshot(BaseModel):
    last_price: Optional[float] = None
    price_change_1m: Optional[float] = None
    price_change_3m: Optional[float] = None
    price_change_6m: Optional[float] = None


class PeerRecord(BaseModel):
    ticker: str
    company_name: str
    gics_sector: Optional[str] = None
    gics_industry_group: Optional[str] = None
    gics_industry: Optional[str] = None
    gics_sub_industry: Optional[str] = None
    market_cap_usd_mm: Optional[float] = None

    similarity_score: float
    conviction_score: Optional[float] = None         # None if estimates disabled
    research_priority_score: float

    score_components: ScoreComponents
    conviction_components: Optional[ConvictionComponents] = None
    score_metadata: ScoreMetadata
    fundamentals: FundamentalsSnapshot
    estimates: Optional[EstimatesSnapshot] = None
    price: PriceSnapshot


class QueryInfo(BaseModel):
    ticker: str
    company_name: str
    gics_sector: Optional[str] = None
    gics_sub_industry: Optional[str] = None
    market_cap_usd_mm: Optional[float] = None
    as_of_date: date


class PeerSearchResponse(BaseModel):
    query: QueryInfo
    peers: list[PeerRecord]
    total_candidates_evaluated: int
    watchlist_size: int
    computation_ms: int
    cached: bool = False
    conviction_enabled: bool = False
    methodology_version: str = "2.0.0"


# ─── Thesis Card ──────────────────────────────────────────────────────────────

class ThesisCard(BaseModel):
    ticker: str
    company_name: str
    rank: int                    # 1, 2, or 3
    moat: str
    drawdown_risk: str
    catalyst: str
    exit_criteria: str
    conviction_rationale: str
    generated_at: str            # ISO 8601
    model_version: str
    input_token_count: Optional[int] = None
    output_token_count: Optional[int] = None


class ThesisResponse(BaseModel):
    query_ticker: str
    thesis_cards: list[ThesisCard]
    generation_ms: int
    model_version: str


class ThesisStreamEvent(BaseModel):
    event: str                   # "card" | "error" | "done"
    rank: Optional[int] = None
    ticker: Optional[str] = None
    card: Optional[ThesisCard] = None
    error: Optional[str] = None


# ─── Misc ─────────────────────────────────────────────────────────────────────

class TickerSuggestion(BaseModel):
    ticker: str
    company_name: str
    gics_sector: Optional[str] = None
    market_cap_usd_mm: Optional[float] = None


class UniverseSearchResponse(BaseModel):
    results: list[TickerSuggestion]
    total: int


class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    universe_size: int
    claude_configured: bool = False
    estimates_source: str = "mock"
