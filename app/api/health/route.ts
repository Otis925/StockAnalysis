import { NextResponse } from 'next/server';
import { UNIVERSE } from '@/lib/mockData';

export function GET() {
  return NextResponse.json({ status: 'ok', universe_size: UNIVERSE.length });
}
