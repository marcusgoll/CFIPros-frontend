"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/telemetry";
import {
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Clock,
  Share2,
  Mail,
  User,
} from "lucide-react";
import { logError } from "@/lib/utils/logger";

interface ACSCode {
  code: string;
  description: string;
  weak_area: boolean;
  improvement_suggestion?: string;
}

interface StudyPlan {
  plan_id: string;
  estimated_study_hours: number;
  priority_areas: string[];
  sections: Array<{
    title: string;
    description: string;
    estimated_hours: number;
    priority: number;
  }>;
}

interface ReportData {
  report_id: string;
  exam_date: string;
  exam_type: string;
  score: number;
  pass_status: "passed" | "failed";
  confidence: "high" | "medium" | "low";
  processing_time_ms: number;
  acs_codes: ACSCode[];
  study_plan: StudyPlan;
  weak_areas: ACSCode[];
  study_recommendations: string[];
}

interface ResultsViewProps {
  reportId: string;
}

export function ResultsView({ reportId }: ResultsViewProps) {
  const { isSignedIn, userId } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailCapture, setEmailCapture] = useState({
    email: "",
    submitted: false,
    submitting: false,
  });
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Fetch results data
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/extractor/results/${reportId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Results not found or have expired");
          }
          throw new Error("Failed to load results");
        }

        const result = await response.json();
        setData(result.report || result);

        // Track results view
        trackEvent("results_viewed", {
          report_id: reportId.substring(0, 8) + "...",
          exam_type: result.report?.exam_type,
          is_authenticated: isSignedIn,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [reportId, isSignedIn]);

  // Email capture handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailCapture.email || emailCapture.submitted) {
      return;
    }

    setEmailCapture((prev) => ({ ...prev, submitting: true }));

    try {
      const response = await fetch(`/api/extractor/results/${reportId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailCapture.email,
          source: "results_page",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save email");
      }

      setEmailCapture((prev) => ({
        ...prev,
        submitted: true,
        submitting: false,
      }));

      trackEvent("email_captured", {
        report_id: reportId.substring(0, 8) + "...",
        source: "results_page",
      });
    } catch (err) {
      setEmailCapture((prev) => ({ ...prev, submitting: false }));
      logError("Email capture failed:", err);
    }
  };

  // Claim results handler
  const handleClaim = async () => {
    if (!isSignedIn) {
      return;
    }

    setClaiming(true);

    try {
      const response = await fetch(`/api/extractor/results/${reportId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to claim results");
      }

      setClaimed(true);

      trackEvent("result_claimed", {
        report_id: reportId.substring(0, 8) + "...",
        user_id: userId?.substring(0, 8) + "...",
      });
    } catch (err) {
      logError("Claim failed:", err);
    } finally {
      setClaiming(false);
    }
  };

  // Share URL handler
  const handleShare = async () => {
    const url = window.location.href;

    const nav = navigator as Navigator & {
      share?: (data: { title?: string; url?: string }) => Promise<void>;
    };
    if (typeof nav.share === "function") {
      try {
        await nav.share({
          title: "My ACS Analysis Results",
          url: url,
        });
      } catch {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
    }

    const canShare =
      typeof (
        navigator as Navigator & {
          share?: (data: { title?: string; url?: string }) => Promise<void>;
        }
      ).share === "function";
    trackEvent("results_shared", {
      report_id: reportId.substring(0, 8) + "...",
      method: canShare ? "native_share" : "clipboard",
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Results Not Found
          </h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const weakAreas =
    data.weak_areas || data.acs_codes.filter((code) => code.weak_area);
  const passedAreas = data.acs_codes.filter((code) => !code.weak_area);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          {data.pass_status === "passed" ? (
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          ) : (
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          )}
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          ACS Analysis Results
        </h1>
        <p className="text-gray-600">
          {data.exam_type} • Score: {data.score}% •{" "}
          {data.pass_status === "passed" ? "Passed" : "Failed"}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          onClick={handleShare}
          className="flex items-center"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Results
        </Button>

        {isSignedIn && !claimed ? (
          <Button
            onClick={handleClaim}
            loading={claiming}
            className="flex items-center"
          >
            <User className="mr-2 h-4 w-4" />
            Claim to Account
          </Button>
        ) : claimed ? (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Claimed to Account
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Readiness Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <BookOpen className="mr-2 h-5 w-5" />
              Readiness Summary
            </h2>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {data.score}%
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {weakAreas.length}
                </div>
                <div className="text-sm text-gray-600">Weak Areas</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {passedAreas.length}
                </div>
                <div className="text-sm text-gray-600">Strong Areas</div>
              </div>
            </div>

            <div
              className={`rounded-lg p-4 ${
                data.pass_status === "passed"
                  ? "bg-green-50 text-green-800"
                  : "bg-yellow-50 text-yellow-800"
              }`}
            >
              <p className="font-medium">
                {data.pass_status === "passed"
                  ? "Congratulations! You passed the knowledge test."
                  : "Additional study recommended before retaking the test."}
              </p>
            </div>
          </div>

          {/* Weak Areas */}
          {weakAreas.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                Areas Needing Improvement
              </h2>

              <div className="space-y-4">
                {weakAreas.map((area, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-red-500 py-2 pl-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {area.code}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {area.description}
                        </p>
                        {area.improvement_suggestion && (
                          <p className="mt-2 text-sm italic text-blue-600">
                            💡 {area.improvement_suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Recommendations */}
          {data.study_recommendations &&
            data.study_recommendations.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                  <BookOpen className="mr-2 h-5 w-5 text-blue-500" />
                  Study Recommendations
                </h2>

                <ul className="space-y-3">
                  {data.study_recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Study Plan Summary */}
          {data.study_plan && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <Clock className="mr-2 h-5 w-5" />
                Study Plan
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Hours:</span>
                  <span className="font-medium">
                    {data.study_plan.estimated_study_hours}h
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-sm text-gray-600">Priority Areas:</span>
                  {data.study_plan.priority_areas.map((area, index) => (
                    <div
                      key={index}
                      className="rounded bg-blue-50 px-2 py-1 text-sm text-blue-800"
                    >
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email Capture for Non-Authenticated Users */}
          {!isSignedIn && !emailCapture.submitted && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <Mail className="mr-2 h-5 w-5" />
                Save Results
              </h3>

              <p className="mb-4 text-sm text-gray-600">
                Enter your email to save these results and receive study
                updates.
              </p>

              <form onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  value={emailCapture.email}
                  onChange={(e) =>
                    setEmailCapture((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="your@email.com"
                  className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  loading={emailCapture.submitting}
                  disabled={!emailCapture.email}
                >
                  Save Results
                </Button>
              </form>
            </div>
          )}

          {emailCapture.submitted && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6">
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                <span className="font-medium text-green-800">
                  Results Saved!
                </span>
              </div>
              <p className="mt-2 text-sm text-green-700">
                We'll email you this link and study updates.
              </p>
            </div>
          )}

          {/* Report Info */}
          <div className="rounded-xl bg-gray-50 p-6 text-sm text-gray-600">
            <h4 className="mb-2 font-medium text-gray-900">Report Details</h4>
            <div className="space-y-1">
              <div>ID: {reportId.substring(0, 12)}...</div>
              <div>Confidence: {data.confidence}</div>
              <div>Processing: {data.processing_time_ms}ms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
