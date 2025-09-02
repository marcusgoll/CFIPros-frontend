import { NextResponse } from "next/server";

export async function GET() {
  // Placeholder data; in production, proxy to backend via BFF
  // and return per-user data
  const data = {
    dueCards: 0,
    nextLesson: null,
  };
  return NextResponse.json(data);
}
