"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BatchSharing } from "@/components/forms/BatchSharing";
import { ConsentManager } from "@/components/forms/ConsentManager";
import { createSlugFromCode } from "@/lib/api/acs";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  FileText,
  Loader2,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface ACSCode {
  code: string;
  frequency: number;
  percentage: number;
}

interface WeakArea {
  area: string;
  frequency: number;
  percentage: number;
}

interface BatchStatus {
  batch_id: string;
  total_files: number;
  successful_files: number;
  failed_files: number;
  processing_time_ms: number;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  summary_data: {
    batch_id: string;
    created_at: string;
    total_files: number;
    code_frequency: ACSCode[];
    common_weak_areas: WeakArea[];
    exam_distribution: Record<string, number>;
    processing_time_ms: number;
    score_distribution: {
      max: number;
      min: number;
      mean: number;
      median: number;
      std_dev: number;
    };
    study_recommendations: string[];
    total_successful_files: number;
    confidence_distribution: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "pdf",
    name: "PDF Report",
    description: "Comprehensive study guide",
    extension: ".pdf",
  },
  {
    id: "csv",
    name: "CSV Data",
    description: "Spreadsheet format",
    extension: ".csv",
  },
  {
    id: "json",
    name: "JSON Data",
    description: "Machine-readable format",
    extension: ".json",
  },
];

export default function BatchStatusPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params["batchId"] as string;

  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatchStatus = async () => {
      try {
        const response = await fetch(`/api/batches/${batchId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch batch status: ${response.status}`);
        }
        const data = await response.json();
        setBatchStatus(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load batch status"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBatchStatus();

    // Poll for updates if batch is still processing
    const interval = setInterval(() => {
      if (
        batchStatus?.status === "processing" ||
        batchStatus?.status === "pending"
      ) {
        fetchBatchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [batchId, batchStatus?.status]);

  const handleExport = async (format: ExportFormat) => {
    if (!batchStatus || batchStatus.status !== "completed") {
      return;
    }

    setIsExporting(format.id);
    try {
      const response = await fetch(
        `/api/batches/${batchId}/export?format=${format.id}`
      );
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `batch-${batchStatus.batch_id}-results${format.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(null);
    }
  };

  const handleShare = () => {
    // Implementation for sharing functionality
    navigator.clipboard.writeText(window.location.href);
    // You would typically show a toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="mr-3 h-8 w-8 animate-spin text-primary" />
            <span className="text-lg text-gray-600">
              Loading batch status...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !batchStatus) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Error Loading Batch</h1>
            </div>
            <p className="mt-4 text-gray-600">{error || "Batch not found"}</p>
            <Button
              onClick={() => router.push("/tools/aktr-to-acs")}
              className="mt-4"
            >
              Upload New Files
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (batchStatus.status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case "processing":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (batchStatus.status) {
      case "completed":
        return "Processing Complete";
      case "failed":
        return "Processing Failed";
      case "processing":
        return "Processing Files";
      default:
        return "Queued for Processing";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Batch Processing Status
          </h1>
          <p className="mt-4 text-lg text-gray-600">Batch ID: {batchStatus?.batch_id || batchId}</p>
        </div>

        {/* Status Card */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <h2 className="text-xl font-semibold text-gray-900">
                {getStatusText()}
              </h2>
            </div>
            {batchStatus.status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            )}
          </div>

          {/* Progress */}
          {(batchStatus.status === "processing" ||
            batchStatus.status === "pending") && (
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>
                  {batchStatus.successful_files} of {batchStatus.total_files} files
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.round((batchStatus.successful_files / batchStatus.total_files) * 100)}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {Math.round((batchStatus.successful_files / batchStatus.total_files) * 100)}% complete
              </p>
            </div>
          )}

          {/* Error Message */}
          {batchStatus.status === "failed" && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-700">Processing failed. Please try again.</p>
            </div>
          )}

          {/* File Details */}
          <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-2xl font-semibold text-gray-900">
                {batchStatus.total_files}
              </p>
              <p className="text-sm text-gray-600">Total Files</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-400" />
              <p className="text-2xl font-semibold text-gray-900">
                {batchStatus.successful_files}
              </p>
              <p className="text-sm text-gray-600">Processed</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <Clock className="mx-auto mb-2 h-8 w-8 text-blue-400" />
              <p className="text-2xl font-semibold text-gray-900">
                {new Date(batchStatus.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">Started</p>
            </div>
          </div>
        </div>

        {/* Extraction Results */}
        {batchStatus.status === "completed" && batchStatus.summary_data && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="mb-6 text-lg font-semibold text-gray-900">
              Analysis Results
            </h3>
            
            {/* Score Summary */}
            {batchStatus.summary_data.score_distribution && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {batchStatus.summary_data.score_distribution.mean.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {batchStatus.summary_data.score_distribution.max}
                  </p>
                  <p className="text-sm text-gray-600">Highest Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {batchStatus.summary_data.score_distribution.min}
                  </p>
                  <p className="text-sm text-gray-600">Lowest Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {batchStatus.summary_data.code_frequency.length}
                  </p>
                  <p className="text-sm text-gray-600">ACS Codes</p>
                </div>
              </div>
            )}

            {/* Study Recommendations */}
            {batchStatus.summary_data.study_recommendations && batchStatus.summary_data.study_recommendations.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-3 font-medium text-gray-900">Study Recommendations</h4>
                <ul className="space-y-2">
                  {batchStatus.summary_data.study_recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weak Areas */}
            {batchStatus.summary_data.common_weak_areas && batchStatus.summary_data.common_weak_areas.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-3 font-medium text-gray-900">Areas Needing Improvement</h4>
                <div className="grid gap-3">
                  {batchStatus.summary_data.common_weak_areas.slice(0, 5).map((area, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">
                      <span className="text-sm font-medium text-gray-900">{area.area}</span>
                      <span className="text-sm text-red-600">{area.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACS Codes with Database Links */}
            {batchStatus.summary_data.code_frequency && batchStatus.summary_data.code_frequency.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    ACS Codes Found ({batchStatus.summary_data.code_frequency.length})
                  </h4>
                  <Link
                    href="/acs-database"
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Browse ACS Database</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {batchStatus.summary_data.code_frequency.slice(0, 12).map((code, index) => {
                    const slug = createSlugFromCode(code.code);
                    return (
                      <Link
                        key={index}
                        href={`/acs-database/${slug}`}
                        className="group rounded border bg-gray-50 px-2 py-1 text-center transition-colors hover:bg-blue-50 hover:border-blue-200"
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-xs font-mono text-gray-800 group-hover:text-blue-800">
                            {code.code}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-500 group-hover:text-blue-600">
                            <span>{code.frequency}x</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {batchStatus.summary_data.code_frequency.length > 12 && (
                    <div className="rounded border bg-gray-100 px-2 py-1 text-center">
                      <span className="text-xs text-gray-600">
                        +{batchStatus.summary_data.code_frequency.length - 12} more
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Click any ACS code above to view detailed standards, 
                    study materials, and generate targeted study plans in our ACS Database.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Options */}
        {batchStatus.status === "completed" && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="mb-6 text-lg font-semibold text-gray-900">
              Export Results
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {EXPORT_FORMATS.map((format) => (
                <Button
                  key={format.id}
                  variant="outline"
                  onClick={() => handleExport(format)}
                  disabled={!!isExporting}
                  loading={isExporting === format.id}
                  className="flex h-auto flex-col items-center space-y-2 p-4"
                >
                  <Download className="h-6 w-6" />
                  <span className="font-medium">{format.name}</span>
                  <span className="text-xs text-gray-500">
                    {format.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Sharing and Cohorts */}
        {batchStatus.status === "completed" && (
          <BatchSharing batchId={batchStatus.batch_id} className="mb-8" />
        )}

        {/* Consent and Audit Trail */}
        <ConsentManager batchId={batchStatus.batch_id} />
      </div>
    </div>
  );
}
