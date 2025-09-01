'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { BatchSharing } from '@/components/forms/BatchSharing';
import { ConsentManager } from '@/components/forms/ConsentManager';
import { AlertCircle, CheckCircle2, Clock, Download, Share2, FileText, Loader2 } from 'lucide-react';

interface BatchStatus {
  batchId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress: number;
  filesProcessed: number;
  totalFiles: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  extractionResults?: {
    extractionId: string;
    timestamp: string;
    filesCount: number;
  }[];
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  { id: 'pdf', name: 'PDF Report', description: 'Comprehensive study guide', extension: '.pdf' },
  { id: 'csv', name: 'CSV Data', description: 'Spreadsheet format', extension: '.csv' },
  { id: 'json', name: 'JSON Data', description: 'Machine-readable format', extension: '.json' },
];

export default function BatchStatusPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;
  
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
        setError(err instanceof Error ? err.message : 'Failed to load batch status');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchStatus();

    // Poll for updates if batch is still processing
    const interval = setInterval(() => {
      if (batchStatus?.status === 'processing' || batchStatus?.status === 'pending') {
        fetchBatchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [batchId, batchStatus?.status]);

  const handleExport = async (format: ExportFormat) => {
    if (!batchStatus || batchStatus.status !== 'complete') {
      return;
    }

    setIsExporting(format.id);
    try {
      const response = await fetch(`/api/batches/${batchId}/export?format=${format.id}`);
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch-${batchId}-results${format.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span className="text-lg text-gray-600">Loading batch status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !batchStatus) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Error Loading Batch</h1>
            </div>
            <p className="mt-4 text-gray-600">{error || 'Batch not found'}</p>
            <Button
              onClick={() => router.push('/tools/aktr-to-acs')}
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
      case 'complete':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (batchStatus.status) {
      case 'complete':
        return 'Processing Complete';
      case 'failed':
        return 'Processing Failed';
      case 'processing':
        return 'Processing Files';
      default:
        return 'Queued for Processing';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Batch Processing Status
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Batch ID: {batchId}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <h2 className="text-xl font-semibold text-gray-900">{getStatusText()}</h2>
            </div>
            {batchStatus.status === 'complete' && (
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
          {(batchStatus.status === 'processing' || batchStatus.status === 'pending') && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{batchStatus.filesProcessed} of {batchStatus.totalFiles} files</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${batchStatus.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {batchStatus.progress}% complete
              </p>
            </div>
          )}

          {/* Error Message */}
          {batchStatus.status === 'failed' && batchStatus.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{batchStatus.error}</p>
            </div>
          )}

          {/* File Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-gray-900">{batchStatus.totalFiles}</p>
              <p className="text-sm text-gray-600">Total Files</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-gray-900">{batchStatus.filesProcessed}</p>
              <p className="text-sm text-gray-600">Processed</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-semibold text-gray-900">
                {new Date(batchStatus.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">Started</p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        {batchStatus.status === 'complete' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Export Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {EXPORT_FORMATS.map((format) => (
                <Button
                  key={format.id}
                  variant="outline"
                  onClick={() => handleExport(format)}
                  disabled={!!isExporting}
                  loading={isExporting === format.id}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Download className="h-6 w-6" />
                  <span className="font-medium">{format.name}</span>
                  <span className="text-xs text-gray-500">{format.description}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Sharing and Cohorts */}
        {batchStatus.status === 'complete' && (
          <BatchSharing batchId={batchId} className="mb-8" />
        )}

        {/* Consent and Audit Trail */}
        <ConsentManager batchId={batchId} />
      </div>
    </div>
  );
}