import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "5", 10) || 5,
    5
  );
  const items = [
    { id: "a1", message: "Mapped AKTR", timestamp: new Date().toISOString() },
    {
      id: "a2",
      message: "Completed lesson",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "a3",
      message: "Created flashcards",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ];
  return NextResponse.json({ items: items.slice(0, limit) });
}
