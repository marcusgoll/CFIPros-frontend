import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    if (typeof body?.done !== 'boolean') {
      return NextResponse.json({ type: 'about:blank#validation_failed', title: 'validation_failed', detail: 'Missing or invalid done flag', status: 400 }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ type: 'about:blank#invalid_json', title: 'invalid_json', detail: 'Invalid JSON body', status: 400 }, { status: 400 });
  }
  return NextResponse.json({ id, done: true });
}

