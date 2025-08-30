import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResultsView } from '@/components/forms/ResultsView';

interface PageProps {
  params: {
    reportId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'ACS Analysis Results | CFI Pros',
    description: 'Your personalized ACS study plan based on knowledge test analysis',
    robots: 'noindex, nofollow', // Keep results private
  };
}

export default async function ResultsPage({ params }: PageProps) {
  const { reportId } = params;

  // Basic validation for report ID
  if (!reportId || reportId.length < 10) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ResultsView reportId={reportId} />
    </div>
  );
}