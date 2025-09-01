import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "5", 10) || 5,
    5
  );
  const folders = [
    { id: "s1", name: "Student A", readiness: 72 },
    { id: "s2", name: "Student B", readiness: 58 },
  ];
  return NextResponse.json({ folders: folders.slice(0, limit) });
}
