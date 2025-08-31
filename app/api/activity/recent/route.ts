import { NextResponse } from 'next/server';

export async function GET() {
  const items = [
    { id: 'a1', message: 'Mapped AKTR to ACS', timestamp: new Date().toISOString() },
    { id: 'a2', message: 'Completed lesson: Preflight', timestamp: new Date(Date.now() - 3600000).toISOString() },
  ];
  return NextResponse.json({ items });
}

