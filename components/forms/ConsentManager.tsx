'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Shield, Eye, Download } from 'lucide-react';

interface ConsentRecord {
  id: string;
  userId: string;
  userEmail: string;
  consentType: 'data_processing' | 'sharing' | 'analytics' | 'export';
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
  status: 'success' | 'failed' | 'pending';
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
  const [activeTab, setActiveTab] = useState<'consent' | 'audit'>('consent');

  const fetchConsentAndAuditData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch consent records
      const consentResponse = await fetch(`/api/batches/${batchId}/consent`);
      if (!consentResponse.ok) {
        throw new Error(`Failed to fetch consent records: ${consentResponse.status}`);
      }
      const consentData = await consentResponse.json();

      // Fetch audit logs
      const auditResponse = await fetch(`/api/batches/${batchId}/audit`);
      if (!auditResponse.ok) {
        throw new Error(`Failed to fetch audit logs: ${auditResponse.status}`);
      }
      const auditData = await auditResponse.json();

      setConsentRecords(consentData.records || []);
      setAuditLogs(auditData.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consent and audit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsentAndAuditData();
  }, [batchId, fetchConsentAndAuditData]);

  const revokeConsent = async (consentId: string) => {
    try {
      const response = await fetch(`/api/batches/${batchId}/consent`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consentId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke consent: ${response.status}`);
      }

      await fetchConsentAndAuditData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke consent');
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
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch-${batchId}-audit-log.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audit log');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConsentTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'data_processing': 'Data Processing',
      'sharing': 'Data Sharing',
      'analytics': 'Analytics',
      'export': 'Data Export'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Error Loading Consent & Audit Data</span>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchConsentAndAuditData} size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Consent & Audit Trail
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={activeTab === 'consent' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('consent')}
          >
            Consent
          </Button>
          <Button
            variant={activeTab === 'audit' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('audit')}
          >
            Audit Log
          </Button>
          {activeTab === 'audit' && (
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

      {activeTab === 'consent' && (
        <div>
          {consentRecords.length > 0 ? (
            <div className="space-y-4">
              {consentRecords.map((record) => (
                <div
                  key={record.id}
                  className={`p-4 border rounded-lg ${
                    record.consentGiven ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          record.consentGiven ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getConsentTypeDisplay(record.consentType)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.userEmail} • {formatTimestamp(record.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <span>Version: {record.version}</span>
                        {record.ipAddress && (
                          <span className="ml-3">IP: {record.ipAddress.substring(0, 8)}...</span>
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
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No consent records found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div>
          {auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {entry.status === 'success' ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ) : entry.status === 'failed' ? (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{entry.action}</p>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    {entry.userEmail && (
                      <p className="text-sm text-gray-600 mt-1">
                        User: {entry.userEmail}
                      </p>
                    )}
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.entries(entry.metadata).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No audit entries found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}