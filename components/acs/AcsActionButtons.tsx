"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Upload, BookOpen, TrendingUp, ChevronRight, AlertTriangle, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TAcsCode } from "@/lib/api/acs";
import { useAcsPerformance } from "@/hooks/useAcsPerformance";

interface AcsActionButtonsProps {
  code: TAcsCode;
  className?: string;
}

export default function AcsActionButtons({ 
  code, 
  className = "" 
}: AcsActionButtonsProps) {
  const { user, isLoaded } = useUser();
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const { data: performanceData, loading: performanceLoading } = useAcsPerformance(code.code);

  const handleGenerateStudyPlan = async () => {
    if (!user) {return;}
    
    setIsGeneratingPlan(true);
    try {
      const response = await fetch("/api/study/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acsCode: code.code,
          focusArea: code.type,
          difficulty: "adaptive", // Let the system determine difficulty
        }),
      });

      if (response.ok) {
        await response.json();
        // Navigate to study plan or show success message
        window.location.href = "/dashboard?tab=study-plan&generated=true";
      } else {
        throw new Error("Failed to generate study plan");
      }
    } catch (error) {
      console.error("Error generating study plan:", error);
      // TODO: Add toast notification for error
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className={`rounded-lg border bg-white p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-32 rounded bg-gray-200"></div>
          <div className="space-y-3">
            <div className="h-10 w-full rounded bg-gray-200"></div>
            <div className="h-10 w-full rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border bg-white p-6 ${className}`}>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Training Actions
      </h3>
      
      <div className="space-y-3">
        {/* Upload AKTR */}
        <Link 
          href="/tools/aktr-to-acs"
          className="block"
        >
          <div className="group flex w-full items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 transition-all hover:border-blue-300 hover:bg-blue-100">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
                <Upload className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-900">
                  Upload AKTR
                </div>
                <div className="text-xs text-blue-700">
                  Get personalized study recommendations
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Generate Study Plan */}
        {user ? (
          <Button
            onClick={handleGenerateStudyPlan}
            disabled={isGeneratingPlan}
            loading={isGeneratingPlan}
            variant="outline"
            className="w-full justify-between border-green-200 bg-green-50 text-green-900 hover:border-green-300 hover:bg-green-100"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">
                  {isGeneratingPlan ? "Generating..." : "Generate Study Plan"}
                </div>
                <div className="text-xs opacity-75">
                  Focused on {code.code}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Link href="/sign-in?redirect_url=/acs-database">
            <div className="group flex w-full items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 transition-all hover:border-green-300 hover:bg-green-100">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-green-900">
                    Generate Study Plan
                  </div>
                  <div className="text-xs text-green-700">
                    Sign in to create personalized plans
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-green-600 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        )}

        {/* National Performance Data */}
        {performanceLoading ? (
          <div className="animate-pulse rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-md bg-orange-300"></div>
              <div className="flex-1">
                <div className="mb-1 h-4 w-32 rounded bg-orange-300"></div>
                <div className="h-3 w-48 rounded bg-orange-200"></div>
              </div>
            </div>
          </div>
        ) : performanceData ? (
          <div className={`rounded-lg border px-4 py-3 ${
            performanceData.difficulty === "hard" 
              ? "border-red-200 bg-red-50"
              : performanceData.difficulty === "medium"
              ? "border-orange-200 bg-orange-50"
              : "border-green-200 bg-green-50"
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md ${
                performanceData.difficulty === "hard" 
                  ? "bg-red-600"
                  : performanceData.difficulty === "medium"
                  ? "bg-orange-600"
                  : "bg-green-600"
              }`}>
                {performanceData.difficulty === "hard" ? (
                  <AlertTriangle className="h-4 w-4 text-white" />
                ) : (
                  <Target className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  performanceData.difficulty === "hard" 
                    ? "text-red-900"
                    : performanceData.difficulty === "medium"
                    ? "text-orange-900"
                    : "text-green-900"
                }`}>
                  National Performance Data
                </div>
                <div className={`text-xs ${
                  performanceData.difficulty === "hard" 
                    ? "text-red-700"
                    : performanceData.difficulty === "medium"
                    ? "text-orange-700"
                    : "text-green-700"
                }`}>
                  {performanceData.missRate}% miss rate • Avg score: {performanceData.averageScore}%
                </div>
                {performanceData.commonMistakes.length > 0 && (
                  <div className={`mt-2 text-xs ${
                    performanceData.difficulty === "hard" 
                      ? "text-red-600"
                      : performanceData.difficulty === "medium"
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}>
                    <div className="font-medium">Common mistakes:</div>
                    <ul className="mt-1 list-disc list-inside space-y-0.5">
                      {performanceData.commonMistakes.slice(0, 2).map((mistake, index) => (
                        <li key={index}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-400">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">
                  Performance Data Unavailable
                </div>
                <div className="text-xs text-gray-500">
                  National statistics not available for this code
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-md bg-gray-50 p-3">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Upload your AKTR to get specific recommendations 
          for areas you missed, or generate a study plan to focus on this topic.
        </p>
      </div>
    </div>
  );
}