import { NextRequest, NextResponse } from 'next/server';
import { generatePeersResponse, UNIVERSE } from '@/lib/mockData';
import type { ThesisCard } from '@/lib/types';

const MOAT_TEMPLATES = [
  (query: string, peer: string) =>
    `${peer} and ${query} share deep platform integration and high switching costs. Customers typically take 12–18 months to fully onboard, creating durable revenue retention above 90% even in macro downturns. The combined network effects from shared data and workflow integrations form a compounding moat that widens with scale.`,
  (query: string, peer: string) =>
    `Like ${query}, ${peer} benefits from proprietary technology that competitors cannot easily replicate. Its intellectual property portfolio and R&D reinvestment rate (>20% of revenue) sustain a cost-of-innovation advantage. First-mover positioning in a nascent market segment has translated into dominant market share and pricing power.`,
  (query: string, peer: string) =>
    `${peer} mirrors ${query}'s subscription and recurring revenue model, generating predictable cash flows with limited capital intensity. Gross margins above 70% fund continued product investment without equity dilution. The company's installed base and multi-year contracts provide revenue visibility extending 18–24 months.`,
  (query: string, peer: string) =>
    `Both ${query} and ${peer} operate in markets with significant regulatory and certification barriers. These non-economic moats — accreditations, compliance approvals, and government contract vehicles — protect pricing and extend contract cycles to 3–5 years. Customer concentration risk is mitigated by a diversified enterprise base.`,
  (query: string, peer: string) =>
    `${peer}'s moat stems from the same secular tailwind driving ${query}: enterprise digital transformation. Its platform is deeply embedded in mission-critical workflows, making removal prohibitively costly for customers. Cross-sell rates and net revenue retention above 115% demonstrate the compounding value of the platform strategy.`,
];

const RISK_TEMPLATES = [
  (ticker: string) =>
    `Key downside risk for ${ticker} is a macro-driven enterprise spending freeze. IT budgets are the first to be cut in a recession, and with 60%+ revenue from discretionary software spend, a contraction could pressure near-term growth and trigger multiple compression. Monitor: quarterly net new ARR, churn rates, and CIO survey data.`,
  (ticker: string) =>
    `${ticker} faces competitive risk from hyperscaler encroachment (AWS, Azure, GCP) building native alternatives to its core product. If cloud vendors bundle equivalent functionality at zero marginal cost, the TAM compresses and pricing power erodes. Watch for product roadmap announcements from major cloud platforms.`,
  (ticker: string) =>
    `Valuation remains the primary risk for ${ticker}. At current multiples, the market already prices in sustained 25%+ growth for 3+ years. Any miss versus consensus — whether top-line, margin, or guidance — could trigger a 20-30% drawdown. The stock requires execution precision with no room for error.`,
  (ticker: string) =>
    `${ticker}'s geographic concentration creates FX and geopolitical exposure. Revenue outside North America carries currency headwinds in a strong-dollar environment, and any trade policy escalation could disrupt supply chains or customer relationships in key international markets.`,
  (ticker: string) =>
    `Insider ownership dilution and high stock-based compensation at ${ticker} are structural concerns. SBC as a percentage of revenue exceeds 20%, meaning reported EPS overstates true economic earnings. Monitor free cash flow conversion and diluted share count growth as key health indicators.`,
];

const CATALYST_TEMPLATES = [
  (ticker: string) =>
    `Near-term catalyst: ${ticker}'s next earnings print is expected to show accelerating net new customer additions as the recent product refresh drives upgrade cycles. Analyst consensus is positioned conservatively, creating room for a positive EPS and revenue revision cycle over the next 2 quarters.`,
  (ticker: string) =>
    `${ticker} is poised to benefit from the current AI infrastructure build-out cycle. Management has guided to meaningful AI-related revenue inflection in H2, and channel checks suggest the pipeline is strengthening. A confirmed AI workload win from a hyperscaler customer would be a major re-rating catalyst.`,
  (ticker: string) =>
    `The upcoming analyst day for ${ticker} is expected to include a multi-year margin expansion roadmap. If management raises long-term EBITDA targets to 30%+, the street is likely to revise higher and close the valuation gap to software peers. This represents a binary event worth monitoring closely.`,
  (ticker: string) =>
    `${ticker} is entering a new product cycle with a major platform release in the next quarter. Early beta customer feedback is positive, and the expanded functionality addresses a $5B+ incremental TAM. A successful launch would validate the platform strategy and support premium valuation multiples.`,
  (ticker: string) =>
    `Market share gain from a weakened competitor is the key catalyst for ${ticker}. A recent rival's service disruption has accelerated competitive displacement conversations. If ${ticker} closes 2+ enterprise migrations this quarter, it signals durable share gain momentum and supports upward EPS revisions.`,
];

const EXIT_TEMPLATES = [
  (ticker: string) =>
    `Exit ${ticker} if: (1) growth decelerates below 15% YoY for two consecutive quarters, (2) gross margin compresses more than 300bps below consensus, or (3) a hyperscaler launches a directly competing product with equivalent functionality at meaningfully lower price points. Re-evaluate position sizing above 35x forward EV/Sales.`,
  (ticker: string) =>
    `Reduce exposure to ${ticker} if the conviction score deteriorates below 45 for two consecutive monthly reviews, or if insider selling accelerates beyond $50M in a single quarter without a stated plan (10b5-1). A meaningful miss on net revenue retention — below 105% — would also trigger a position review.`,
  (ticker: string) =>
    `The thesis for ${ticker} breaks if enterprise churn accelerates or if a key customer (>5% of revenue) discloses a vendor switch. Additionally, a balance sheet stress event — covenant breach or credit downgrade — would require immediate reassessment given the leverage profile. Monitor quarterly debt covenants.`,
  (ticker: string) =>
    `Exit criteria for ${ticker}: forward P/E expansion beyond 60x without corresponding earnings acceleration, or if the company moves toward a major M&A transaction that meaningfully increases leverage (Net Debt/EBITDA > 4x). Preserve gains by trailing a 15% stop from recent highs.`,
  (ticker: string) =>
    `The ${ticker} thesis is invalidated if regulatory risk materializes — specifically, antitrust action, data privacy fines exceeding 2% of revenue, or forced structural remedies. Also exit on sustained analyst price target reductions from 3+ sell-side firms on fundamental (not just valuation) grounds.`,
];

const CONVICTION_TEMPLATES = [
  (ticker: string, sim: number) =>
    `Similarity score of ${sim.toFixed(0)} places ${ticker} in the top quartile of structural peers. Positive EPS revision momentum over the trailing 3 months and low short interest (<5%) support a constructive stance. The conviction score reflects above-average financial health (Piotroski F-Score ≥ 7) and improving analyst sentiment.`,
  (ticker: string, sim: number) =>
    `${ticker} earns a high conviction rating due to its ${sim.toFixed(0)}/100 similarity profile combined with strong consensus upgrade momentum (+2 upgrades in last 30 days). Price momentum remains positive on a 3-month and 6-month basis, while valuation remains at a discount to its 5-year historical average.`,
  (ticker: string, sim: number) =>
    `With a similarity score of ${sim.toFixed(0)}, ${ticker} aligns closely on revenue model, margin structure, and growth trajectory. The conviction score reflects below-average short interest, positive earnings revisions, and improving free cash flow conversion — three factors historically predictive of near-term outperformance.`,
  (ticker: string, sim: number) =>
    `Conviction for ${ticker} (sim: ${sim.toFixed(0)}) is supported by institutional accumulation (+3% ownership increase in the trailing quarter) and a strong Piotroski score indicating financial quality. Analyst consensus skews toward Buy/Strong Buy with a median price target implying 18%+ upside to current levels.`,
  (ticker: string, sim: number) =>
    `The ${sim.toFixed(0)}/100 similarity score for ${ticker} reflects strong alignment on sector, growth profile, and capital structure. Near-term conviction is supported by positive earnings revision breadth (>60% of estimates moving up) and an improving short interest trend — suggesting reduced bear conviction in the name.`,
];

function pickTemplate<T>(arr: T[], idx: number): T {
  return arr[Math.abs(idx) % arr.length];
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ticker: string = (body.query_ticker ?? body.ticker ?? 'AAPL').toUpperCase();
  const watchlistSize: number = Number(body.watchlist_size ?? 5);

  const peersData = generatePeersResponse(ticker, watchlistSize);
  const topPeers = (peersData?.peers ?? []).slice(0, Math.min(watchlistSize, 5));
  const queryInfo = UNIVERSE.find((s) => s.ticker === ticker);

  const cards: ThesisCard[] = topPeers.map((peer, i) => {
    const peerInfo = UNIVERSE.find((s) => s.ticker === peer.ticker);
    const queryName = queryInfo?.company_name ?? ticker;
    const peerName = peerInfo?.company_name ?? peer.ticker;

    return {
      ticker: peer.ticker,
      company_name: peer.company_name,
      rank: i + 1,
      moat: pickTemplate(MOAT_TEMPLATES, i)(queryName, peerName),
      drawdown_risk: pickTemplate(RISK_TEMPLATES, i + 1)(peer.ticker),
      catalyst: pickTemplate(CATALYST_TEMPLATES, i + 2)(peer.ticker),
      exit_criteria: pickTemplate(EXIT_TEMPLATES, i + 3)(peer.ticker),
      conviction_rationale: pickTemplate(CONVICTION_TEMPLATES, i + 4)(peer.ticker, peer.similarity_score),
      generated_at: new Date().toISOString(),
      model_version: 'mock-v2',
      input_token_count: null,
      output_token_count: null,
    };
  });

  return NextResponse.json({ cards, query_ticker: ticker });
}
