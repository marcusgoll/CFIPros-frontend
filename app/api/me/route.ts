import { NextResponse } from "next/server";

export async function GET() {
  // Stub: free plan profile without PII
  return NextResponse.json({ plan: "free" });
}
