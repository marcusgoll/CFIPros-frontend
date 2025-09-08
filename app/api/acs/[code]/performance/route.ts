import { NextResponse } from "next/server";

interface PerformanceData {
  acsCode: string;
  missRate: number; // Percentage of test-takers who miss this area
  averageScore: number; // Average score for this area (0-100)
  commonMistakes: string[];
  sampleSize: number; // Number of test results analyzed
  lastUpdated: string;
  difficulty: "easy" | "medium" | "hard";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    // Mock performance data - In production, this would come from:
    // 1. Aggregated FAA test data
    // 2. CFIPros user performance analytics
    // 3. Industry training data

    const performanceData: PerformanceData = generateMockPerformanceData(code);
    
    return NextResponse.json({
      success: true,
      data: performanceData,
    });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}

function generateMockPerformanceData(acsCode: string): PerformanceData {
  // Generate realistic performance data based on ACS code patterns
  const codeType = acsCode.includes("PA.I") ? "preflight" 
    : acsCode.includes("PA.II") ? "procedures" 
    : acsCode.includes("PA.III") ? "airport_ops"
    : acsCode.includes("PA.IV") ? "takeoffs"
    : acsCode.includes("PA.V") ? "performance"
    : acsCode.includes("PA.VI") ? "navigation"
    : acsCode.includes("PA.VII") ? "emergency"
    : "general";

  // Different difficulty levels based on code type and complexity
  const difficultyMap: Record<string, { missRate: number; avgScore: number; difficulty: "easy" | "medium" | "hard" }> = {
    preflight: { missRate: 15, avgScore: 85, difficulty: "easy" },
    procedures: { missRate: 25, avgScore: 78, difficulty: "medium" },
    airport_ops: { missRate: 35, avgScore: 72, difficulty: "hard" },
    takeoffs: { missRate: 28, avgScore: 75, difficulty: "medium" },
    performance: { missRate: 42, avgScore: 68, difficulty: "hard" },
    navigation: { missRate: 38, avgScore: 70, difficulty: "hard" },
    emergency: { missRate: 45, avgScore: 65, difficulty: "hard" },
    general: { missRate: 23, avgScore: 77, difficulty: "medium" },
  };

  const baseData = difficultyMap[codeType];
  
  // Add some randomness to make it more realistic
  const variance = 0.1; // 10% variance
  const randomFactor = 1 + (Math.random() - 0.5) * variance;
  
  const commonMistakeMap: Record<string, string[]> = {
    preflight: [
      "Incomplete fuel system inspection",
      "Missing engine oil level check",
      "Inadequate control surface movement verification"
    ],
    procedures: [
      "Improper checklist usage",
      "Incorrect radio procedures",
      "Poor crew resource management"
    ],
    airport_ops: [
      "Taxi route confusion",
      "Runway incursion risks",
      "Inadequate airport diagram usage"
    ],
    takeoffs: [
      "Improper crosswind techniques",
      "Incorrect V-speed usage",
      "Poor rotation timing"
    ],
    performance: [
      "Weight and balance calculation errors",
      "Incorrect takeoff/landing distance calculations",
      "Density altitude misunderstanding"
    ],
    navigation: [
      "GPS over-reliance",
      "Poor pilotage techniques",
      "Incorrect chart interpretation"
    ],
    emergency: [
      "Inadequate emergency procedures memory",
      "Poor decision-making under pressure",
      "Incorrect priority establishment"
    ],
    general: [
      "Regulatory knowledge gaps",
      "Poor aerodynamic understanding",
      "Inadequate systems knowledge"
    ],
  };

  return {
    acsCode,
    missRate: Math.round(baseData.missRate * randomFactor),
    averageScore: Math.round(baseData.avgScore * (2 - randomFactor)),
    commonMistakes: commonMistakeMap[codeType] || commonMistakeMap.general,
    sampleSize: Math.floor(Math.random() * 2000) + 1000, // 1000-3000 samples
    lastUpdated: new Date().toISOString(),
    difficulty: baseData.difficulty,
  };
}