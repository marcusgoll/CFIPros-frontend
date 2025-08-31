import { NextResponse } from 'next/server';

export async function GET() {
  const items = Array.from({ length: 5 }).map((_, i) => ({
    id: `sp${i+1}`,
    title: i === 0 ? 'Preflight inspection' : i === 1 ? 'Weather systems review' : `Study item ${i+1}`,
    acsCode: ['PA.I.A.K1', 'PA.I.B.K2', 'PA.III.B.K4'][i % 3],
    etaMinutes: 10 + i * 5,
    done: false,
  }));
  return NextResponse.json({ items, totalUpcoming: 35, nextLesson: { title: 'Crosswind Landings', etaMinutes: 20 } });
}

