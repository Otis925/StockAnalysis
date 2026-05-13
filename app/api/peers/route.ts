import { NextRequest, NextResponse } from 'next/server';
import { generatePeersResponse } from '@/lib/mockData';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ticker: string = (body.query_ticker ?? body.ticker ?? 'AAPL').toUpperCase();
  const watchlistSize: number = Number(body.watchlist_size ?? 25);

  const data = generatePeersResponse(ticker, watchlistSize);
  return NextResponse.json(data);
}
