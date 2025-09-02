"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Users, Mail } from "lucide-react";

interface BatchSharingData {
  batch_id: string;
  total_reports: number;
  sharing_summary: {
    shared_reports: number;
    unshared_reports: number;
    active_grants: number;
    expired_grants: number;
  };
  reports: Array<{
    report_id: string;
    filename: string;
    share_grants: number;
    active_grants: number;
    most_recent_share: string | null;
  }>;
}

interface BatchSharingProps {
  batchId: string;
  className?: string;
}

export default function BatchSharing({ batchId, className = "" }: BatchSharingProps) {
  const [data, setData] = useState<BatchSharingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSharingSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/batches/${batchId}/sharing`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sharing settings: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Failed to load sharing settings");
      console.error("Batch sharing fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batchId) {
      fetchSharingSettings();
    }
  }, [batchId]);

  if (loading) {
    return (
      <div className={`animate-pulse rounded-lg bg-white p-6 shadow ${className}`}>
        <div className="mb-4 h-6 w-48 rounded bg-gray-200"></div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-gray-200"></div>
          <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          <div className="h-4 w-1/2 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
        <div className="flex items-center text-red-600">
          <AlertCircle className="mr-2 h-5 w-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <Button
          onClick={fetchSharingSettings}
          variant="outline"
          size="sm"
          className="mt-3"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
        <p className="text-sm text-gray-500">No sharing data available</p>
      </div>
    );
  }

  const { sharing_summary, reports } = data;

  return (
    <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sharing Overview</h3>
        <p className="text-sm text-gray-600">
          Manage sharing permissions for all reports in this batch
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <div className="flex items-center justify-center">
            <Users className="mr-1 h-4 w-4 text-blue-600" />
          </div>
          <p className="text-lg font-semibold text-blue-900">
            {sharing_summary.shared_reports}
          </p>
          <p className="text-xs text-blue-700">Shared Reports</p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <div className="flex items-center justify-center">
            <Mail className="mr-1 h-4 w-4 text-gray-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {sharing_summary.unshared_reports}
          </p>
          <p className="text-xs text-gray-700">Not Shared</p>
        </div>

        <div className="rounded-lg bg-green-50 p-3 text-center">
          <div className="flex items-center justify-center">
            <Users className="mr-1 h-4 w-4 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-green-900">
            {sharing_summary.active_grants}
          </p>
          <p className="text-xs text-green-700">Active Grants</p>
        </div>

        <div className="rounded-lg bg-yellow-50 p-3 text-center">
          <div className="flex items-center justify-center">
            <AlertCircle className="mr-1 h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-lg font-semibold text-yellow-900">
            {sharing_summary.expired_grants}
          </p>
          <p className="text-xs text-yellow-700">Expired</p>
        </div>
      </div>

      {/* Individual Reports */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Individual Reports</h4>
        
        {reports.map((report) => (
          <div
            key={report.report_id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{report.filename}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{report.share_grants} total grants</span>
                <span>{report.active_grants} active</span>
                {report.most_recent_share && (
                  <span>
                    Last shared: {new Date(report.most_recent_share).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {report.active_grants > 0 ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  Active
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                  Inactive
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="outline" size="sm">
          Export Sharing Report
        </Button>
        <Button size="sm">
          Manage Permissions
        </Button>
      </div>
    </div>
  );
}