import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "3", 10) || 3,
    3
  );
  const base = [
    {
      id: "r1",
      date: "2024-01-02T00:00:00Z",
      score: 82,
      weakAcsCodes: ["PA.I.A.K1", "PA.I.B.K2"],
    },
    {
      id: "r2",
      date: "2024-01-01T00:00:00Z",
      score: null,
      weakAcsCodes: ["PA.III.B.K4"],
    },
    { id: "r3", date: "2023-12-31T00:00:00Z", score: 91, weakAcsCodes: [] },
  ];
  return NextResponse.json(base.slice(0, limit));
}
