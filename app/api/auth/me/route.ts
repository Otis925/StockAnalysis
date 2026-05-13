import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();

  if (!token.startsWith('mock.')) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (payload.exp < Date.now()) {
      return NextResponse.json({ detail: 'Token expired' }, { status: 401 });
    }
    return NextResponse.json({ id: 1, email: payload.email });
  } catch {
    return NextResponse.json({ detail: 'Invalid token' }, { status: 401 });
  }
}
