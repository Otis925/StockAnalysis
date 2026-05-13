import { NextRequest, NextResponse } from 'next/server';

function mockToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 86_400_000 })).toString('base64');
  return `mock.${payload}.sig`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email: string = body.email ?? '';
  if (!email) return NextResponse.json({ detail: 'email required' }, { status: 422 });
  return NextResponse.json({ access_token: mockToken(email), token_type: 'bearer' });
}
