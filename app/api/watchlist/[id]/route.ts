import { NextRequest, NextResponse } from 'next/server';
import { watchlistStore } from '@/lib/watchlistStore';

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authEmail(req)) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  const wl = watchlistStore.get(id);
  if (!wl) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  return NextResponse.json(wl);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authEmail(req)) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  watchlistStore.delete(id);
  return new NextResponse(null, { status: 204 });
}
