import { NextResponse } from "next/server";

export async function GET() {
  // Return empty by default; CFI plan will show data
  return NextResponse.json({ folders: [] });
}
