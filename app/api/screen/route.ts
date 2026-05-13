import { NextRequest, NextResponse } from 'next/server';
import { generateScreenRecords } from '@/lib/mockData';

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const filters = {
    sector: p.get('sector') ?? undefined,
    min_market_cap_usd_mm: p.has('min_market_cap_usd_mm') ? Number(p.get('min_market_cap_usd_mm')) : undefined,
    max_market_cap_usd_mm: p.has('max_market_cap_usd_mm') ? Number(p.get('max_market_cap_usd_mm')) : undefined,
    min_screen_score: p.has('min_screen_score') ? Number(p.get('min_screen_score')) : undefined,
    min_piotroski: p.has('min_piotroski') ? Number(p.get('min_piotroski')) : undefined,
    watchlist_size: p.has('watchlist_size') ? Number(p.get('watchlist_size')) : undefined,
  };

  return NextResponse.json(generateScreenRecords(filters));
}
