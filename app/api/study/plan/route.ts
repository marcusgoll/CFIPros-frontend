import { NextResponse } from 'next/server';

export async function GET() {
  const items = [
    { id: 'sp1', title: 'Preflight inspection', acsCode: 'PA.I.A.K1', etaMinutes: 10, done: false },
    { id: 'sp2', title: 'Weather systems review', acsCode: 'PA.I.B.K2', etaMinutes: 15, done: false },
    { id: 'sp3', title: 'Emergency procedures', acsCode: 'PA.III.B.K4', etaMinutes: 20, done: false },
  ];
  return NextResponse.json({ items });
}

