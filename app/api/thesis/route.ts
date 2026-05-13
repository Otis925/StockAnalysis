import { NextRequest, NextResponse } from 'next/server';
import { generatePeersResponse, UNIVERSE } from '@/lib/mockData';

const THESIS_TEMPLATES = [
  (query: string, peer: string) => `**Revenue Quality**: ${peer} and ${query} share a subscription-driven revenue model with high recurring revenue mix (>70%), providing predictable cash flow and reducing cyclicality. Both demonstrate strong net revenue retention above 110%, indicating successful upsell motions.`,
  (query: string, peer: string) => `**Margin Expansion Pathway**: Like ${query}, ${peer} is in the early stages of a margin expansion cycle driven by operating leverage on a largely fixed cost base. Gross margins above 70% give both companies significant room to invest in R&D while still growing EBITDA margins.`,
  (query: string, peer: string) => `**Secular Tailwind Exposure**: ${peer} operates in the same high-growth addressable market as ${query}, benefiting from the same secular shift toward cloud-native infrastructure. Both companies have penetrated less than 5% of their TAM, suggesting a long runway for durable growth.`,
  (query: string, peer: string) => `**Capital Allocation Discipline**: ${peer} mirrors ${query}'s approach of reinvesting FCF into high-ROI organic growth opportunities while maintaining a conservative balance sheet. Neither company has diluted shareholders significantly over the past three years.`,
  (query: string, peer: string) => `**Competitive Moat**: Both ${query} and ${peer} benefit from deep integration into customer workflows, creating high switching costs. Net Promoter Scores and logo retention rates above 90% support the durability of their competitive positions.`,
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ticker: string = (body.query_ticker ?? body.ticker ?? 'AAPL').toUpperCase();
  const watchlistSize: number = Number(body.watchlist_size ?? 5);

  const peersData = generatePeersResponse(ticker, watchlistSize);
  const topPeers = (peersData?.peers ?? []).slice(0, Math.min(watchlistSize, 5));
  const queryInfo = UNIVERSE.find((s) => s.ticker === ticker);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < topPeers.length; i++) {
        const peer = topPeers[i];
        const peerInfo = UNIVERSE.find((s) => s.ticker === peer.ticker);
        const templateFn = THESIS_TEMPLATES[i % THESIS_TEMPLATES.length];
        const body = templateFn(queryInfo?.company_name ?? ticker, peerInfo?.company_name ?? peer.ticker);

        const event = {
          type: 'thesis_card',
          ticker: peer.ticker,
          company_name: peer.company_name,
          rank: i + 1,
          similarity_score: peer.similarity_score,
          conviction_score: peer.conviction_score,
          thesis: body,
          sector: peerInfo?.gics_sector ?? '',
          market_cap_usd_mm: peerInfo?.market_cap_usd_mm ?? null,
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        // Simulate streaming delay
        await new Promise((r) => setTimeout(r, 120));
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
