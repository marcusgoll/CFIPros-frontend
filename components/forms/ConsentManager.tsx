"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Shield, Eye, Download } from "lucide-react";

interface ConsentRecord {
  id: string;
  userId: string;
  userEmail: string;
  consentType: "data_processing" | "sharing" | "analytics" | "export";
  consentGiven: boolean;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  version: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  userId?: string;
  userEmail?: string;
  timestamp: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  status: "success" | "failed" | "pending";
}

interface ConsentManagerProps {
  batchId: string;
  className?: string;
}

export function ConsentManager({ batchId, className }: ConsentManagerProps) {
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"consent" | "audit">("consent");

  const fetchConsentAndAuditData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch consent records
      const consentResponse = await fetch(`/api/batches/${batchId}/consent`);
      if (!consentResponse.ok) {
        // Handle 404 gracefully - consent data may not exist yet
        if (consentResponse.status === 404) {
          setConsentRecords([]);
        } else {
          throw new Error(
            `Failed to fetch consent records: ${consentResponse.status}`
          );
        }
      } else {
        const consentData = await consentResponse.json();
        setConsentRecords(consentData.records || []);
      }

      // Fetch audit logs
      const auditResponse = await fetch(`/api/batches/${batchId}/audit`);
      if (!auditResponse.ok) {
        // Handle 404 gracefully - audit data may not exist yet
        if (auditResponse.status === 404) {
          setAuditLogs([]);
        } else {
          throw new Error(`Failed to fetch audit logs: ${auditResponse.status}`);
        }
      } else {
        const auditData = await auditResponse.json();
        setAuditLogs(auditData.entries || []);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load consent and audit data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsentAndAuditData();
  }, [batchId]); // Removed fetchConsentAndAuditData from dependencies to prevent infinite loop

  const revokeConsent = async (consentId: string) => {
    try {
      const response = await fetch(`/api/batches/${batchId}/consent`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ consentId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke consent: ${response.status}`);
      }

      await fetchConsentAndAuditData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke consent");
    }
  };

  const exportAuditLog = async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}/audit/export`);
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `batch-${batchId}-audit-log.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export audit log"
      );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConsentTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      data_processing: "Data Processing",
      sharing: "Data Sharing",
      analytics: "Analytics",
      export: "Data Export",
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
      >
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-4 w-2/3 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
      >
        <div className="mb-4 flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">
            Error Loading Consent & Audit Data
          </span>
        </div>
        <p className="mb-4 text-gray-600">{error}</p>
        <Button onClick={fetchConsentAndAuditData} size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center text-lg font-semibold text-gray-900">
          <Shield className="mr-2 h-5 w-5" />
          Consent & Audit Trail
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={activeTab === "consent" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab("consent")}
          >
            Consent
          </Button>
          <Button
            variant={activeTab === "audit" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab("audit")}
          >
            Audit Log
          </Button>
          {activeTab === "audit" && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportAuditLog}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === "consent" && (
        <div>
          {consentRecords.length > 0 ? (
            <div className="space-y-4">
              {consentRecords.map((record) => (
                <div
                  key={record.id}
                  className={`rounded-lg border p-4 ${
                    record.consentGiven
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            record.consentGiven ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getConsentTypeDisplay(record.consentType)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.userEmail} •{" "}
                            {formatTimestamp(record.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <span>Version: {record.version}</span>
                        {record.ipAddress && (
                          <span className="ml-3">
                            IP: {record.ipAddress.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                    {record.consentGiven && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeConsent(record.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No consent records found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div>
          {auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start space-x-3 rounded-lg border border-gray-200 p-3"
                >
                  <div className="mt-1 flex-shrink-0">
                    {entry.status === "success" ? (
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    ) : entry.status === "failed" ? (
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {entry.action}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    {entry.userEmail && (
                      <p className="mt-1 text-sm text-gray-600">
                        User: {entry.userEmail}
                      </p>
                    )}
                    {entry.metadata &&
                      Object.keys(entry.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {Object.entries(entry.metadata).map(
                            ([key, value]) => (
                              <span key={key} className="mr-3">
                                {key}: {String(value)}
                              </span>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Eye className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No audit entries found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
