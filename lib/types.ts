export interface ScoreComponents {
  return_correlation: number;
  beta_proximity: number;
  volatility_similarity: number;
  gics_alignment: number;
  revenue_mix_cosine: number;
  revenue_growth_proximity: number;
  margin_profile_distance: number;
  leverage_proximity: number;
  valuation_proximity: number;
  semantic_similarity: number | null;
}

export interface ScoreMetadata {
  as_of_date: string;
  price_days_available: number;
  fundamentals_period_end: string | null;
  fundamentals_filed_date: string | null;
  fundamentals_source: string;
  flags: string[];
}

export interface FundamentalsSnapshot {
  revenue_ttm_mm: number | null;
  gross_margin: number | null;
  ebitda_margin: number | null;
  fcf_margin: number | null;
  net_debt_ebitda: number | null;
  revenue_growth_yoy: number | null;
  piotroski_f_score: number | null;
}

export interface PriceSnapshot {
  last_price: number | null;
  price_change_1m: number | null;
  price_change_3m: number | null;
  price_change_6m: number | null;
}

export interface ConvictionComponents {
  eps_revision_momentum: number | null;   // 0-20
  price_momentum: number | null;          // 0-20
  valuation_discount: number | null;      // 0-20
  short_interest: number | null;          // 0-15
  analyst_consensus: number | null;       // 0-15
  piotroski_f_score: number | null;       // 0-10
}

export interface EstimatesSnapshot {
  ntm_eps_consensus: number | null;
  ntm_eps_revision_3m: number | null;
  ev_ntm_ebitda: number | null;
  analyst_count: number | null;
  mean_rating: number | null;
  consensus_label: string | null;
  short_interest_pct: number | null;
  price_target_median: number | null;
}

export interface PeerRecord {
  ticker: string;
  company_name: string;
  gics_sector: string | null;
  gics_industry_group: string | null;
  gics_industry: string | null;
  gics_sub_industry: string | null;
  market_cap_usd_mm: number | null;
  similarity_score: number;
  conviction_score: number | null;
  research_priority_score: number;
  score_components: ScoreComponents;
  conviction_components: ConvictionComponents | null;
  score_metadata: ScoreMetadata;
  fundamentals: FundamentalsSnapshot;
  estimates: EstimatesSnapshot | null;
  price: PriceSnapshot;
  // Extended fields
  description?: string;
  peer_reason?: string;
  pe_ratio?: number | null;
  forward_pe?: number | null;
  ev_ebitda?: number | null;
  price_sales?: number | null;
  debt_equity?: number | null;
  roe?: number | null;
  beta?: number;
  institutional_own?: number;
  gross_margin?: number | null;
}

export interface QueryInfo {
  ticker: string;
  company_name: string;
  gics_sector: string | null;
  gics_sub_industry: string | null;
  market_cap_usd_mm: number | null;
  as_of_date: string;
}

export interface PeerSearchResponse {
  query: QueryInfo;
  peers: PeerRecord[];
  total_candidates_evaluated: number;
  watchlist_size: number;
  computation_ms: number;
  cached: boolean;
  conviction_enabled: boolean;
  methodology_version: string;
}

export interface ThesisCard {
  ticker: string;
  company_name: string;
  rank: number;
  moat: string;
  drawdown_risk: string;
  catalyst: string;
  exit_criteria: string;
  conviction_rationale: string;
  generated_at: string;
  model_version: string;
  input_token_count: number | null;
  output_token_count: number | null;
}

export interface ThesisStreamEvent {
  event: 'card' | 'error' | 'done';
  rank: number | null;
  ticker: string | null;
  card: ThesisCard | null;
  error: string | null;
}

export interface PeerSearchRequest {
  ticker: string;
  watchlist_size: 10 | 25 | 50;
  region: 'US' | 'GLOBAL';
  use_transcripts: boolean;
  use_analyst_estimates: boolean;
  use_legacy_score: boolean;
  as_of_date: string | null;
  sector_lock: boolean;
  min_market_cap_usd: number | null;
  max_market_cap_usd: number | null;
  exclude_tickers: string[];
  generate_thesis: boolean;
}

export interface TickerSuggestion {
  ticker: string;
  company_name: string;
  gics_sector: string | null;
  market_cap_usd_mm: number | null;
}

export type SortKey = 'research_priority_score' | 'similarity_score' | 'conviction_score' | 'ticker' | 'market_cap_usd_mm';
export type SortDir = 'asc' | 'desc';

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
}

export interface UserResponse {
  user_id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

// ── Screener ──────────────────────────────────────────────────────────────────
export interface ScreenRecord {
  ticker: string;
  company_name: string;
  gics_sector: string | null;
  gics_sub_industry: string | null;
  market_cap_usd_mm: number | null;
  screen_score: number;
  piotroski_f_score: number | null;
  ntm_eps_revision_3m: number | null;
  short_interest_pct: number | null;
  consensus_label: string | null;
  analyst_count: number | null;
  ebitda_margin: number | null;
  fcf_margin: number | null;
  net_debt_ebitda: number | null;
  ev_ntm_ebitda: number | null;
  revenue_growth_yoy: number | null;
}

export interface ScreenResponse {
  results: ScreenRecord[];
  total_matched: number;
  as_of_date: string;
}

// ── Portfolio ─────────────────────────────────────────────────────────────────
export interface OverlapPeer {
  ticker: string;
  company_name: string;
  gics_sector: string | null;
  gics_sub_industry: string | null;
  market_cap_usd_mm: number | null;
  overlap_score: number;
  avg_rps: number;
  appears_in: number;
  n_queries: number;
  per_holding_rps: Record<string, number>;
  ebitda_margin: number | null;
  revenue_growth_yoy: number | null;
  piotroski_f_score: number | null;
  ntm_eps_revision_3m: number | null;
  consensus_label: string | null;
}

export interface PortfolioResponse {
  query_tickers: string[];
  not_found: string[];
  overlap_peers: OverlapPeer[];
  watchlist_size: number;
  computation_ms: number;
}

// ── Watchlist ─────────────────────────────────────────────────────────────────
export interface WatchlistItem {
  peer_ticker: string;
  peer_name: string;
  rps: number;
  similarity_score: number;
  conviction_score: number | null;
  captured_at: string;
}

export interface Watchlist {
  id: string;
  name: string;
  query_ticker: string;
  watchlist_size: number;
  sector_lock: boolean;
  notes: string | null;
  created_at: string;
  last_run_at: string | null;
  items: WatchlistItem[];
}
