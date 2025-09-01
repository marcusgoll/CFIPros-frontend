import { NextResponse } from "next/server";

export async function GET() {
  // Stub: Free plan with some credits
  return NextResponse.json({ plan: "free", credits: 2 });
}
