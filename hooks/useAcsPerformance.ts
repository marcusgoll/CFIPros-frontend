"use client";

import { useState, useEffect } from "react";

interface PerformanceData {
  acsCode: string;
  missRate: number;
  averageScore: number;
  commonMistakes: string[];
  sampleSize: number;
  lastUpdated: string;
  difficulty: "easy" | "medium" | "hard";
}

interface UseAcsPerformanceResult {
  data: PerformanceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAcsPerformance(acsCode: string): UseAcsPerformanceResult {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceData = async () => {
    if (!acsCode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/acs/${encodeURIComponent(acsCode)}/performance`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching ACS performance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [acsCode]);

  const refetch = () => {
    fetchPerformanceData();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
}