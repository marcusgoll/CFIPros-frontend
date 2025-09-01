import { NextResponse } from "next/server";

export async function GET() {
  // Placeholder: up to 3 latest results
  const data = [
    {
      id: "r1",
      date: new Date().toISOString(),
      score: 82,
      weakAcsCodes: ["PA.I.A.K1", "PA.I.B.K2"],
    },
  ];
  return NextResponse.json(data);
}
