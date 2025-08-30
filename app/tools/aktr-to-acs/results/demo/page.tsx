import { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ACS Analysis Results | CFI Pros',
  description: 'Your personalized study recommendations based on knowledge test performance.',
  robots: 'noindex, nofollow',
};

export default function DemoResultsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost">
              <Link href="/tools/aktr-to-acs" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Upload
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share Results
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Results Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Analysis Complete
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                Successfully processed your knowledge test report. 
                Your personalized study recommendations are ready!
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Demo Results
            </h2>
            <p className="text-gray-600">
              This is a demonstration page. In the full implementation, 
              this would show your detailed ACS analysis and study recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}