import { NextRequest, NextResponse } from 'next/server';
import { UNIVERSE } from '@/lib/mockData';

export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').toUpperCase().trim();
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '8');

  if (!q) return NextResponse.json({ results: [], total: 0 });

  const results = UNIVERSE.filter(
    (s) => s.ticker.includes(q) || s.company_name.toUpperCase().includes(q)
  )
    .slice(0, limit)
    .map((s) => ({ ticker: s.ticker, company_name: s.company_name, exchange: 'NASDAQ' }));

  return NextResponse.json({ results, total: results.length });
}
