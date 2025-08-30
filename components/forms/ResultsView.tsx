'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics/telemetry';
import { 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  Share2, 
  Download,
  Mail,
  User
} from 'lucide-react';

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
  pass_status: 'passed' | 'failed';
  confidence: 'high' | 'medium' | 'low';
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
  const [emailCapture, setEmailCapture] = useState({ email: '', submitted: false, submitting: false });
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Fetch results data
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/extractor/results/${reportId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Results not found or have expired');
          }
          throw new Error('Failed to load results');
        }

        const result = await response.json();
        setData(result.report || result);
        
        // Track results view
        trackEvent('results_viewed', {
          report_id: reportId.substring(0, 8) + '...',
          exam_type: result.report?.exam_type,
          is_authenticated: isSignedIn
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [reportId, isSignedIn]);

  // Email capture handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailCapture.email || emailCapture.submitted) return;

    setEmailCapture(prev => ({ ...prev, submitting: true }));

    try {
      const response = await fetch(`/api/extractor/results/${reportId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailCapture.email,
          source: 'results_page'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save email');
      }

      setEmailCapture(prev => ({ ...prev, submitted: true, submitting: false }));
      
      trackEvent('email_captured', {
        report_id: reportId.substring(0, 8) + '...',
        source: 'results_page'
      });

    } catch (err) {
      setEmailCapture(prev => ({ ...prev, submitting: false }));
      console.error('Email capture failed:', err);
    }
  };

  // Claim results handler
  const handleClaim = async () => {
    if (!isSignedIn) return;
    
    setClaiming(true);
    
    try {
      const response = await fetch(`/api/extractor/results/${reportId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to claim results');
      }

      setClaimed(true);
      
      trackEvent('result_claimed', {
        report_id: reportId.substring(0, 8) + '...',
        user_id: userId?.substring(0, 8) + '...'
      });

    } catch (err) {
      console.error('Claim failed:', err);
    } finally {
      setClaiming(false);
    }
  };

  // Share URL handler
  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My ACS Analysis Results',
          url: url,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
    }
    
    trackEvent('results_shared', {
      report_id: reportId.substring(0, 8) + '...',
      method: navigator.share ? 'native_share' : 'clipboard'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Results Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const weakAreas = data.weak_areas || data.acs_codes.filter(code => code.weak_area);
  const passedAreas = data.acs_codes.filter(code => !code.weak_area);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          {data.pass_status === 'passed' ? (
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          ) : (
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ACS Analysis Results
        </h1>
        <p className="text-gray-600">
          {data.exam_type} • Score: {data.score}% • {data.pass_status === 'passed' ? 'Passed' : 'Failed'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <Button 
          variant="outline" 
          onClick={handleShare}
          className="flex items-center"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Results
        </Button>
        
        {isSignedIn && !claimed ? (
          <Button 
            onClick={handleClaim}
            loading={claiming}
            className="flex items-center"
          >
            <User className="h-4 w-4 mr-2" />
            Claim to Account
          </Button>
        ) : claimed ? (
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Claimed to Account
          </div>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Readiness Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Readiness Summary
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{data.score}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{weakAreas.length}</div>
                <div className="text-sm text-gray-600">Weak Areas</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{passedAreas.length}</div>
                <div className="text-sm text-gray-600">Strong Areas</div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              data.pass_status === 'passed' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
            }`}>
              <p className="font-medium">
                {data.pass_status === 'passed' 
                  ? 'Congratulations! You passed the knowledge test.'
                  : 'Additional study recommended before retaking the test.'
                }
              </p>
            </div>
          </div>

          {/* Weak Areas */}
          {weakAreas.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Areas Needing Improvement
              </h2>
              
              <div className="space-y-4">
                {weakAreas.map((area, index) => (
                  <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{area.code}</h3>
                        <p className="text-gray-600 text-sm mt-1">{area.description}</p>
                        {area.improvement_suggestion && (
                          <p className="text-blue-600 text-sm mt-2 italic">
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
          {data.study_recommendations && data.study_recommendations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
                Study Recommendations
              </h2>
              
              <ul className="space-y-3">
                {data.study_recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Study Plan
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Hours:</span>
                  <span className="font-medium">{data.study_plan.estimated_study_hours}h</span>
                </div>
                
                <div className="space-y-2">
                  <span className="text-gray-600 text-sm">Priority Areas:</span>
                  {data.study_plan.priority_areas.map((area, index) => (
                    <div key={index} className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-sm">
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email Capture for Non-Authenticated Users */}
          {!isSignedIn && !emailCapture.submitted && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Save Results
              </h3>
              
              <p className="text-gray-600 text-sm mb-4">
                Enter your email to save these results and receive study updates.
              </p>
              
              <form onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  value={emailCapture.email}
                  onChange={(e) => setEmailCapture(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">Results Saved!</span>
              </div>
              <p className="text-green-700 text-sm mt-2">
                We'll email you this link and study updates.
              </p>
            </div>
          )}

          {/* Report Info */}
          <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-600">
            <h4 className="font-medium text-gray-900 mb-2">Report Details</h4>
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