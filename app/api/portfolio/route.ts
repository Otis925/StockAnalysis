import { NextRequest, NextResponse } from 'next/server';
import { generatePeersResponse, UNIVERSE } from '@/lib/mockData';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const tickers: string[] = (body.tickers ?? []).map((t: string) => t.toUpperCase());
  const watchlistSize: number = Number(body.watchlist_size ?? 10);

  if (tickers.length === 0) {
    return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
  }

  // Collect union of peers across all holdings
  const peerScoreMap = new Map<string, { sum: number; count: number; info: typeof UNIVERSE[0] | undefined }>();

  for (const ticker of tickers) {
    const result = generatePeersResponse(ticker, watchlistSize * 2);
    if (!result) continue;
    for (const peer of result.peers) {
      const existing = peerScoreMap.get(peer.ticker);
      const info = UNIVERSE.find((s) => s.ticker === peer.ticker);
      if (existing) {
        existing.sum += peer.similarity_score;
        existing.count += 1;
      } else {
        peerScoreMap.set(peer.ticker, { sum: peer.similarity_score, count: 1, info });
      }
    }
  }

  // Build overlap peers sorted by average score
  const overlaps = Array.from(peerScoreMap.entries())
    .filter(([t]) => !tickers.includes(t))
    .map(([ticker, { sum, count, info }]) => ({
      ticker,
      company_name: info?.company_name ?? ticker,
      overlap_count: count,
      avg_similarity_score: sum / count,
      query_tickers: tickers,
      gics_sector: info?.gics_sector ?? '',
      market_cap_usd_mm: info?.market_cap_usd_mm ?? null,
    }))
    .sort((a, b) => b.avg_similarity_score - a.avg_similarity_score)
    .slice(0, watchlistSize);

  // Per-holding breakdown
  const holdings = tickers.map((ticker) => {
    const result = generatePeersResponse(ticker, watchlistSize);
    return { ticker, peers: result?.peers ?? [] };
  });

  return NextResponse.json({
    query_tickers: tickers,
    overlap_peers: overlaps,
    holdings,
    as_of_date: new Date().toISOString().slice(0, 10),
  });
}
