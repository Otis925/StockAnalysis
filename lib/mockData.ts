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
  net_debt_ebitda: number | null;
  piotroski: number;
  description: string;      // one-sentence company description
  pe_ratio: number | null;
  forward_pe: number | null;
  ev_ebitda: number | null;
  price_sales: number | null;
  debt_equity: number | null;  // positive = more debt
  roe: number | null;          // return on equity, e.g. 0.35 = 35%
  beta: number;
  institutional_own: number;   // 0-1, fraction of shares held by institutions
}

export const UNIVERSE: StockInfo[] = [
  // ── Information Technology ────────────────────────────────────────────────
  { ticker: 'AAPL', company_name: 'Apple Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Technology Hardware & Equipment', gics_industry: 'Technology Hardware, Storage & Peripherals', gics_sub_industry: 'Technology Hardware, Storage & Peripherals', market_cap_usd_mm: 3_450_000, revenue_ttm_mm: 391_000, gross_margin: 0.46, ebitda_margin: 0.33, fcf_margin: 0.26, revenue_growth_yoy: 0.06, net_debt_ebitda: -1.2, piotroski: 7, description: 'Designs and sells iPhones, Macs, iPads, and services including the App Store and Apple Music.', pe_ratio: 28, forward_pe: 24, ev_ebitda: 22, price_sales: 8.1, debt_equity: 1.5, roe: 1.60, beta: 1.2, institutional_own: 0.61 },
  { ticker: 'MSFT', company_name: 'Microsoft Corporation', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Systems Software', market_cap_usd_mm: 3_200_000, revenue_ttm_mm: 245_000, gross_margin: 0.70, ebitda_margin: 0.54, fcf_margin: 0.35, revenue_growth_yoy: 0.16, net_debt_ebitda: -3.1, piotroski: 8, description: 'Develops Windows, Office, Azure cloud, and LinkedIn; the enterprise software and cloud leader.', pe_ratio: 34, forward_pe: 28, ev_ebitda: 24, price_sales: 12.8, debt_equity: 0.3, roe: 0.38, beta: 0.9, institutional_own: 0.73 },
  { ticker: 'NVDA', company_name: 'NVIDIA Corporation', gics_sector: 'Information Technology', gics_industry_group: 'Semiconductors & Semiconductor Equipment', gics_industry: 'Semiconductors & Semiconductor Equipment', gics_sub_industry: 'Semiconductors', market_cap_usd_mm: 3_100_000, revenue_ttm_mm: 130_000, gross_margin: 0.75, ebitda_margin: 0.62, fcf_margin: 0.50, revenue_growth_yoy: 1.22, net_debt_ebitda: -5.0, piotroski: 8, description: 'Designs GPUs powering AI training, gaming, and data center workloads; dominant in accelerated computing.', pe_ratio: 50, forward_pe: 35, ev_ebitda: 38, price_sales: 22.0, debt_equity: 0.4, roe: 0.70, beta: 1.9, institutional_own: 0.66 },
  { ticker: 'AMD', company_name: 'Advanced Micro Devices Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Semiconductors & Semiconductor Equipment', gics_industry: 'Semiconductors & Semiconductor Equipment', gics_sub_industry: 'Semiconductors', market_cap_usd_mm: 280_000, revenue_ttm_mm: 25_000, gross_margin: 0.53, ebitda_margin: 0.24, fcf_margin: 0.12, revenue_growth_yoy: 0.14, net_debt_ebitda: 0.3, piotroski: 6, description: 'Designs x86 CPUs and GPUs for PCs, servers, and gaming consoles; gaining share in data center AI.', pe_ratio: 45, forward_pe: 28, ev_ebitda: 28, price_sales: 10.5, debt_equity: 0.2, roe: 0.04, beta: 1.8, institutional_own: 0.71 },
  { ticker: 'INTC', company_name: 'Intel Corporation', gics_sector: 'Information Technology', gics_industry_group: 'Semiconductors & Semiconductor Equipment', gics_industry: 'Semiconductors & Semiconductor Equipment', gics_sub_industry: 'Semiconductors', market_cap_usd_mm: 100_000, revenue_ttm_mm: 54_000, gross_margin: 0.41, ebitda_margin: 0.12, fcf_margin: -0.08, revenue_growth_yoy: -0.14, net_debt_ebitda: 2.1, piotroski: 3, description: 'Manufactures x86 processors and is rebuilding its foundry business to compete with TSMC.', pe_ratio: null, forward_pe: null, ev_ebitda: 14, price_sales: 1.8, debt_equity: 0.5, roe: -0.10, beta: 1.0, institutional_own: 0.65 },
  { ticker: 'QCOM', company_name: 'Qualcomm Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Semiconductors & Semiconductor Equipment', gics_industry: 'Semiconductors & Semiconductor Equipment', gics_sub_industry: 'Semiconductors', market_cap_usd_mm: 195_000, revenue_ttm_mm: 39_000, gross_margin: 0.56, ebitda_margin: 0.32, fcf_margin: 0.22, revenue_growth_yoy: 0.09, net_debt_ebitda: 1.0, piotroski: 6, description: 'Designs wireless chips and modems for smartphones; licenses mobile technology standards globally.', pe_ratio: 17, forward_pe: 14, ev_ebitda: 14, price_sales: 4.9, debt_equity: 2.5, roe: 0.55, beta: 1.3, institutional_own: 0.72 },
  { ticker: 'CRM', company_name: 'Salesforce Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 310_000, revenue_ttm_mm: 36_000, gross_margin: 0.77, ebitda_margin: 0.30, fcf_margin: 0.32, revenue_growth_yoy: 0.09, net_debt_ebitda: 0.5, piotroski: 7, description: 'Sells cloud-based CRM software including Sales Cloud, Service Cloud, and the Data Cloud platform.', pe_ratio: 48, forward_pe: 28, ev_ebitda: 22, price_sales: 8.3, debt_equity: 0.2, roe: 0.09, beta: 1.2, institutional_own: 0.85 },
  { ticker: 'ORCL', company_name: 'Oracle Corporation', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Systems Software', market_cap_usd_mm: 490_000, revenue_ttm_mm: 56_000, gross_margin: 0.72, ebitda_margin: 0.42, fcf_margin: 0.22, revenue_growth_yoy: 0.07, net_debt_ebitda: 4.2, piotroski: 5, description: 'Provides enterprise database software, cloud applications, and infrastructure; growing in AI cloud.', pe_ratio: 42, forward_pe: 26, ev_ebitda: 22, price_sales: 8.5, debt_equity: null, roe: null, beta: 0.9, institutional_own: 0.44 },
  { ticker: 'ADBE', company_name: 'Adobe Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 190_000, revenue_ttm_mm: 21_000, gross_margin: 0.88, ebitda_margin: 0.44, fcf_margin: 0.38, revenue_growth_yoy: 0.11, net_debt_ebitda: -1.0, piotroski: 8, description: 'Sells cloud-based creative and document software including Photoshop, Illustrator, and Acrobat.', pe_ratio: 34, forward_pe: 24, ev_ebitda: 24, price_sales: 8.8, debt_equity: 0.5, roe: 0.38, beta: 1.2, institutional_own: 0.87 },
  { ticker: 'NOW', company_name: 'ServiceNow Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 220_000, revenue_ttm_mm: 11_000, gross_margin: 0.79, ebitda_margin: 0.25, fcf_margin: 0.30, revenue_growth_yoy: 0.22, net_debt_ebitda: -0.8, piotroski: 7, description: 'Provides cloud-based enterprise workflow automation software connecting IT, HR, and operations.', pe_ratio: 90, forward_pe: 52, ev_ebitda: 48, price_sales: 19.5, debt_equity: 0.2, roe: 0.09, beta: 1.1, institutional_own: 0.87 },
  { ticker: 'CSCO', company_name: 'Cisco Systems Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Technology Hardware & Equipment', gics_industry: 'Communications Equipment', gics_sub_industry: 'Communications Equipment', market_cap_usd_mm: 220_000, revenue_ttm_mm: 57_000, gross_margin: 0.64, ebitda_margin: 0.35, fcf_margin: 0.28, revenue_growth_yoy: 0.06, net_debt_ebitda: 0.0, piotroski: 6, description: 'Sells networking hardware, software, and security solutions for enterprise and service provider markets.', pe_ratio: 18, forward_pe: 15, ev_ebitda: 12, price_sales: 3.8, debt_equity: 0.3, roe: 0.30, beta: 0.8, institutional_own: 0.75 },
  { ticker: 'IBM', company_name: 'International Business Machines', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'IT Services', gics_sub_industry: 'IT Consulting & Other Services', market_cap_usd_mm: 210_000, revenue_ttm_mm: 62_000, gross_margin: 0.55, ebitda_margin: 0.22, fcf_margin: 0.12, revenue_growth_yoy: 0.02, net_debt_ebitda: 3.5, piotroski: 4, description: 'Provides hybrid cloud, AI consulting, and mainframe solutions; transforming under CEO Arvind Krishna.', pe_ratio: 24, forward_pe: 18, ev_ebitda: 14, price_sales: 3.3, debt_equity: null, roe: null, beta: 0.8, institutional_own: 0.57 },
  { ticker: 'PLTR', company_name: 'Palantir Technologies Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 80_000, revenue_ttm_mm: 2_900, gross_margin: 0.82, ebitda_margin: 0.13, fcf_margin: 0.18, revenue_growth_yoy: 0.21, net_debt_ebitda: -3.0, piotroski: 6, description: 'Builds AI-powered data analytics platforms for government intelligence and commercial enterprise clients.', pe_ratio: 200, forward_pe: 90, ev_ebitda: 75, price_sales: 25.0, debt_equity: 0.0, roe: 0.07, beta: 2.2, institutional_own: 0.45 },
  { ticker: 'SNOW', company_name: 'Snowflake Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 55_000, revenue_ttm_mm: 3_600, gross_margin: 0.67, ebitda_margin: -0.04, fcf_margin: 0.14, revenue_growth_yoy: 0.30, net_debt_ebitda: -2.5, piotroski: 5, description: 'Operates a cloud data platform enabling storage, analytics, and sharing of data across multiple clouds.', pe_ratio: null, forward_pe: null, ev_ebitda: null, price_sales: 14.0, debt_equity: 0.0, roe: -0.17, beta: 1.8, institutional_own: 0.72 },
  // ── Communication Services ────────────────────────────────────────────────
  { ticker: 'GOOG', company_name: 'Alphabet Inc.', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Interactive Media & Services', gics_sub_industry: 'Interactive Media & Services', market_cap_usd_mm: 2_200_000, revenue_ttm_mm: 350_000, gross_margin: 0.57, ebitda_margin: 0.34, fcf_margin: 0.24, revenue_growth_yoy: 0.14, net_debt_ebitda: -4.0, piotroski: 8, description: 'Operates Google Search, YouTube, and Google Cloud; the world\'s dominant digital advertising platform.', pe_ratio: 22, forward_pe: 18, ev_ebitda: 16, price_sales: 6.1, debt_equity: 0.1, roe: 0.30, beta: 1.0, institutional_own: 0.73 },
  { ticker: 'META', company_name: 'Meta Platforms Inc.', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Interactive Media & Services', gics_sub_industry: 'Interactive Media & Services', market_cap_usd_mm: 1_600_000, revenue_ttm_mm: 165_000, gross_margin: 0.81, ebitda_margin: 0.53, fcf_margin: 0.37, revenue_growth_yoy: 0.22, net_debt_ebitda: -4.5, piotroski: 8, description: 'Operates Facebook, Instagram, and WhatsApp; investing heavily in AI and augmented reality Metaverse.', pe_ratio: 25, forward_pe: 20, ev_ebitda: 15, price_sales: 9.5, debt_equity: 0.1, roe: 0.37, beta: 1.2, institutional_own: 0.75 },
  { ticker: 'NFLX', company_name: 'Netflix Inc.', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Entertainment', gics_sub_industry: 'Movies & Entertainment', market_cap_usd_mm: 490_000, revenue_ttm_mm: 39_000, gross_margin: 0.46, ebitda_margin: 0.26, fcf_margin: 0.16, revenue_growth_yoy: 0.15, net_debt_ebitda: 1.2, piotroski: 7, description: 'Streams TV shows and movies to 270M+ subscribers globally; expanding into gaming and live events.', pe_ratio: 42, forward_pe: 30, ev_ebitda: 28, price_sales: 12.2, debt_equity: 0.6, roe: 0.35, beta: 1.3, institutional_own: 0.82 },
  { ticker: 'DIS', company_name: 'The Walt Disney Company', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Entertainment', gics_sub_industry: 'Movies & Entertainment', market_cap_usd_mm: 185_000, revenue_ttm_mm: 91_000, gross_margin: 0.35, ebitda_margin: 0.14, fcf_margin: 0.06, revenue_growth_yoy: 0.04, net_debt_ebitda: 3.0, piotroski: 4, description: 'Operates Disney+, ESPN, theme parks, and film studios; restructuring around streaming profitability.', pe_ratio: 55, forward_pe: 22, ev_ebitda: 18, price_sales: 2.0, debt_equity: 0.6, roe: 0.04, beta: 1.2, institutional_own: 0.68 },
  // ── Consumer Discretionary ────────────────────────────────────────────────
  { ticker: 'AMZN', company_name: 'Amazon.com Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Retailing', gics_industry: 'Broadline Retail', gics_sub_industry: 'Broadline Retail', market_cap_usd_mm: 2_300_000, revenue_ttm_mm: 620_000, gross_margin: 0.49, ebitda_margin: 0.17, fcf_margin: 0.09, revenue_growth_yoy: 0.11, net_debt_ebitda: -1.5, piotroski: 7, description: 'Operates e-commerce, AWS cloud, Prime Video, and advertising; AWS is the dominant cloud platform.', pe_ratio: 40, forward_pe: 30, ev_ebitda: 18, price_sales: 3.6, debt_equity: 0.5, roe: 0.17, beta: 1.2, institutional_own: 0.65 },
  { ticker: 'TSLA', company_name: 'Tesla Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Automobiles & Components', gics_industry: 'Automobiles', gics_sub_industry: 'Automobile Manufacturers', market_cap_usd_mm: 850_000, revenue_ttm_mm: 97_000, gross_margin: 0.18, ebitda_margin: 0.13, fcf_margin: 0.04, revenue_growth_yoy: -0.01, net_debt_ebitda: -2.5, piotroski: 5, description: 'Manufactures electric vehicles, energy storage, and solar; developing Full Self-Driving software.', pe_ratio: 75, forward_pe: 80, ev_ebitda: 55, price_sales: 8.5, debt_equity: 0.1, roe: 0.09, beta: 2.4, institutional_own: 0.44 },
  { ticker: 'HD', company_name: 'The Home Depot Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Retailing', gics_industry: 'Specialty Retail', gics_sub_industry: 'Home Improvement Retail', market_cap_usd_mm: 370_000, revenue_ttm_mm: 157_000, gross_margin: 0.34, ebitda_margin: 0.19, fcf_margin: 0.10, revenue_growth_yoy: -0.03, net_debt_ebitda: 2.5, piotroski: 5, description: 'Operates home improvement retail stores selling tools, building materials, and appliances across North America.', pe_ratio: 24, forward_pe: 22, ev_ebitda: 16, price_sales: 2.3, debt_equity: null, roe: null, beta: 1.0, institutional_own: 0.72 },
  { ticker: 'MCD', company_name: "McDonald's Corporation", gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Services', gics_industry: 'Hotels, Restaurants & Leisure', gics_sub_industry: 'Restaurants', market_cap_usd_mm: 210_000, revenue_ttm_mm: 25_000, gross_margin: 0.56, ebitda_margin: 0.49, fcf_margin: 0.27, revenue_growth_yoy: 0.02, net_debt_ebitda: 5.5, piotroski: 4, description: 'Franchises fast food restaurants globally; generates most revenue from franchise fees and real estate.', pe_ratio: 25, forward_pe: 21, ev_ebitda: 18, price_sales: 8.2, debt_equity: null, roe: null, beta: 0.7, institutional_own: 0.72 },
  { ticker: 'NKE', company_name: 'NIKE Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Durables & Apparel', gics_industry: 'Textiles, Apparel & Luxury Goods', gics_sub_industry: 'Apparel, Accessories & Luxury Goods', market_cap_usd_mm: 90_000, revenue_ttm_mm: 51_000, gross_margin: 0.45, ebitda_margin: 0.15, fcf_margin: 0.09, revenue_growth_yoy: -0.10, net_debt_ebitda: 1.8, piotroski: 4, description: 'Designs and markets athletic footwear, apparel, and equipment; sells direct-to-consumer and through wholesale.', pe_ratio: 28, forward_pe: 25, ev_ebitda: 18, price_sales: 1.7, debt_equity: 0.8, roe: 0.35, beta: 1.0, institutional_own: 0.69 },
  { ticker: 'SBUX', company_name: 'Starbucks Corporation', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Services', gics_industry: 'Hotels, Restaurants & Leisure', gics_sub_industry: 'Restaurants', market_cap_usd_mm: 100_000, revenue_ttm_mm: 36_000, gross_margin: 0.28, ebitda_margin: 0.17, fcf_margin: 0.08, revenue_growth_yoy: -0.02, net_debt_ebitda: 3.8, piotroski: 3, description: 'Operates premium coffee chain globally; facing traffic challenges in China and North America.', pe_ratio: 28, forward_pe: 22, ev_ebitda: 15, price_sales: 2.7, debt_equity: null, roe: null, beta: 0.9, institutional_own: 0.72 },
  // ── Consumer Staples ──────────────────────────────────────────────────────
  { ticker: 'WMT', company_name: 'Walmart Inc.', gics_sector: 'Consumer Staples', gics_industry_group: 'Food & Staples Retailing', gics_industry: 'Consumer Staples Distribution & Retail', gics_sub_industry: 'Hypermarkets & Super Centers', market_cap_usd_mm: 720_000, revenue_ttm_mm: 680_000, gross_margin: 0.24, ebitda_margin: 0.06, fcf_margin: 0.02, revenue_growth_yoy: 0.05, net_debt_ebitda: 1.5, piotroski: 5, description: 'Operates the world\'s largest retail chain; Walmart+ and advertising are high-growth emerging segments.', pe_ratio: 38, forward_pe: 30, ev_ebitda: 22, price_sales: 1.0, debt_equity: 0.5, roe: 0.19, beta: 0.6, institutional_own: 0.30 },
  { ticker: 'COST', company_name: 'Costco Wholesale Corporation', gics_sector: 'Consumer Staples', gics_industry_group: 'Food & Staples Retailing', gics_industry: 'Consumer Staples Distribution & Retail', gics_sub_industry: 'Hypermarkets & Super Centers', market_cap_usd_mm: 400_000, revenue_ttm_mm: 245_000, gross_margin: 0.13, ebitda_margin: 0.04, fcf_margin: 0.02, revenue_growth_yoy: 0.07, net_debt_ebitda: 0.2, piotroski: 6, description: 'Operates membership-only warehouse clubs with low markups; membership fee revenue drives profitability.', pe_ratio: 55, forward_pe: 47, ev_ebitda: 36, price_sales: 1.6, debt_equity: 0.4, roe: 0.30, beta: 0.8, institutional_own: 0.70 },
  { ticker: 'PG', company_name: 'Procter & Gamble Co.', gics_sector: 'Consumer Staples', gics_industry_group: 'Household & Personal Products', gics_industry: 'Household Products', gics_sub_industry: 'Household Products', market_cap_usd_mm: 370_000, revenue_ttm_mm: 84_000, gross_margin: 0.51, ebitda_margin: 0.26, fcf_margin: 0.17, revenue_growth_yoy: 0.03, net_debt_ebitda: 1.4, piotroski: 6, description: 'Markets leading consumer brands including Tide, Pampers, Gillette, and Oral-B across 180+ countries.', pe_ratio: 26, forward_pe: 23, ev_ebitda: 20, price_sales: 4.4, debt_equity: 0.6, roe: 0.30, beta: 0.6, institutional_own: 0.67 },
  // ── Health Care ───────────────────────────────────────────────────────────
  { ticker: 'LLY', company_name: 'Eli Lilly and Company', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Pharmaceuticals', gics_sub_industry: 'Pharmaceuticals', market_cap_usd_mm: 860_000, revenue_ttm_mm: 45_000, gross_margin: 0.80, ebitda_margin: 0.36, fcf_margin: 0.22, revenue_growth_yoy: 0.32, net_debt_ebitda: 0.8, piotroski: 7, description: 'Develops blockbuster GLP-1 drugs Mounjaro and Zepbound for diabetes and obesity; high R&D pipeline.', pe_ratio: 60, forward_pe: 38, ev_ebitda: 42, price_sales: 18.8, debt_equity: 1.5, roe: 0.60, beta: 0.5, institutional_own: 0.82 },
  { ticker: 'UNH', company_name: 'UnitedHealth Group Inc.', gics_sector: 'Health Care', gics_industry_group: 'Health Care Equipment & Services', gics_industry: 'Health Care Providers & Services', gics_sub_industry: 'Managed Health Care', market_cap_usd_mm: 430_000, revenue_ttm_mm: 380_000, gross_margin: 0.24, ebitda_margin: 0.08, fcf_margin: 0.05, revenue_growth_yoy: 0.08, net_debt_ebitda: 0.8, piotroski: 7, description: 'America\'s largest health insurer; operates UnitedHealthcare and Optum pharmacy/care services unit.', pe_ratio: 15, forward_pe: 13, ev_ebitda: 12, price_sales: 1.1, debt_equity: 0.8, roe: 0.26, beta: 0.5, institutional_own: 0.88 },
  { ticker: 'JNJ', company_name: 'Johnson & Johnson', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Pharmaceuticals', gics_sub_industry: 'Pharmaceuticals', market_cap_usd_mm: 380_000, revenue_ttm_mm: 89_000, gross_margin: 0.70, ebitda_margin: 0.33, fcf_margin: 0.21, revenue_growth_yoy: 0.04, net_debt_ebitda: 0.4, piotroski: 7, description: 'Develops pharmaceutical drugs and MedTech devices; recently spun off Kenvue consumer health business.', pe_ratio: 16, forward_pe: 14, ev_ebitda: 12, price_sales: 4.2, debt_equity: 0.4, roe: 0.23, beta: 0.6, institutional_own: 0.73 },
  { ticker: 'ABBV', company_name: 'AbbVie Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Pharmaceuticals', gics_sub_industry: 'Pharmaceuticals', market_cap_usd_mm: 310_000, revenue_ttm_mm: 56_000, gross_margin: 0.71, ebitda_margin: 0.39, fcf_margin: 0.27, revenue_growth_yoy: 0.04, net_debt_ebitda: 2.1, piotroski: 6, description: 'Markets Humira, Skyrizi, and Rinvoq for immunology; diversifying pipeline to offset Humira biosimilar pressure.', pe_ratio: 18, forward_pe: 16, ev_ebitda: 14, price_sales: 5.5, debt_equity: null, roe: null, beta: 0.7, institutional_own: 0.72 },
  { ticker: 'TMO', company_name: 'Thermo Fisher Scientific Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Life Sciences Tools & Services', gics_sub_industry: 'Life Sciences Tools & Services', market_cap_usd_mm: 210_000, revenue_ttm_mm: 43_000, gross_margin: 0.42, ebitda_margin: 0.22, fcf_margin: 0.15, revenue_growth_yoy: -0.04, net_debt_ebitda: 2.8, piotroski: 5, description: 'Provides life sciences tools, analytical instruments, and contract manufacturing for pharma/biotech clients.', pe_ratio: 30, forward_pe: 24, ev_ebitda: 20, price_sales: 4.8, debt_equity: 0.9, roe: 0.13, beta: 0.8, institutional_own: 0.87 },
  { ticker: 'MRK', company_name: 'Merck & Co. Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Pharmaceuticals', gics_sub_industry: 'Pharmaceuticals', market_cap_usd_mm: 290_000, revenue_ttm_mm: 63_000, gross_margin: 0.76, ebitda_margin: 0.26, fcf_margin: 0.14, revenue_growth_yoy: 0.07, net_debt_ebitda: 0.9, piotroski: 6, description: 'Develops Keytruda cancer immunotherapy, Gardasil vaccine, and animal health products worldwide.', pe_ratio: 18, forward_pe: 14, ev_ebitda: 12, price_sales: 4.6, debt_equity: 0.5, roe: 0.36, beta: 0.6, institutional_own: 0.80 },
  // ── Financials ────────────────────────────────────────────────────────────
  { ticker: 'JPM', company_name: 'JPMorgan Chase & Co.', gics_sector: 'Financials', gics_industry_group: 'Banks', gics_industry: 'Banks', gics_sub_industry: 'Diversified Banks', market_cap_usd_mm: 710_000, revenue_ttm_mm: 167_000, gross_margin: 0.60, ebitda_margin: 0.42, fcf_margin: 0.18, revenue_growth_yoy: 0.14, net_debt_ebitda: 0.5, piotroski: 7, description: 'America\'s largest bank by assets; operates consumer banking, investment banking, and asset management.', pe_ratio: 13, forward_pe: 12, ev_ebitda: null, price_sales: 4.2, debt_equity: null, roe: 0.17, beta: 1.1, institutional_own: 0.71 },
  { ticker: 'BAC', company_name: 'Bank of America Corp.', gics_sector: 'Financials', gics_industry_group: 'Banks', gics_industry: 'Banks', gics_sub_industry: 'Diversified Banks', market_cap_usd_mm: 290_000, revenue_ttm_mm: 100_000, gross_margin: 0.54, ebitda_margin: 0.35, fcf_margin: 0.12, revenue_growth_yoy: 0.05, net_debt_ebitda: 0.8, piotroski: 6, description: 'Second-largest U.S. bank; strong consumer franchise with Merrill Lynch wealth management and BofA Securities.', pe_ratio: 14, forward_pe: 12, ev_ebitda: null, price_sales: 2.9, debt_equity: null, roe: 0.11, beta: 1.3, institutional_own: 0.68 },
  { ticker: 'V', company_name: 'Visa Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Financial Services', gics_sub_industry: 'Transaction & Payment Processing Services', market_cap_usd_mm: 590_000, revenue_ttm_mm: 36_000, gross_margin: 0.80, ebitda_margin: 0.67, fcf_margin: 0.54, revenue_growth_yoy: 0.10, net_debt_ebitda: -1.0, piotroski: 8, description: 'Operates the world\'s largest payment network enabling digital transactions in 200+ countries.', pe_ratio: 32, forward_pe: 27, ev_ebitda: 26, price_sales: 16.2, debt_equity: 0.6, roe: 0.49, beta: 0.9, institutional_own: 0.86 },
  { ticker: 'MA', company_name: 'Mastercard Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Financial Services', gics_sub_industry: 'Transaction & Payment Processing Services', market_cap_usd_mm: 470_000, revenue_ttm_mm: 27_000, gross_margin: 0.77, ebitda_margin: 0.57, fcf_margin: 0.46, revenue_growth_yoy: 0.12, net_debt_ebitda: -0.8, piotroski: 8, description: 'Operates a global payment network processing trillions in transactions for consumers and businesses.', pe_ratio: 36, forward_pe: 30, ev_ebitda: 28, price_sales: 17.2, debt_equity: 1.5, roe: 0.20, beta: 1.0, institutional_own: 0.86 },
  { ticker: 'GS', company_name: 'The Goldman Sachs Group Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Capital Markets', gics_sub_industry: 'Investment Banking & Brokerage', market_cap_usd_mm: 180_000, revenue_ttm_mm: 54_000, gross_margin: 0.65, ebitda_margin: 0.30, fcf_margin: 0.08, revenue_growth_yoy: 0.14, net_debt_ebitda: 1.5, piotroski: 5, description: 'Premier investment bank and asset manager; operates Global Banking & Markets and Asset & Wealth Management.', pe_ratio: 14, forward_pe: 12, ev_ebitda: null, price_sales: 3.3, debt_equity: null, roe: 0.11, beta: 1.4, institutional_own: 0.73 },
  // ── Energy ────────────────────────────────────────────────────────────────
  { ticker: 'XOM', company_name: 'Exxon Mobil Corporation', gics_sector: 'Energy', gics_industry_group: 'Energy', gics_industry: 'Oil, Gas & Consumable Fuels', gics_sub_industry: 'Integrated Oil & Gas', market_cap_usd_mm: 530_000, revenue_ttm_mm: 398_000, gross_margin: 0.31, ebitda_margin: 0.18, fcf_margin: 0.07, revenue_growth_yoy: -0.05, net_debt_ebitda: 0.3, piotroski: 6, description: 'Integrated oil and gas supermajor; operates upstream production, refining, and chemicals; low-cost producer.', pe_ratio: 14, forward_pe: 13, ev_ebitda: 8, price_sales: 1.3, debt_equity: 0.2, roe: 0.15, beta: 0.9, institutional_own: 0.61 },
  { ticker: 'CVX', company_name: 'Chevron Corporation', gics_sector: 'Energy', gics_industry_group: 'Energy', gics_industry: 'Oil, Gas & Consumable Fuels', gics_sub_industry: 'Integrated Oil & Gas', market_cap_usd_mm: 280_000, revenue_ttm_mm: 198_000, gross_margin: 0.27, ebitda_margin: 0.16, fcf_margin: 0.06, revenue_growth_yoy: -0.09, net_debt_ebitda: 0.5, piotroski: 5, description: 'Integrated energy company; top-tier upstream assets in Permian Basin and international deepwater fields.', pe_ratio: 14, forward_pe: 13, ev_ebitda: 7, price_sales: 1.4, debt_equity: 0.1, roe: 0.10, beta: 1.0, institutional_own: 0.64 },
  // ── Industrials ───────────────────────────────────────────────────────────
  { ticker: 'CAT', company_name: 'Caterpillar Inc.', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Machinery', gics_sub_industry: 'Construction Machinery & Heavy Transportation Equipment', market_cap_usd_mm: 180_000, revenue_ttm_mm: 67_000, gross_margin: 0.38, ebitda_margin: 0.22, fcf_margin: 0.13, revenue_growth_yoy: 0.03, net_debt_ebitda: 1.2, piotroski: 6, description: 'World\'s leading manufacturer of construction and mining equipment, engines, and financial products.', pe_ratio: 18, forward_pe: 16, ev_ebitda: 12, price_sales: 2.7, debt_equity: 1.5, roe: 0.65, beta: 1.1, institutional_own: 0.73 },
  { ticker: 'GE', company_name: 'GE Aerospace', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Aerospace & Defense', gics_sub_industry: 'Aerospace & Defense', market_cap_usd_mm: 200_000, revenue_ttm_mm: 36_000, gross_margin: 0.28, ebitda_margin: 0.15, fcf_margin: 0.10, revenue_growth_yoy: 0.10, net_debt_ebitda: 1.0, piotroski: 5, description: 'GE Aerospace designs and manufactures jet engines and aviation systems; recently separated from GE Vernova.', pe_ratio: 40, forward_pe: 28, ev_ebitda: 24, price_sales: 5.5, debt_equity: 0.4, roe: 0.20, beta: 1.1, institutional_own: 0.80 },
  { ticker: 'RTX', company_name: 'RTX Corporation', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Aerospace & Defense', gics_sub_industry: 'Aerospace & Defense', market_cap_usd_mm: 155_000, revenue_ttm_mm: 79_000, gross_margin: 0.25, ebitda_margin: 0.13, fcf_margin: 0.06, revenue_growth_yoy: 0.12, net_debt_ebitda: 2.5, piotroski: 5, description: 'Makes Pratt & Whitney aircraft engines, Collins Aerospace avionics, and Raytheon missile defense systems.', pe_ratio: 22, forward_pe: 18, ev_ebitda: 14, price_sales: 2.0, debt_equity: 0.7, roe: 0.10, beta: 0.9, institutional_own: 0.85 },

  // ── NEW: Networking / Infrastructure ─────────────────────────────────────────
  { ticker: 'ANET', company_name: 'Arista Networks Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Technology Hardware & Equipment', gics_industry: 'Communications Equipment', gics_sub_industry: 'Communications Equipment', market_cap_usd_mm: 110_000, revenue_ttm_mm: 7_000, gross_margin: 0.64, ebitda_margin: 0.38, fcf_margin: 0.32, revenue_growth_yoy: 0.19, net_debt_ebitda: -5.0, piotroski: 8, description: 'Designs and sells cloud networking switches and software for hyperscale data centers and financial trading firms.', pe_ratio: 48, forward_pe: 36, ev_ebitda: 38, price_sales: 15.2, debt_equity: 0.0, roe: 0.38, beta: 1.3, institutional_own: 0.78 },

  // ── NEW: Cybersecurity ────────────────────────────────────────────────────────
  { ticker: 'CRWD', company_name: 'CrowdStrike Holdings Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Systems Software', market_cap_usd_mm: 90_000, revenue_ttm_mm: 3_800, gross_margin: 0.75, ebitda_margin: 0.10, fcf_margin: 0.28, revenue_growth_yoy: 0.29, net_debt_ebitda: -2.0, piotroski: 6, description: 'Provides cloud-native endpoint security, threat intelligence, and identity protection via its Falcon platform.', pe_ratio: null, forward_pe: 75, ev_ebitda: 80, price_sales: 22.0, debt_equity: 0.4, roe: 0.05, beta: 1.5, institutional_own: 0.72 },
  { ticker: 'PANW', company_name: 'Palo Alto Networks Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Systems Software', market_cap_usd_mm: 120_000, revenue_ttm_mm: 8_200, gross_margin: 0.74, ebitda_margin: 0.18, fcf_margin: 0.35, revenue_growth_yoy: 0.16, net_debt_ebitda: -1.5, piotroski: 6, description: 'Sells next-generation firewall, SASE, and AI-driven security operations platform to enterprises worldwide.', pe_ratio: 100, forward_pe: 55, ev_ebitda: 62, price_sales: 14.2, debt_equity: 0.6, roe: 0.08, beta: 1.3, institutional_own: 0.76 },
  { ticker: 'ZS', company_name: 'Zscaler Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Systems Software', market_cap_usd_mm: 30_000, revenue_ttm_mm: 2_400, gross_margin: 0.78, ebitda_margin: 0.08, fcf_margin: 0.25, revenue_growth_yoy: 0.22, net_debt_ebitda: -2.5, piotroski: 5, description: 'Delivers zero-trust cloud security architecture that routes traffic through its global network of data centers.', pe_ratio: null, forward_pe: 50, ev_ebitda: 55, price_sales: 12.0, debt_equity: 0.3, roe: -0.05, beta: 1.6, institutional_own: 0.68 },
  { ticker: 'FTNT', company_name: 'Fortinet Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Systems Software', market_cap_usd_mm: 60_000, revenue_ttm_mm: 5_800, gross_margin: 0.77, ebitda_margin: 0.28, fcf_margin: 0.32, revenue_growth_yoy: 0.11, net_debt_ebitda: -1.0, piotroski: 7, description: 'Sells integrated cybersecurity hardware and software including FortiGate firewalls and SASE solutions.', pe_ratio: 40, forward_pe: 30, ev_ebitda: 28, price_sales: 10.0, debt_equity: 0.2, roe: 0.60, beta: 1.2, institutional_own: 0.75 },

  // ── NEW: AI / Data Infrastructure ─────────────────────────────────────────────
  { ticker: 'DDOG', company_name: 'Datadog Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 42_000, revenue_ttm_mm: 2_700, gross_margin: 0.81, ebitda_margin: 0.14, fcf_margin: 0.28, revenue_growth_yoy: 0.27, net_debt_ebitda: -3.0, piotroski: 7, description: 'Provides cloud monitoring, observability, and security analytics for development and operations teams.', pe_ratio: null, forward_pe: 65, ev_ebitda: 60, price_sales: 15.0, debt_equity: 0.0, roe: 0.04, beta: 1.7, institutional_own: 0.74 },
  { ticker: 'MDB', company_name: 'MongoDB Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 18_000, revenue_ttm_mm: 2_000, gross_margin: 0.74, ebitda_margin: 0.02, fcf_margin: 0.18, revenue_growth_yoy: 0.19, net_debt_ebitda: -2.0, piotroski: 5, description: 'Develops the leading NoSQL document database used by developers to build modern applications at scale.', pe_ratio: null, forward_pe: 40, ev_ebitda: 38, price_sales: 8.5, debt_equity: 0.2, roe: -0.12, beta: 1.8, institutional_own: 0.80 },
  { ticker: 'NET', company_name: 'Cloudflare Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Systems Software', market_cap_usd_mm: 34_000, revenue_ttm_mm: 1_700, gross_margin: 0.79, ebitda_margin: 0.05, fcf_margin: 0.12, revenue_growth_yoy: 0.28, net_debt_ebitda: -2.0, piotroski: 5, description: 'Operates a global network providing CDN, DDoS protection, zero-trust security, and serverless computing.', pe_ratio: null, forward_pe: 90, ev_ebitda: null, price_sales: 19.0, debt_equity: 0.4, roe: -0.10, beta: 1.9, institutional_own: 0.76 },
  { ticker: 'ARM', company_name: 'Arm Holdings plc', gics_sector: 'Information Technology', gics_industry_group: 'Semiconductors & Semiconductor Equipment', gics_industry: 'Semiconductors & Semiconductor Equipment', gics_sub_industry: 'Semiconductors', market_cap_usd_mm: 150_000, revenue_ttm_mm: 3_900, gross_margin: 0.96, ebitda_margin: 0.35, fcf_margin: 0.38, revenue_growth_yoy: 0.47, net_debt_ebitda: -4.0, piotroski: 7, description: 'Licenses its CPU architecture and semiconductor IP to virtually every smartphone, IoT, and AI chip maker globally.', pe_ratio: 220, forward_pe: 75, ev_ebitda: 90, price_sales: 37.0, debt_equity: 0.0, roe: 0.15, beta: 1.6, institutional_own: 0.25 },
  { ticker: 'SMCI', company_name: 'Super Micro Computer Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Technology Hardware & Equipment', gics_industry: 'Technology Hardware, Storage & Peripherals', gics_sub_industry: 'Technology Hardware, Storage & Peripherals', market_cap_usd_mm: 32_000, revenue_ttm_mm: 15_000, gross_margin: 0.14, ebitda_margin: 0.07, fcf_margin: 0.03, revenue_growth_yoy: 1.10, net_debt_ebitda: 1.0, piotroski: 5, description: 'Designs and manufactures high-performance servers and AI infrastructure optimized for NVIDIA GPU deployments.', pe_ratio: 18, forward_pe: 12, ev_ebitda: 10, price_sales: 2.0, debt_equity: 0.5, roe: 0.28, beta: 1.9, institutional_own: 0.48 },
  { ticker: 'WDAY', company_name: 'Workday Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'Software', gics_sub_industry: 'Application Software', market_cap_usd_mm: 58_000, revenue_ttm_mm: 8_400, gross_margin: 0.75, ebitda_margin: 0.22, fcf_margin: 0.26, revenue_growth_yoy: 0.16, net_debt_ebitda: -1.5, piotroski: 6, description: 'Provides cloud-based human capital management and financial management software for large enterprises.', pe_ratio: 58, forward_pe: 30, ev_ebitda: 32, price_sales: 6.6, debt_equity: 0.2, roe: 0.06, beta: 1.2, institutional_own: 0.84 },
  { ticker: 'TTD', company_name: 'The Trade Desk Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Software & Services', gics_industry: 'IT Services', gics_sub_industry: 'Internet Services & Infrastructure', market_cap_usd_mm: 35_000, revenue_ttm_mm: 2_400, gross_margin: 0.81, ebitda_margin: 0.28, fcf_margin: 0.30, revenue_growth_yoy: 0.26, net_debt_ebitda: -3.0, piotroski: 8, description: 'Operates the leading independent demand-side platform for programmatic digital advertising across all media channels.', pe_ratio: 60, forward_pe: 42, ev_ebitda: 48, price_sales: 14.0, debt_equity: 0.1, roe: 0.14, beta: 1.8, institutional_own: 0.78 },

  // ── NEW: Fintech / Payments ───────────────────────────────────────────────────
  { ticker: 'PYPL', company_name: 'PayPal Holdings Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Financial Services', gics_sub_industry: 'Transaction & Payment Processing Services', market_cap_usd_mm: 68_000, revenue_ttm_mm: 31_000, gross_margin: 0.46, ebitda_margin: 0.20, fcf_margin: 0.18, revenue_growth_yoy: 0.07, net_debt_ebitda: 0.0, piotroski: 6, description: 'Operates a global digital payments platform with Venmo, Braintree, and international payment services.', pe_ratio: 18, forward_pe: 14, ev_ebitda: 12, price_sales: 2.1, debt_equity: 0.3, roe: 0.17, beta: 1.5, institutional_own: 0.74 },
  { ticker: 'SQ', company_name: 'Block Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Financial Services', gics_sub_industry: 'Transaction & Payment Processing Services', market_cap_usd_mm: 38_000, revenue_ttm_mm: 22_000, gross_margin: 0.38, ebitda_margin: 0.06, fcf_margin: 0.10, revenue_growth_yoy: 0.11, net_debt_ebitda: 0.5, piotroski: 5, description: 'Operates Square merchant payment tools and Cash App personal finance platform for consumers and SMBs.', pe_ratio: 40, forward_pe: 22, ev_ebitda: 18, price_sales: 1.7, debt_equity: 0.4, roe: 0.04, beta: 2.1, institutional_own: 0.65 },
  { ticker: 'COIN', company_name: 'Coinbase Global Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Capital Markets', gics_sub_industry: 'Investment Banking & Brokerage', market_cap_usd_mm: 55_000, revenue_ttm_mm: 6_500, gross_margin: 0.85, ebitda_margin: 0.28, fcf_margin: 0.30, revenue_growth_yoy: 1.00, net_debt_ebitda: -2.0, piotroski: 6, description: 'Operates the largest U.S. regulated cryptocurrency exchange and custody platform for retail and institutional investors.', pe_ratio: 28, forward_pe: 22, ev_ebitda: 18, price_sales: 8.0, debt_equity: 0.2, roe: 0.20, beta: 3.0, institutional_own: 0.48 },

  // ── NEW: More Financials ──────────────────────────────────────────────────────
  { ticker: 'COF', company_name: 'Capital One Financial Corp.', gics_sector: 'Financials', gics_industry_group: 'Banks', gics_industry: 'Banks', gics_sub_industry: 'Consumer Finance', market_cap_usd_mm: 72_000, revenue_ttm_mm: 39_000, gross_margin: 0.60, ebitda_margin: 0.25, fcf_margin: 0.10, revenue_growth_yoy: 0.07, net_debt_ebitda: null, piotroski: 5, description: 'Operates a tech-forward consumer bank with a large credit card business and the Discover network acquisition.', pe_ratio: 13, forward_pe: 11, ev_ebitda: null, price_sales: 1.8, debt_equity: null, roe: 0.12, beta: 1.3, institutional_own: 0.88 },
  { ticker: 'AXP', company_name: 'American Express Company', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Consumer Finance', gics_sub_industry: 'Consumer Finance', market_cap_usd_mm: 210_000, revenue_ttm_mm: 65_000, gross_margin: 0.55, ebitda_margin: 0.28, fcf_margin: 0.15, revenue_growth_yoy: 0.09, net_debt_ebitda: null, piotroski: 6, description: 'Operates a global charge card, travel, and financial services network targeting premium consumer and business clients.', pe_ratio: 20, forward_pe: 17, ev_ebitda: null, price_sales: 3.2, debt_equity: null, roe: 0.33, beta: 1.1, institutional_own: 0.83 },
  { ticker: 'WFC', company_name: 'Wells Fargo & Company', gics_sector: 'Financials', gics_industry_group: 'Banks', gics_industry: 'Banks', gics_sub_industry: 'Diversified Banks', market_cap_usd_mm: 220_000, revenue_ttm_mm: 82_000, gross_margin: 0.52, ebitda_margin: 0.28, fcf_margin: 0.12, revenue_growth_yoy: 0.02, net_debt_ebitda: null, piotroski: 5, description: 'Fourth-largest U.S. bank; recovering from scandal-era asset cap with strong retail banking and mortgage operations.', pe_ratio: 13, forward_pe: 11, ev_ebitda: null, price_sales: 2.7, debt_equity: null, roe: 0.12, beta: 1.2, institutional_own: 0.77 },
  { ticker: 'MS', company_name: 'Morgan Stanley', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Capital Markets', gics_sub_industry: 'Investment Banking & Brokerage', market_cap_usd_mm: 190_000, revenue_ttm_mm: 58_000, gross_margin: 0.62, ebitda_margin: 0.28, fcf_margin: 0.10, revenue_growth_yoy: 0.12, net_debt_ebitda: null, piotroski: 5, description: 'Global investment bank and wealth manager; E*Trade integration expanded its mass-affluent wealth management reach.', pe_ratio: 17, forward_pe: 15, ev_ebitda: null, price_sales: 3.3, debt_equity: null, roe: 0.14, beta: 1.4, institutional_own: 0.82 },
  { ticker: 'BLK', company_name: 'BlackRock Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Capital Markets', gics_sub_industry: 'Asset Management & Custody Banks', market_cap_usd_mm: 150_000, revenue_ttm_mm: 20_000, gross_margin: 0.48, ebitda_margin: 0.38, fcf_margin: 0.34, revenue_growth_yoy: 0.13, net_debt_ebitda: 0.0, piotroski: 7, description: 'World\'s largest asset manager with $11T AUM; operates iShares ETF franchise and Aladdin risk management system.', pe_ratio: 24, forward_pe: 20, ev_ebitda: 18, price_sales: 7.4, debt_equity: 0.2, roe: 0.15, beta: 1.2, institutional_own: 0.80 },
  { ticker: 'SCHW', company_name: 'Charles Schwab Corporation', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Capital Markets', gics_sub_industry: 'Investment Banking & Brokerage', market_cap_usd_mm: 130_000, revenue_ttm_mm: 19_000, gross_margin: 0.55, ebitda_margin: 0.42, fcf_margin: 0.30, revenue_growth_yoy: -0.02, net_debt_ebitda: 0.0, piotroski: 5, description: 'Operates the largest U.S. retail brokerage platform; integrating TD Ameritrade and scaling advisory services.', pe_ratio: 26, forward_pe: 20, ev_ebitda: 18, price_sales: 6.8, debt_equity: null, roe: 0.09, beta: 1.3, institutional_own: 0.79 },

  // ── NEW: Crypto / Bitcoin Mining ──────────────────────────────────────────────
  { ticker: 'IREN', company_name: 'Iris Energy Ltd.', gics_sector: 'Information Technology', gics_industry_group: 'Technology Hardware & Equipment', gics_industry: 'Technology Hardware, Storage & Peripherals', gics_sub_industry: 'Technology Hardware, Storage & Peripherals', market_cap_usd_mm: 2_400, revenue_ttm_mm: 280, gross_margin: 0.42, ebitda_margin: 0.22, fcf_margin: -0.10, revenue_growth_yoy: 0.75, net_debt_ebitda: 2.0, piotroski: 4, description: 'Operates renewable-powered Bitcoin mining and AI compute data centers in North America and Australia.', pe_ratio: null, forward_pe: 18, ev_ebitda: 14, price_sales: 8.0, debt_equity: 0.8, roe: -0.05, beta: 3.5, institutional_own: 0.28 },
  { ticker: 'MARA', company_name: 'MARA Holdings Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Capital Markets', gics_sub_industry: 'Investment Banking & Brokerage', market_cap_usd_mm: 5_500, revenue_ttm_mm: 780, gross_margin: 0.45, ebitda_margin: 0.15, fcf_margin: -0.20, revenue_growth_yoy: 0.90, net_debt_ebitda: 3.0, piotroski: 3, description: 'One of the largest publicly traded Bitcoin miners by hashrate; holds significant Bitcoin on its balance sheet.', pe_ratio: null, forward_pe: 20, ev_ebitda: 18, price_sales: 7.0, debt_equity: 0.6, roe: -0.10, beta: 3.8, institutional_own: 0.32 },
  { ticker: 'RIOT', company_name: 'Riot Platforms Inc.', gics_sector: 'Financials', gics_industry_group: 'Diversified Financials', gics_industry: 'Capital Markets', gics_sub_industry: 'Investment Banking & Brokerage', market_cap_usd_mm: 3_800, revenue_ttm_mm: 380, gross_margin: 0.38, ebitda_margin: 0.10, fcf_margin: -0.25, revenue_growth_yoy: 0.60, net_debt_ebitda: 1.0, piotroski: 4, description: 'Operates large-scale Bitcoin mining facilities in Texas with power purchase agreements and capacity expansion plans.', pe_ratio: null, forward_pe: 22, ev_ebitda: 20, price_sales: 9.5, debt_equity: 0.2, roe: -0.08, beta: 3.5, institutional_own: 0.35 },
  { ticker: 'CLSK', company_name: 'CleanSpark Inc.', gics_sector: 'Information Technology', gics_industry_group: 'Technology Hardware & Equipment', gics_industry: 'Technology Hardware, Storage & Peripherals', gics_sub_industry: 'Technology Hardware, Storage & Peripherals', market_cap_usd_mm: 2_200, revenue_ttm_mm: 450, gross_margin: 0.40, ebitda_margin: 0.18, fcf_margin: -0.15, revenue_growth_yoy: 1.20, net_debt_ebitda: 1.5, piotroski: 4, description: 'Mines Bitcoin using predominantly sustainable energy; rapidly expanding hashrate through acquisitions of new facilities.', pe_ratio: null, forward_pe: 15, ev_ebitda: 12, price_sales: 4.8, debt_equity: 0.3, roe: -0.06, beta: 3.6, institutional_own: 0.30 },

  // ── NEW: Healthcare expansion ─────────────────────────────────────────────────
  { ticker: 'VRTX', company_name: 'Vertex Pharmaceuticals Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Biotechnology', gics_sub_industry: 'Biotechnology', market_cap_usd_mm: 130_000, revenue_ttm_mm: 11_000, gross_margin: 0.85, ebitda_margin: 0.42, fcf_margin: 0.38, revenue_growth_yoy: 0.12, net_debt_ebitda: -5.0, piotroski: 8, description: 'Dominates cystic fibrosis treatment with Trikafta; expanding into gene editing, pain, and kidney disease.', pe_ratio: 30, forward_pe: 22, ev_ebitda: 24, price_sales: 11.5, debt_equity: 0.0, roe: 0.25, beta: 0.4, institutional_own: 0.90 },
  { ticker: 'REGN', company_name: 'Regeneron Pharmaceuticals Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Biotechnology', gics_sub_industry: 'Biotechnology', market_cap_usd_mm: 90_000, revenue_ttm_mm: 14_500, gross_margin: 0.86, ebitda_margin: 0.38, fcf_margin: 0.30, revenue_growth_yoy: 0.08, net_debt_ebitda: -3.0, piotroski: 7, description: 'Develops Dupixent, EYLEA, and oncology antibodies; known for its Velocimmune antibody discovery platform.', pe_ratio: 24, forward_pe: 18, ev_ebitda: 16, price_sales: 6.2, debt_equity: 0.1, roe: 0.22, beta: 0.5, institutional_own: 0.84 },
  { ticker: 'MRNA', company_name: 'Moderna Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Biotechnology', gics_sub_industry: 'Biotechnology', market_cap_usd_mm: 16_000, revenue_ttm_mm: 3_200, gross_margin: 0.60, ebitda_margin: -0.30, fcf_margin: -0.40, revenue_growth_yoy: -0.60, net_debt_ebitda: -5.0, piotroski: 3, description: 'Pioneered mRNA vaccine technology; post-COVID revenue declining while building cancer vaccine and respiratory pipeline.', pe_ratio: null, forward_pe: null, ev_ebitda: null, price_sales: 5.0, debt_equity: 0.0, roe: -0.35, beta: 1.6, institutional_own: 0.72 },
  { ticker: 'AMGN', company_name: 'Amgen Inc.', gics_sector: 'Health Care', gics_industry_group: 'Pharmaceuticals, Biotechnology & Life Sciences', gics_industry: 'Biotechnology', gics_sub_industry: 'Biotechnology', market_cap_usd_mm: 145_000, revenue_ttm_mm: 33_000, gross_margin: 0.76, ebitda_margin: 0.36, fcf_margin: 0.25, revenue_growth_yoy: 0.19, net_debt_ebitda: 3.5, piotroski: 5, description: 'Biotechnology pioneer making blockbuster drugs for anemia, bone health, and inflammation plus biosimilars.', pe_ratio: 16, forward_pe: 13, ev_ebitda: 14, price_sales: 4.4, debt_equity: null, roe: null, beta: 0.5, institutional_own: 0.75 },
  { ticker: 'ISRG', company_name: 'Intuitive Surgical Inc.', gics_sector: 'Health Care', gics_industry_group: 'Health Care Equipment & Services', gics_industry: 'Health Care Equipment & Supplies', gics_sub_industry: 'Health Care Equipment', market_cap_usd_mm: 200_000, revenue_ttm_mm: 8_400, gross_margin: 0.68, ebitda_margin: 0.30, fcf_margin: 0.25, revenue_growth_yoy: 0.16, net_debt_ebitda: -3.0, piotroski: 8, description: 'Manufactures the da Vinci robotic surgical system; generates recurring revenue from instruments and service contracts.', pe_ratio: 75, forward_pe: 55, ev_ebitda: 58, price_sales: 23.0, debt_equity: 0.0, roe: 0.18, beta: 0.9, institutional_own: 0.84 },

  // ── NEW: Energy expansion ─────────────────────────────────────────────────────
  { ticker: 'COP', company_name: 'ConocoPhillips', gics_sector: 'Energy', gics_industry_group: 'Energy', gics_industry: 'Oil, Gas & Consumable Fuels', gics_sub_industry: 'Oil & Gas Exploration & Production', market_cap_usd_mm: 130_000, revenue_ttm_mm: 56_000, gross_margin: 0.38, ebitda_margin: 0.32, fcf_margin: 0.18, revenue_growth_yoy: -0.04, net_debt_ebitda: 0.2, piotroski: 7, description: 'Pure-play upstream oil and gas producer with low-cost assets in Permian, Eagle Ford, and international operations.', pe_ratio: 13, forward_pe: 12, ev_ebitda: 8, price_sales: 2.3, debt_equity: 0.3, roe: 0.18, beta: 1.1, institutional_own: 0.74 },
  { ticker: 'SLB', company_name: 'SLB (Schlumberger N.V.)', gics_sector: 'Energy', gics_industry_group: 'Energy', gics_industry: 'Energy Equipment & Services', gics_sub_industry: 'Oil & Gas Equipment & Services', market_cap_usd_mm: 60_000, revenue_ttm_mm: 36_000, gross_margin: 0.22, ebitda_margin: 0.18, fcf_margin: 0.08, revenue_growth_yoy: 0.10, net_debt_ebitda: 1.0, piotroski: 6, description: 'World\'s leading oilfield services company providing technology and solutions for oil and gas exploration and production.', pe_ratio: 16, forward_pe: 14, ev_ebitda: 10, price_sales: 1.7, debt_equity: 0.6, roe: 0.18, beta: 1.2, institutional_own: 0.76 },

  // ── NEW: Industrials expansion ────────────────────────────────────────────────
  { ticker: 'HON', company_name: 'Honeywell International Inc.', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Industrial Conglomerates', gics_sub_industry: 'Industrial Conglomerates', market_cap_usd_mm: 130_000, revenue_ttm_mm: 37_000, gross_margin: 0.34, ebitda_margin: 0.20, fcf_margin: 0.13, revenue_growth_yoy: 0.05, net_debt_ebitda: 1.5, piotroski: 6, description: 'Makes aerospace systems, building automation, safety products, and industrial process control technologies.', pe_ratio: 22, forward_pe: 18, ev_ebitda: 14, price_sales: 3.5, debt_equity: 1.0, roe: 0.30, beta: 0.9, institutional_own: 0.80 },
  { ticker: 'DE', company_name: 'Deere & Company', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Machinery', gics_sub_industry: 'Agricultural & Farm Machinery', market_cap_usd_mm: 140_000, revenue_ttm_mm: 52_000, gross_margin: 0.32, ebitda_margin: 0.20, fcf_margin: 0.12, revenue_growth_yoy: -0.15, net_debt_ebitda: 1.5, piotroski: 5, description: 'World\'s leading agricultural equipment manufacturer; adding autonomous farming and precision agriculture technology.', pe_ratio: 16, forward_pe: 15, ev_ebitda: 12, price_sales: 2.7, debt_equity: 2.0, roe: 0.50, beta: 1.0, institutional_own: 0.78 },
  { ticker: 'LMT', company_name: 'Lockheed Martin Corporation', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Aerospace & Defense', gics_sub_industry: 'Aerospace & Defense', market_cap_usd_mm: 140_000, revenue_ttm_mm: 72_000, gross_margin: 0.12, ebitda_margin: 0.11, fcf_margin: 0.08, revenue_growth_yoy: 0.05, net_debt_ebitda: 1.5, piotroski: 6, description: 'America\'s top defense contractor; makes F-35 fighters, missile systems, satellites, and classified programs.', pe_ratio: 18, forward_pe: 16, ev_ebitda: 14, price_sales: 1.9, debt_equity: null, roe: null, beta: 0.5, institutional_own: 0.81 },
  { ticker: 'BA', company_name: 'The Boeing Company', gics_sector: 'Industrials', gics_industry_group: 'Capital Goods', gics_industry: 'Aerospace & Defense', gics_sub_industry: 'Aerospace & Defense', market_cap_usd_mm: 115_000, revenue_ttm_mm: 66_000, gross_margin: 0.08, ebitda_margin: -0.05, fcf_margin: -0.08, revenue_growth_yoy: 0.17, net_debt_ebitda: null, piotroski: 2, description: 'Manufactures commercial aircraft including the 737 MAX and 787 Dreamliner; recovering from safety and production crises.', pe_ratio: null, forward_pe: 40, ev_ebitda: null, price_sales: 1.7, debt_equity: null, roe: null, beta: 1.3, institutional_own: 0.67 },
  { ticker: 'UPS', company_name: 'United Parcel Service Inc.', gics_sector: 'Industrials', gics_industry_group: 'Transportation', gics_industry: 'Air Freight & Logistics', gics_sub_industry: 'Air Freight & Logistics', market_cap_usd_mm: 90_000, revenue_ttm_mm: 89_000, gross_margin: 0.23, ebitda_margin: 0.12, fcf_margin: 0.07, revenue_growth_yoy: -0.08, net_debt_ebitda: 1.5, piotroski: 5, description: 'World\'s largest package delivery company; network spans 220+ countries serving B2B and e-commerce shippers.', pe_ratio: 22, forward_pe: 18, ev_ebitda: 12, price_sales: 1.0, debt_equity: null, roe: null, beta: 0.8, institutional_own: 0.68 },

  // ── NEW: Consumer Discretionary expansion ────────────────────────────────────
  { ticker: 'BKNG', company_name: 'Booking Holdings Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Services', gics_industry: 'Hotels, Restaurants & Leisure', gics_sub_industry: 'Hotels, Resorts & Cruise Lines', market_cap_usd_mm: 175_000, revenue_ttm_mm: 23_000, gross_margin: 0.84, ebitda_margin: 0.35, fcf_margin: 0.32, revenue_growth_yoy: 0.12, net_debt_ebitda: -1.0, piotroski: 7, description: 'Operates Booking.com, Priceline, and Kayak; the world\'s largest online travel agency by gross bookings.', pe_ratio: 25, forward_pe: 20, ev_ebitda: 18, price_sales: 7.5, debt_equity: null, roe: null, beta: 1.3, institutional_own: 0.88 },
  { ticker: 'ABNB', company_name: 'Airbnb Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Services', gics_industry: 'Hotels, Restaurants & Leisure', gics_sub_industry: 'Hotels, Resorts & Cruise Lines', market_cap_usd_mm: 70_000, revenue_ttm_mm: 11_000, gross_margin: 0.73, ebitda_margin: 0.24, fcf_margin: 0.26, revenue_growth_yoy: 0.12, net_debt_ebitda: -3.0, piotroski: 6, description: 'Operates a global home-sharing marketplace connecting travelers with hosts offering unique accommodation experiences.', pe_ratio: 45, forward_pe: 30, ev_ebitda: 25, price_sales: 6.2, debt_equity: 0.0, roe: 0.18, beta: 1.6, institutional_own: 0.61 },
  { ticker: 'LULU', company_name: 'lululemon athletica inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Durables & Apparel', gics_industry: 'Textiles, Apparel & Luxury Goods', gics_sub_industry: 'Apparel, Accessories & Luxury Goods', market_cap_usd_mm: 35_000, revenue_ttm_mm: 10_500, gross_margin: 0.58, ebitda_margin: 0.22, fcf_margin: 0.16, revenue_growth_yoy: 0.09, net_debt_ebitda: -1.5, piotroski: 7, description: 'Sells premium athletic apparel through company-owned stores, e-commerce, and Mirror home fitness platform.', pe_ratio: 25, forward_pe: 20, ev_ebitda: 16, price_sales: 3.3, debt_equity: 0.0, roe: 0.48, beta: 1.4, institutional_own: 0.86 },
  { ticker: 'CMG', company_name: 'Chipotle Mexican Grill Inc.', gics_sector: 'Consumer Discretionary', gics_industry_group: 'Consumer Services', gics_industry: 'Hotels, Restaurants & Leisure', gics_sub_industry: 'Restaurants', market_cap_usd_mm: 80_000, revenue_ttm_mm: 11_000, gross_margin: 0.26, ebitda_margin: 0.18, fcf_margin: 0.10, revenue_growth_yoy: 0.15, net_debt_ebitda: -1.0, piotroski: 7, description: 'Operates fast-casual Mexican restaurants with a focus on food quality, digital ordering, and drive-through Chipotlanes.', pe_ratio: 50, forward_pe: 38, ev_ebitda: 34, price_sales: 7.0, debt_equity: 0.0, roe: 0.52, beta: 1.1, institutional_own: 0.82 },

  // ── NEW: Consumer Staples expansion ──────────────────────────────────────────
  { ticker: 'KO', company_name: 'The Coca-Cola Company', gics_sector: 'Consumer Staples', gics_industry_group: 'Food, Beverage & Tobacco', gics_industry: 'Beverages', gics_sub_industry: 'Soft Drinks & Non-alcoholic Beverages', market_cap_usd_mm: 265_000, revenue_ttm_mm: 46_000, gross_margin: 0.60, ebitda_margin: 0.30, fcf_margin: 0.21, revenue_growth_yoy: 0.03, net_debt_ebitda: 2.5, piotroski: 5, description: 'World\'s leading beverage brand owner; sells concentrates and syrups to independent bottlers in 200+ countries.', pe_ratio: 24, forward_pe: 21, ev_ebitda: 20, price_sales: 5.7, debt_equity: null, roe: null, beta: 0.6, institutional_own: 0.66 },
  { ticker: 'PEP', company_name: 'PepsiCo Inc.', gics_sector: 'Consumer Staples', gics_industry_group: 'Food, Beverage & Tobacco', gics_industry: 'Beverages', gics_sub_industry: 'Soft Drinks & Non-alcoholic Beverages', market_cap_usd_mm: 200_000, revenue_ttm_mm: 92_000, gross_margin: 0.54, ebitda_margin: 0.18, fcf_margin: 0.11, revenue_growth_yoy: 0.02, net_debt_ebitda: 2.2, piotroski: 5, description: 'Global food and beverage giant; Frito-Lay snacks generate more profit than its beverage division.', pe_ratio: 22, forward_pe: 18, ev_ebitda: 15, price_sales: 2.2, debt_equity: 2.5, roe: 0.52, beta: 0.6, institutional_own: 0.71 },
  { ticker: 'PM', company_name: 'Philip Morris International Inc.', gics_sector: 'Consumer Staples', gics_industry_group: 'Food, Beverage & Tobacco', gics_industry: 'Tobacco', gics_sub_industry: 'Tobacco', market_cap_usd_mm: 220_000, revenue_ttm_mm: 36_000, gross_margin: 0.67, ebitda_margin: 0.42, fcf_margin: 0.30, revenue_growth_yoy: 0.06, net_debt_ebitda: 2.8, piotroski: 4, description: 'Sells Marlboro internationally and IQOS tobacco heating devices; pivoting toward smoke-free nicotine products.', pe_ratio: 20, forward_pe: 16, ev_ebitda: 14, price_sales: 6.1, debt_equity: null, roe: null, beta: 0.7, institutional_own: 0.73 },

  // ── NEW: Communication Services expansion ────────────────────────────────────
  { ticker: 'SPOT', company_name: 'Spotify Technology S.A.', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Entertainment', gics_sub_industry: 'Interactive Home Entertainment', market_cap_usd_mm: 75_000, revenue_ttm_mm: 15_000, gross_margin: 0.30, ebitda_margin: 0.10, fcf_margin: 0.12, revenue_growth_yoy: 0.20, net_debt_ebitda: -1.0, piotroski: 6, description: 'Largest music streaming service globally with 600M+ users; expanding into podcasts, audiobooks, and AI DJ features.', pe_ratio: 60, forward_pe: 45, ev_ebitda: 50, price_sales: 4.8, debt_equity: 0.3, roe: 0.05, beta: 1.5, institutional_own: 0.55 },
  { ticker: 'ROKU', company_name: 'Roku Inc.', gics_sector: 'Communication Services', gics_industry_group: 'Media & Entertainment', gics_industry: 'Entertainment', gics_sub_industry: 'Interactive Home Entertainment', market_cap_usd_mm: 11_000, revenue_ttm_mm: 4_100, gross_margin: 0.44, ebitda_margin: -0.05, fcf_margin: 0.08, revenue_growth_yoy: 0.16, net_debt_ebitda: -1.0, piotroski: 4, description: 'Operates the leading streaming platform in the U.S.; monetizes through advertising and content licensing revenue.', pe_ratio: null, forward_pe: 55, ev_ebitda: null, price_sales: 2.6, debt_equity: 0.2, roe: -0.10, beta: 2.0, institutional_own: 0.67 },

  // ── NEW: Real Estate / Infrastructure ────────────────────────────────────────
  { ticker: 'EQIX', company_name: 'Equinix Inc.', gics_sector: 'Real Estate', gics_industry_group: 'Real Estate', gics_industry: 'Real Estate Investment Trusts (REITs)', gics_sub_industry: 'Specialized REITs', market_cap_usd_mm: 75_000, revenue_ttm_mm: 8_800, gross_margin: 0.50, ebitda_margin: 0.38, fcf_margin: 0.02, revenue_growth_yoy: 0.08, net_debt_ebitda: 4.5, piotroski: 5, description: 'World\'s largest data center REIT; operates 260+ interconnection hubs globally for cloud and enterprise tenants.', pe_ratio: 75, forward_pe: 60, ev_ebitda: 28, price_sales: 8.5, debt_equity: 1.5, roe: 0.05, beta: 1.0, institutional_own: 0.90 },
  { ticker: 'AMT', company_name: 'American Tower Corporation', gics_sector: 'Real Estate', gics_industry_group: 'Real Estate', gics_industry: 'Real Estate Investment Trusts (REITs)', gics_sub_industry: 'Specialized REITs', market_cap_usd_mm: 92_000, revenue_ttm_mm: 11_000, gross_margin: 0.73, ebitda_margin: 0.52, fcf_margin: 0.12, revenue_growth_yoy: 0.01, net_debt_ebitda: 7.0, piotroski: 5, description: 'Largest global wireless tower REIT; owns 225,000+ cell towers leased to mobile carriers in 25+ countries.', pe_ratio: 80, forward_pe: 60, ev_ebitda: 22, price_sales: 8.3, debt_equity: null, roe: null, beta: 0.9, institutional_own: 0.92 },
  { ticker: 'NEE', company_name: 'NextEra Energy Inc.', gics_sector: 'Utilities', gics_industry_group: 'Utilities', gics_industry: 'Electric Utilities', gics_sub_industry: 'Electric Utilities', market_cap_usd_mm: 155_000, revenue_ttm_mm: 24_000, gross_margin: 0.40, ebitda_margin: 0.36, fcf_margin: -0.10, revenue_growth_yoy: 0.08, net_debt_ebitda: 6.0, piotroski: 5, description: 'America\'s largest electric utility and world\'s largest producer of wind and solar energy through FPL and NEER.', pe_ratio: 22, forward_pe: 18, ev_ebitda: 18, price_sales: 6.4, debt_equity: 1.5, roe: 0.12, beta: 0.5, institutional_own: 0.80 },

  // ── NEW: Materials ────────────────────────────────────────────────────────────
  { ticker: 'LIN', company_name: 'Linde plc', gics_sector: 'Materials', gics_industry_group: 'Materials', gics_industry: 'Chemicals', gics_sub_industry: 'Industrial Gases', market_cap_usd_mm: 210_000, revenue_ttm_mm: 33_000, gross_margin: 0.40, ebitda_margin: 0.34, fcf_margin: 0.16, revenue_growth_yoy: 0.05, net_debt_ebitda: 1.2, piotroski: 7, description: 'World\'s largest industrial gas company supplying oxygen, nitrogen, and hydrogen to manufacturing and healthcare.', pe_ratio: 30, forward_pe: 26, ev_ebitda: 22, price_sales: 6.4, debt_equity: 0.4, roe: 0.18, beta: 0.7, institutional_own: 0.84 },
  { ticker: 'FCX', company_name: 'Freeport-McMoRan Inc.', gics_sector: 'Materials', gics_industry_group: 'Materials', gics_industry: 'Metals & Mining', gics_sub_industry: 'Copper', market_cap_usd_mm: 50_000, revenue_ttm_mm: 23_000, gross_margin: 0.32, ebitda_margin: 0.24, fcf_margin: 0.08, revenue_growth_yoy: 0.06, net_debt_ebitda: 0.8, piotroski: 6, description: 'World\'s largest publicly traded copper mining company; critical copper supply for EV motors, power infrastructure.', pe_ratio: 18, forward_pe: 14, ev_ebitda: 12, price_sales: 2.1, debt_equity: 0.5, roe: 0.16, beta: 1.7, institutional_own: 0.70 },
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

// ── Peer reason generation ────────────────────────────────────────────────────

function generatePeerReason(query: StockInfo, peer: StockInfo, boost: number): string {
  const reasons: string[] = [];
  if (boost === 22) reasons.push(`operates in the same ${peer.gics_sub_industry} sub-industry`);
  else if (boost === 16) reasons.push(`shares the ${peer.gics_industry} industry`);
  else if (boost === 9) reasons.push(`is in the same ${peer.gics_sector} sector`);

  const revDiff = Math.abs(peer.revenue_growth_yoy - query.revenue_growth_yoy);
  if (revDiff < 0.10) reasons.push(`similar revenue growth (${(peer.revenue_growth_yoy*100).toFixed(0)}% vs ${(query.revenue_growth_yoy*100).toFixed(0)}%)`);

  const marginDiff = Math.abs(peer.ebitda_margin - query.ebitda_margin);
  if (marginDiff < 0.12) reasons.push(`comparable EBITDA margin profile`);

  const capRatio = peer.market_cap_usd_mm / query.market_cap_usd_mm;
  if (capRatio > 0.3 && capRatio < 3.0) reasons.push(`similar market capitalization range`);

  if (reasons.length === 0) reasons.push(`cross-sector correlation and business model overlap`);
  return `Selected due to ${reasons.slice(0, 3).join(', ')}.`;
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
    // Extended metrics
    description: peer.description,
    peer_reason: generatePeerReason(query, peer, boost),
    pe_ratio: peer.pe_ratio != null ? peer.pe_ratio + r.between(-3, 3) : null,
    forward_pe: peer.forward_pe != null ? peer.forward_pe + r.between(-2, 2) : null,
    ev_ebitda: peer.ev_ebitda != null ? peer.ev_ebitda + r.between(-2, 2) : null,
    price_sales: peer.price_sales != null ? peer.price_sales + r.between(-0.5, 0.5) : null,
    debt_equity: peer.debt_equity,
    roe: peer.roe,
    beta: peer.beta + r.between(-0.1, 0.1),
    institutional_own: peer.institutional_own,
    gross_margin: peer.gross_margin,
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
