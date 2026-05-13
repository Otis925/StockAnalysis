import { NextRequest, NextResponse } from 'next/server';
import { watchlistStore, type WatchlistItem } from '@/lib/watchlistStore';

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authEmail(req)) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  const wl = watchlistStore.get(id);
  if (!wl) return NextResponse.json({ detail: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const newPeers: WatchlistItem[] = body.peers ?? [];

  const merged = new Map<string, WatchlistItem>(wl.peers.map((p) => [p.ticker, p]));
  for (const p of newPeers) merged.set(p.ticker, p);

  wl.peers = Array.from(merged.values());
  watchlistStore.set(id, wl);
  return NextResponse.json(wl);
}
