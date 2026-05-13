import { NextRequest, NextResponse } from 'next/server';
import { watchlistStore, nextId, type Watchlist } from '@/lib/watchlistStore';

function authEmail(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token.startsWith('mock.')) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.email ?? null;
  } catch {
    return null;
  }
}

export function GET(req: NextRequest) {
  if (!authEmail(req)) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  return NextResponse.json(Array.from(watchlistStore.values()));
}

export async function POST(req: NextRequest) {
  if (!authEmail(req)) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = nextId();
  const wl: Watchlist = {
    id,
    name: body.name ?? `Watchlist ${id}`,
    query_ticker: body.query_ticker ?? '',
    watchlist_size: Number(body.watchlist_size ?? 25),
    peers: [],
    created_at: new Date().toISOString(),
  };
  watchlistStore.set(id, wl);
  return NextResponse.json(wl, { status: 201 });
}
