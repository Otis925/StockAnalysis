/**
 * Deterministic mock data for standalone Vercel deployment.
 * All values are seeded by ticker strings so the same query always returns
 * the same scores — useful for demos and testing without a backend.
 */

export interface StockInfo {
  ticker: string;
  company_name: string;
  gics_sector: string;
  gics_industry_group: string;
  gics_industry: string;
  gics_sub_industry: string;
  market_cap_usd_mm: number;
  revenue_ttm_mm: number;
  gross_margin: number;
  ebitda_margin: number;
  fcf_margin: number;
  revenue_growth_yoy: number;
  net_debt_ebitda: number;
  piotroski: number;
}

export const UNIVERSE: StockInfo[] = [
  // ── Information Technology ────────────────────────────────────────────────
  { ticker: 'AAPL', company_name: 'Apple Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Technology Hardware & Equipment', gics_industry: 'Technology Hardware, Storage & Peripherals', gics_sub_industry: 'Technology Hardware, Storage & Peripherals', market_cap_usd_mm: 3_450_000, revenue_ttm_mm: 391_000, gross_margin: 0.46, ebitda_margin: 0.33, fcf_margin: 0.26, revenue_growth_yoy: 0.06, net_debt_ebitda: -1.2, piotroski: 7 },
  { ticker: 'MSFT', company_name: 'Microsoft Corporation', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Systems Software', market_cap_usd_mm: 3_200_000, revenue_ttm_mm: 245_000, gross_margin: 0.70, ebitda_margin: 0.54, fcf_margin: 0.35, revenue_growth_yoy: 0.16, net_debt_ebitda: -3.1, piotroski: 8 },
  { ticker: 'NVDA', company_name: 'NVIDIA Corporation', gics_sector: 'Information Technology', gics_industry_group: 'Semiconductors & Semiconductor Equipment', gics_industry: 'Semiconductors & Semiconductor Equipment', gics_sub_industry: 'Semiconductors', market_cap_usd_mm: 3_100_000, revenue_ttm_mm: 130_000, gross_margin: 0.75, ebitda_margin: 0.62, fcf_margin: 0.50, revenue_growth_yoy: 1.22, net_debt_ebitda: -5.0, piotroski: 8 },
  { ticker: 'AMD', company_name: 'Advanced Micro Devices Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Semiconductors & Semiconductor Equipment', gics_industry: 'Semiconductors & Semiconductor Equipment', gics_sub_industry: 'Semiconductors', market_cap_usd_mm: 280_000, revenue_ttm_mm: 25_000, gross_margin: 0.53, ebitda_margin: 0.24, fcf_margin: 0.12, revenue_growth_yoy: 0.14, net_debt_ebitda: 0.3, piotroski: 6 },
  { ticker: 'INTC', company_name: 'Intel Corporation', gics_sector: 'Information Technology', gics_industry_group: 'Semiconductors & Semiconductor Equipment', gics_industry: 'Semiconductors & Semiconductor Equipment', gics_sub_industry: 'Semiconductors', market_cap_usd_mm: 100_000, revenue_ttm_mm: 54_000, gross_margin: 0.41, ebitda_margin: 0.12, fcf_margin: -0.08, revenue_growth_yoy: -0.14, net_debt_ebitda: 2.1, piotroski: 3 },
  { ticker: 'QCOM', company_name: 'Qualcomm Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Semiconductors & Semiconductor Equipment', gics_industry: 'Semiconductors & Semiconductor Equipment', gics_sub_industry: 'Semiconductors', market_cap_usd_mm: 195_000, revenue_ttm_mm: 39_000, gross_margin: 0.56, ebitda_margin: 0.32, fcf_margin: 0.22, revenue_growth_yoy: 0.09, net_debt_ebitda: 1.0, piotroski: 6 },
  { ticker: 'CRM', company_name: 'Salesforce Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 310_000, revenue_ttm_mm: 36_000, gross_margin: 0.77, ebitda_margin: 0.30, fcf_margin: 0.32, revenue_growth_yoy: 0.09, net_debt_ebitda: 0.5, piotroski: 7 },
  { ticker: 'ORCL', company_name: 'Oracle Corporation', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Systems Software', market_cap_usd_mm: 490_000, revenue_ttm_mm: 56_000, gross_margin: 0.72, ebitda_margin: 0.42, fcf_margin: 0.22, revenue_growth_yoy: 0.07, net_debt_ebitda: 4.2, piotroski: 5 },
  { ticker: 'ADBE', company_name: 'Adobe Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 190_000, revenue_ttm_mm: 21_000, gross_margin: 0.88, ebitda_margin: 0.44, fcf_margin: 0.38, revenue_growth_yoy: 0.11, net_debt_ebitda: -1.0, piotroski: 8 },
  { ticker: 'NOW', company_name: 'ServiceNow Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 220_000, revenue_ttm_mm: 11_000, gross_margin: 0.79, ebitda_margin: 0.25, fcf_margin: 0.30, revenue_growth_yoy: 0.22, net_debt_ebitda: -0.8, piotroski: 7 },
  { ticker: 'CSCO', company_name: 'Cisco Systems Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Technology Hardware & Equipment', gics_industry: 'Communications Equipment', gics_sub_industry: 'Communications Equipment', market_cap_usd_mm: 220_000, revenue_ttm_mm: 57_000, gross_margin: 0.64, ebitda_margin: 0.35, fcf_margin: 0.28, revenue_growth_yoy: 0.06, net_debt_ebitda: 0.0, piotroski: 6 },
  { ticker: 'IBM', company_name: 'International Business Machines', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'IT Services', gics_sub_industry: 'IT Consulting & Other Services', market_cap_usd_mm: 210_000, revenue_ttm_mm: 62_000, gross_margin: 0.55, ebitda_margin: 0.22, fcf_margin: 0.12, revenue_growth_yoy: 0.02, net_debt_ebitda: 3.5, piotroski: 4 },
  { ticker: 'PLTR', company_name: 'Palantir Technologies Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 80_000, revenue_ttm_mm: 2_900, gross_margin: 0.82, ebitda_margin: 0.13, fcf_margin: 0.18, revenue_growth_yoy: 0.21, net_debt_ebitda: -3.0, piotroski: 6 },
  { ticker: 'SNOW', company_name: 'Snowflake Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 55_000, revenue_ttm_mm: 3_600, gross_margin: 0.67, ebitda_margin: -0.04, fcf_margin: 0.14, revenue_growth_yoy: 0.30, net_debt_ebitda: -2.5, piotroski: 5 },
  // ── Communication Services ────────────────────────────────────────────────
  { ticker: 'GOOG', company_name: 'Alphabet Inc.', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Interactive Media & Services', gics_sub_industry: 'Interactive Media & Services', market_cap_usd_mm: 2_200_000, revenue_ttm_mm: 350_000, gross_margin: 0.57, ebitda_margin: 0.34, fcf_margin: 0.24, revenue_growth_yoy: 0.14, net_debt_ebitda: -4.0, piotroski: 8 },
  { ticker: 'META', company_name: 'Meta Platforms Inc.', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Interactive Media & Services', gics_sub_industry: 'Interactive Media & Services', market_cap_usd_mm: 1_600_000, revenue_ttm_mm: 165_000, gross_margin: 0.81, ebitda_margin: 0.53, fcf_margin: 0.37, revenue_growth_yoy: 0.22, net_debt_ebitda: -4.5, piotroski: 8 },
  { ticker: 'NFLX', company_name: 'Netflix Inc.', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Entertainment', gics_sub_industry: 'Movies & Entertainment', market_cap_usd_mm: 490_000, revenue_ttm_mm: 39_000, gross_margin: 0.46, ebitda_margin: 0.26, fcf_margin: 0.16, revenue_growth_yoy: 0.15, net_debt_ebitda: 1.2, piotroski: 7 },
  { ticker: 'DIS', company_name: 'The Walt Disney Company', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Entertainment', gics_sub_industry: 'Movies & Entertainment', market_cap_usd_mm: 185_000, revenue_ttm_mm: 91_000, gross_margin: 0.35, ebitda_margin: 0.14, fcf_margin: 0.06, revenue_growth_yoy: 0.04, net_debt_ebitda: 3.0, piotroski: 4 },
  // ── Consumer Discretionary ────────────────────────────────────────────────
  { ticker: 'AMZN', company_name: 'Amazon.com Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Retailing', gics_industry: 'Broadline Retail', gics_sub_industry: 'Broadline Retail', market_cap_usd_mm: 2_300_000, revenue_ttm_mm: 620_000, gross_margin: 0.49, ebitda_margin: 0.17, fcf_margin: 0.09, revenue_growth_yoy: 0.11, net_debt_ebitda: -1.5, piotroski: 7 },
  { ticker: 'TSLA', company_name: 'Tesla Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Automobiles & Components', gics_industry: 'Automobiles', gics_sub_industry: 'Automobile Manufacturers', market_cap_usd_mm: 850_000, revenue_ttm_mm: 97_000, gross_margin: 0.18, ebitda_margin: 0.13, fcf_margin: 0.04, revenue_growth_yoy: -0.01, net_debt_ebitda: -2.5, piotroski: 5 },
  { ticker: 'HD', company_name: 'The Home Depot Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Retailing', gics_industry: 'Specialty Retail', gics_sub_industry: 'Home Improvement Retail', market_cap_usd_mm: 370_000, revenue_ttm_mm: 157_000, gross_margin: 0.34, ebitda_margin: 0.19, fcf_margin: 0.10, revenue_growth_yoy: -0.03, net_debt_ebitda: 2.5, piotroski: 5 },
  { ticker: 'MCD', company_name: "McDonald's Corporation", gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Services', gics_industry: 'Hotels, Restaurants & Leisure', gics_sub_industry: 'Restaurants', market_cap_usd_mm: 210_000, revenue_ttm_mm: 25_000, gross_margin: 0.56, ebitda_margin: 0.49, fcf_margin: 0.27, revenue_growth_yoy: 0.02, net_debt_ebitda: 5.5, piotroski: 4 },
  { ticker: 'NKE', company_name: 'NIKE Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Durables & Apparel', gics_industry: 'Textiles, Apparel & Luxury Goods', gics_sub_industry: 'Apparel, Accessories & Luxury Goods', market_cap_usd_mm: 90_000, revenue_ttm_mm: 51_000, gross_margin: 0.45, ebitda_margin: 0.15, fcf_margin: 0.09, revenue_growth_yoy: -0.10, net_debt_ebitda: 1.8, piotroski: 4 },
  { ticker: 'SBUX', company_name: 'Starbucks Corporation', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Services', gics_industry: 'Hotels, Restaurants & Leisure', gics_sub_industry: 'Restaurants', market_cap_usd_mm: 100_000, revenue_ttm_mm: 36_000, gross_margin: 0.28, ebitda_margin: 0.17, fcf_margin: 0.08, revenue_growth_yoy: -0.02, net_debt_ebitda: 3.8, piotroski: 3 },
  // ── Consumer Staples ──────────────────────────────────────────────────────
  { ticker: 'WMT', company_name: 'Walmart Inc.', gics_sector: 'Consumer Staples', gics_industry_group: 'Food & Staples Retailing', gics_industry: 'Consumer Staples Distribution & Retail', gics_sub_industry: 'Hypermarkets & Super Centers', market_cap_usd_mm: 720_000, revenue_ttm_mm: 680_000, gross_margin: 0.24, ebitda_margin: 0.06, fcf_margin: 0.02, revenue_growth_yoy: 0.05, net_debt_ebitda: 1.5, piotroski: 5 },
  { ticker: 'COST', company_name: 'Costco Wholesale Corporation', gics_sector: 'Consumer Staples', gics_industry_group: 'Food & Staples Retailing', gics_industry: 'Consumer Staples Distribution & Retail', gics_sub_industry: 'Hypermarkets & Super Centers', market_cap_usd_mm: 400_000, revenue_ttm_mm: 245_000, gross_margin: 0.13, ebitda_margin: 0.04, fcf_margin: 0.02, revenue_growth_yoy: 0.07, net_debt_ebitda: 0.2, piotroski: 6 },
  { ticker: 'PG', company_name: 'Procter & Gamble Co.', gics_sector: 'Consumer Staples', gics_industry_group: 'Household & Personal Products', gics_industry: 'Household Products', gics_sub_industry: 'Household Products', market_cap_usd_mm: 370_000, revenue_ttm_mm: 84_000, gross_margin: 0.51, ebitda_margin: 0.26, fcf_margin: 0.17, revenue_growth_yoy: 0.03, net_debt_ebitda: 1.4, piotroski: 6 },
  // ── Health Care ───────────────────────────────────────────────────────────
  { ticker: 'LLY', company_name: 'Eli Lilly and Company', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Pharmaceuticals', gics_sub_industry: 'Pharmaceuticals', market_cap_usd_mm: 860_000, revenue_ttm_mm: 45_000, gross_margin: 0.80, ebitda_margin: 0.36, fcf_margin: 0.22, revenue_growth_yoy: 0.32, net_debt_ebitda: 0.8, piotroski: 7 },
  { ticker: 'UNH', company_name: 'UnitedHealth Group Inc.', gics_sector: 'Health Care', gics_industry_group: 'Health Care Equipment & Services', gics_industry: 'Health Care Providers & Services', gics_sub_industry: 'Managed Health Care', market_cap_usd_mm: 430_000, revenue_ttm_mm: 380_000, gross_margin: 0.24, ebitda_margin: 0.08, fcf_margin: 0.05, revenue_growth_yoy: 0.08, net_debt_ebitda: 0.8, piotroski: 7 },
  { ticker: 'JNJ', company_name: 'Johnson & Johnson', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Pharmaceuticals', gics_sub_industry: 'Pharmaceuticals', market_cap_usd_mm: 380_000, revenue_ttm_mm: 89_000, gross_margin: 0.70, ebitda_margin: 0.33, fcf_margin: 0.21, revenue_growth_yoy: 0.04, net_debt_ebitda: 0.4, piotroski: 7 },
  { ticker: 'ABBV', company_name: 'AbbVie Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Pharmaceuticals', gics_sub_industry: 'Pharmaceuticals', market_cap_usd_mm: 310_000, revenue_ttm_mm: 56_000, gross_margin: 0.71, ebitda_margin: 0.39, fcf_margin: 0.27, revenue_growth_yoy: 0.04, net_debt_ebitda: 2.1, piotroski: 6 },
  { ticker: 'TMO', company_name: 'Thermo Fisher Scientific Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Life Sciences Tools & Services', gics_sub_industry: 'Life Sciences Tools & Services', market_cap_usd_mm: 210_000, revenue_ttm_mm: 43_000, gross_margin: 0.42, ebitda_margin: 0.22, fcf_margin: 0.15, revenue_growth_yoy: -0.04, net_debt_ebitda: 2.8, piotroski: 5 },
  { ticker: 'MRK', company_name: 'Merck & Co. Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Pharmaceuticals', gics_sub_industry: 'Pharmaceuticals', market_cap_usd_mm: 290_000, revenue_ttm_mm: 63_000, gross_margin: 0.76, ebitda_margin: 0.26, fcf_margin: 0.14, revenue_growth_yoy: 0.07, net_debt_ebitda: 0.9, piotroski: 6 },
  // ── Financials ────────────────────────────────────────────────────────────
  { ticker: 'JPM', company_name: 'JPMorgan Chase & Co.', gics_sector: 'Financials', gics_industry_group: 'Banks', gics_industry: 'Banks', gics_sub_industry: 'Diversified Banks', market_cap_usd_mm: 710_000, revenue_ttm_mm: 167_000, gross_margin: 0.60, ebitda_margin: 0.42, fcf_margin: 0.18, revenue_growth_yoy: 0.14, net_debt_ebitda: 0.5, piotroski: 7 },
  { ticker: 'BAC', company_name: 'Bank of America Corp.', gics_sector: 'Financials', gics_industry_group: 'Banks', gics_industry: 'Banks', gics_sub_industry: 'Diversified Banks', market_cap_usd_mm: 290_000, revenue_ttm_mm: 100_000, gross_margin: 0.54, ebitda_margin: 0.35, fcf_margin: 0.12, revenue_growth_yoy: 0.05, net_debt_ebitda: 0.8, piotroski: 6 },
  { ticker: 'V', company_name: 'Visa Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Financial Services', gics_sub_industry: 'Transaction & Payment Processing Services', market_cap_usd_mm: 590_000, revenue_ttm_mm: 36_000, gross_margin: 0.80, ebitda_margin: 0.67, fcf_margin: 0.54, revenue_growth_yoy: 0.10, net_debt_ebitda: -1.0, piotroski: 8 },
  { ticker: 'MA', company_name: 'Mastercard Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Financial Services', gics_sub_industry: 'Transaction & Payment Processing Services', market_cap_usd_mm: 470_000, revenue_ttm_mm: 27_000, gross_margin: 0.77, ebitda_margin: 0.57, fcf_margin: 0.46, revenue_growth_yoy: 0.12, net_debt_ebitda: -0.8, piotroski: 8 },
  { ticker: 'GS', company_name: 'The Goldman Sachs Group Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Capital Markets', gics_sub_industry: 'Investment Banking & Brokerage', market_cap_usd_mm: 180_000, revenue_ttm_mm: 54_000, gross_margin: 0.65, ebitda_margin: 0.30, fcf_margin: 0.08, revenue_growth_yoy: 0.14, net_debt_ebitda: 1.5, piotroski: 5 },
  // ── Energy ────────────────────────────────────────────────────────────────
  { ticker: 'XOM', company_name: 'Exxon Mobil Corporation', gics_sector: 'Energy', gics_industry_group: 'Energy', gics_industry: 'Oil, Gas & Consumable Fuels', gics_sub_industry: 'Integrated Oil & Gas', market_cap_usd_mm: 530_000, revenue_ttm_mm: 398_000, gross_margin: 0.31, ebitda_margin: 0.18, fcf_margin: 0.07, revenue_growth_yoy: -0.05, net_debt_ebitda: 0.3, piotroski: 6 },
  { ticker: 'CVX', company_name: 'Chevron Corporation', gics_sector: 'Energy', gics_industry_group: 'Energy', gics_industry: 'Oil, Gas & Consumable Fuels', gics_sub_industry: 'Integrated Oil & Gas', market_cap_usd_mm: 280_000, revenue_ttm_mm: 198_000, gross_margin: 0.27, ebitda_margin: 0.16, fcf_margin: 0.06, revenue_growth_yoy: -0.09, net_debt_ebitda: 0.5, piotroski: 5 },
  // ── Industrials ───────────────────────────────────────────────────────────
  { ticker: 'CAT', company_name: 'Caterpillar Inc.', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Machinery', gics_sub_industry: 'Construction Machinery & Heavy Transportation Equipment', market_cap_usd_mm: 180_000, revenue_ttm_mm: 67_000, gross_margin: 0.38, ebitda_margin: 0.22, fcf_margin: 0.13, revenue_growth_yoy: 0.03, net_debt_ebitda: 1.2, piotroski: 6 },
  { ticker: 'GE', company_name: 'GE Aerospace', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Aerospace & Defense', gics_sub_industry: 'Aerospace & Defense', market_cap_usd_mm: 200_000, revenue_ttm_mm: 36_000, gross_margin: 0.28, ebitda_margin: 0.15, fcf_margin: 0.10, revenue_growth_yoy: 0.10, net_debt_ebitda: 1.0, piotroski: 5 },
  { ticker: 'RTX', company_name: 'RTX Corporation', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Aerospace & Defense', gics_sub_industry: 'Aerospace & Defense', market_cap_usd_mm: 155_000, revenue_ttm_mm: 79_000, gross_margin: 0.25, ebitda_margin: 0.13, fcf_margin: 0.06, revenue_growth_yoy: 0.12, net_debt_ebitda: 2.5, piotroski: 5 },
];

const TICKER_MAP = new Map(UNIVERSE.map(s => [s.ticker, s]));

export function getStock(ticker: string): StockInfo | undefined {
  return TICKER_MAP.get(ticker.toUpperCase());
}

// ── Deterministic PRNG ────────────────────────────────────────────────────────

function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makePrng(seed: number) {
  let s = seed;
  return {
    next(): number {
      s = (Math.imul(1664525, s) + 1013904223) | 0;
      return (s >>> 0) / 4294967296;
    },
    between(lo: number, hi: number): number {
      return lo + this.next() * (hi - lo);
    },
    int(lo: number, hi: number): number {
      return Math.round(this.between(lo, hi));
    },
  };
}

// ── Sector similarity boost ───────────────────────────────────────────────────

function sectorBoost(a: StockInfo, b: StockInfo): number {
  if (a.gics_sub_industry === b.gics_sub_industry) return 22;
  if (a.gics_industry === b.gics_industry) return 16;
  if (a.gics_sector === b.gics_sector) return 9;
  return 0;
}

// ── Score generation ──────────────────────────────────────────────────────────

export function generatePeerRecord(query: StockInfo, peer: StockInfo, rank: number) {
  const r = makePrng(fnv1a(`${query.ticker}:${peer.ticker}`));
  const boost = sectorBoost(query, peer);

  const base = r.between(28, 62);
  const simScore = Math.min(95, Math.round(base + boost));

  // Conviction components (0-100 each)
  const rEps = r.between(0, 100);
  const rPriceMom = r.between(0, 100);
  const rValuation = r.between(0, 100);
  const rSI = r.between(0, 100);
  const rConsensus = r.between(0, 100);
  const rPiotroski = r.between(0, 100);
  const convScore = Math.round(
    0.20 * rEps + 0.20 * rPriceMom + 0.20 * rValuation +
    0.15 * rSI + 0.15 * rConsensus + 0.10 * rPiotroski
  );

  const rps = Math.round(0.50 * simScore + 0.30 * convScore + 0.20 * 75);

  const asOf = new Date().toISOString().slice(0, 10);
  const fundEnd = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const filedDate = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);

  const epsRev = r.between(-0.12, 0.18);
  const si = r.between(0.005, 0.10);
  const rating = r.between(3.0, 4.8);
  const labels = ['Buy', 'Buy', 'Buy', 'Strong Buy', 'Hold'];
  const consensusLabel = labels[Math.floor(r.between(0, labels.length))];

  return {
    ticker: peer.ticker,
    company_name: peer.company_name,
    gics_sector: peer.gics_sector,
    gics_industry_group: peer.gics_industry_group,
    gics_industry: peer.gics_industry,
    gics_sub_industry: peer.gics_sub_industry,
    market_cap_usd_mm: peer.market_cap_usd_mm,
    similarity_score: simScore,
    conviction_score: convScore,
    research_priority_score: rps,
    score_components: {
      return_correlation: parseFloat(r.between(1, 9).toFixed(2)),
      beta_proximity: parseFloat(r.between(1, 9).toFixed(2)),
      volatility_similarity: parseFloat(r.between(1, 9).toFixed(2)),
      gics_alignment: boost > 0 ? parseFloat(r.between(5, 9).toFixed(2)) : parseFloat(r.between(0, 4).toFixed(2)),
      revenue_mix_cosine: parseFloat(r.between(1, 9).toFixed(2)),
      revenue_growth_proximity: parseFloat(r.between(1, 9).toFixed(2)),
      margin_profile_distance: parseFloat(r.between(1, 9).toFixed(2)),
      leverage_proximity: parseFloat(r.between(1, 9).toFixed(2)),
      valuation_proximity: parseFloat(r.between(1, 9).toFixed(2)),
      semantic_similarity: null,
    },
    conviction_components: {
      eps_revision_momentum: parseFloat((rEps * 0.20).toFixed(1)),
      price_momentum: parseFloat((rPriceMom * 0.20).toFixed(1)),
      valuation_discount: parseFloat((rValuation * 0.20).toFixed(1)),
      short_interest: parseFloat((rSI * 0.15).toFixed(1)),
      analyst_consensus: parseFloat((rConsensus * 0.15).toFixed(1)),
      piotroski_f_score: parseFloat((rPiotroski * 0.10).toFixed(1)),
    },
    score_metadata: {
      as_of_date: asOf,
      price_days_available: 252,
      fundamentals_period_end: fundEnd,
      fundamentals_filed_date: filedDate,
      fundamentals_source: 'mock',
      flags: [],
    },
    fundamentals: {
      revenue_ttm_mm: peer.revenue_ttm_mm,
      gross_margin: peer.gross_margin,
      ebitda_margin: peer.ebitda_margin,
      fcf_margin: peer.fcf_margin,
      net_debt_ebitda: peer.net_debt_ebitda,
      revenue_growth_yoy: peer.revenue_growth_yoy,
      piotroski_f_score: peer.piotroski,
    },
    estimates: {
      ntm_eps_consensus: parseFloat(r.between(2, 25).toFixed(2)),
      ntm_eps_revision_3m: parseFloat(epsRev.toFixed(4)),
      ev_ntm_ebitda: parseFloat(r.between(8, 35).toFixed(1)),
      analyst_count: r.int(8, 40),
      mean_rating: parseFloat(rating.toFixed(2)),
      consensus_label: consensusLabel,
      short_interest_pct: parseFloat(si.toFixed(4)),
      price_target_median: parseFloat(r.between(80, 600).toFixed(2)),
    },
    price: {
      last_price: parseFloat(r.between(20, 800).toFixed(2)),
      price_change_1m: parseFloat(r.between(-0.12, 0.18).toFixed(4)),
      price_change_3m: parseFloat(r.between(-0.18, 0.35).toFixed(4)),
      price_change_6m: parseFloat(r.between(-0.25, 0.55).toFixed(4)),
    },
  };
}

export function generatePeersResponse(queryTicker: string, watchlistSize: number = 25) {
  const query = getStock(queryTicker);
  if (!query) return null;

  const candidates = UNIVERSE.filter(s => s.ticker !== queryTicker);

  // Score all candidates
  const scored = candidates.map((peer, i) => ({
    peer,
    record: generatePeerRecord(query, peer, i + 1),
  }));

  // Sort by RPS descending
  scored.sort((a, b) => b.record.research_priority_score - a.record.research_priority_score);
  const top = scored.slice(0, watchlistSize);

  const asOf = new Date().toISOString().slice(0, 10);

  return {
    query: {
      ticker: query.ticker,
      company_name: query.company_name,
      gics_sector: query.gics_sector,
      gics_sub_industry: query.gics_sub_industry,
      market_cap_usd_mm: query.market_cap_usd_mm,
      as_of_date: asOf,
    },
    peers: top.map(({ record }) => record),
    total_candidates_evaluated: candidates.length,
    watchlist_size: watchlistSize,
    computation_ms: Math.floor(Math.random() * 300) + 120,
    cached: false,
    conviction_enabled: true,
    methodology_version: '3.0.0-mock',
  };
}

export function generateScreenRecords(filters: {
  sector?: string;
  min_market_cap_usd_mm?: number;
  max_market_cap_usd_mm?: number;
  min_screen_score?: number;
  min_piotroski?: number;
  watchlist_size?: number;
}) {
  const { sector, min_market_cap_usd_mm, max_market_cap_usd_mm, min_screen_score, min_piotroski, watchlist_size = 50 } = filters;

  const asOf = new Date().toISOString().slice(0, 10);

  let stocks = UNIVERSE.slice();

  if (sector) stocks = stocks.filter(s => s.gics_sector === sector);
  if (min_market_cap_usd_mm != null) stocks = stocks.filter(s => s.market_cap_usd_mm >= min_market_cap_usd_mm);
  if (max_market_cap_usd_mm != null) stocks = stocks.filter(s => s.market_cap_usd_mm <= max_market_cap_usd_mm);
  if (min_piotroski != null) stocks = stocks.filter(s => s.piotroski >= min_piotroski);

  const records = stocks.map(s => {
    const r = makePrng(fnv1a(`screen:${s.ticker}`));
    const epsRev = r.between(-0.08, 0.20);
    const si = r.between(0.005, 0.08);
    const rating = r.between(3.0, 4.8);
    const labels = ['Buy', 'Strong Buy', 'Buy', 'Hold'];
    const consensusLabel = labels[Math.floor(r.between(0, labels.length))];

    // Screen score: absolute composite
    const pScore = 20 * s.piotroski / 9;
    const epsScore = 20 * Math.min(Math.max((epsRev + 0.5) / 1.0, 0), 1);
    const siScore = 20 * (1 - Math.min(si / 0.5, 1));
    const ratingScore = 20 * (rating - 1) / 4;
    const ebitdaScore = 20 * Math.min(Math.max(s.ebitda_margin / 0.40, 0), 1);
    const screenScore = parseFloat((pScore + epsScore + siScore + ratingScore + ebitdaScore).toFixed(1));

    return {
      ticker: s.ticker,
      company_name: s.company_name,
      gics_sector: s.gics_sector,
      gics_sub_industry: s.gics_sub_industry,
      market_cap_usd_mm: s.market_cap_usd_mm,
      screen_score: screenScore,
      revenue_growth_yoy: s.revenue_growth_yoy,
      ebitda_margin: s.ebitda_margin,
      fcf_margin: s.fcf_margin,
      net_debt_ebitda: s.net_debt_ebitda,
      piotroski_f_score: s.piotroski,
      ntm_eps_revision_3m: parseFloat(epsRev.toFixed(4)),
      short_interest_pct: parseFloat(si.toFixed(4)),
      consensus_label: consensusLabel,
      analyst_count: r.int(8, 40),
      ev_ntm_ebitda: parseFloat(r.between(8, 35).toFixed(1)),
    };
  });

  const filtered = min_screen_score != null
    ? records.filter(r => r.screen_score >= min_screen_score)
    : records;

  filtered.sort((a, b) => b.screen_score - a.screen_score);
  const total_matched = filtered.length;

  return { results: filtered.slice(0, watchlist_size), total_matched, as_of_date: asOf };
}
