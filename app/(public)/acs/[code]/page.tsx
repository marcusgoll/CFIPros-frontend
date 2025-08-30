import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertCircle, BookOpen, Target } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { notFound } from "next/navigation";

// Mock data - will be replaced with API call
const mockACSData = {
  "PA.I.B.K2": {
    code: "PA.I.B.K2",
    title: "Weather Information",
    area: "Preflight Preparation",
    task: "Weather Information",
    element: "Weather reports and forecasts",
    officialText: "The applicant demonstrates understanding of weather information by explaining weather reports, forecasts, and weather charts, including the use of weather services and sources.",
    summary: "This ACS code covers the essential knowledge required for interpreting weather information during preflight preparation. Pilots must demonstrate proficiency in reading METARs, TAFs, weather charts, and understanding various weather phenomena that affect flight safety.",
    commonPitfalls: [
      "Misinterpreting TAF validity periods and amendment indicators",
      "Confusing MSL and AGL cloud base reporting in METARs",
      "Not recognizing significant weather abbreviations and symbols",
      "Failing to identify frontal passages and associated weather changes",
      "Overlooking NOTAMs related to weather equipment outages"
    ],
    relatedCodes: ["PA.I.B.K1", "PA.I.B.K3", "PA.I.C.K1"],
    studyResources: [
      "FAA-AC-00-6B Aviation Weather",
      "FAA-AC-00-45H Aviation Weather Services",
      "NOAA Aviation Weather Center"
    ]
  }
};

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const acsData = mockACSData[code as keyof typeof mockACSData];
  
  if (!acsData) {
    return {
      title: "ACS Code Not Found",
    };
  }

  const title = `ACS ${acsData.code}: ${acsData.title}`;
  const description = acsData.summary || `Learn about ACS code ${acsData.code} - ${acsData.title}. Part of ${acsData.area} covering ${acsData.task}.`;

  return {
    title,
    description,
    keywords: [
      `ACS ${acsData.code}`,
      acsData.title,
      acsData.area,
      acsData.task,
      "pilot training",
      "aviation standards",
      "checkride preparation"
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: "article",
      url: `/acs/${acsData.code}`,
      siteName: "CFIPros",
      images: [
        {
          url: "/og-acs-default.png",
          width: 1200,
          height: 630,
          alt: `ACS Code ${acsData.code}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-acs-default.png"],
    },
    alternates: {
      canonical: `/acs/${acsData.code}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

// Generate static params for top ACS codes (for ISR)
export async function generateStaticParams() {
  // In production, this would fetch from API
  return [
    { code: "PA.I.B.K2" },
    // Add more codes for pre-generation
  ];
}

export default async function ACSDetailPage({ params }: Props) {
  const { code } = await params;
  const acsData = mockACSData[code as keyof typeof mockACSData];

  if (!acsData) {
    notFound();
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": `ACS ${acsData.code}: ${acsData.title}`,
    "description": acsData.summary,
    "identifier": acsData.code,
    "teaches": acsData.title,
    "educationalLevel": "Professional Certification",
    "learningResourceType": "Reference Material",
    "isPartOf": {
      "@type": "Course",
      "name": "Airman Certification Standards",
      "description": "FAA Airman Certification Standards for Pilots"
    },
    "about": {
      "@type": "Thing",
      "name": acsData.area,
      "description": acsData.task
    },
    "provider": {
      "@type": "Organization",
      "name": "CFIPros",
      "url": "https://cfipros.com"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Home
              </Link>
              <span className="text-gray-400">/</span>
              <Link href="/acs" className="text-gray-500 hover:text-gray-700">
                ACS Codes
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{acsData.code}</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content Column */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-8">
                <Link href="/acs">
                  <Button variant="ghost" size="sm" className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to ACS Codes
                  </Button>
                </Link>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-lg bg-primary-600 px-4 py-2 text-lg font-bold text-white">
                    {acsData.code}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {acsData.title}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-md bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800">
                    {acsData.area}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-secondary-100 px-3 py-1 text-sm font-medium text-secondary-800">
                    {acsData.task}
                  </span>
                  {acsData.element && (
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                      {acsData.element}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {acsData.summary}
                  </p>
                </CardContent>
              </Card>

              {/* Official Text */}
              {acsData.officialText && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Official Standard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
                      <p className="text-gray-700 italic">
                        {acsData.officialText}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Common Pitfalls */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning-600" />
                    Common Pitfalls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {acsData.commonPitfalls.map((pitfall, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-warning-500 mr-2 mt-0.5">•</span>
                        <span className="text-gray-700">{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Study Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-success-600" />
                    Study Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {acsData.studyResources.map((resource, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-success-500 mr-2 mt-0.5">→</span>
                        <span className="text-gray-700">{resource}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* CTA Card */}
              <Card className="mb-6 border-primary-200 bg-primary-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Master This Topic
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Get personalized study plans and premium lessons for this ACS code.
                  </p>
                  <Link href="/auth/register" className="block">
                    <Button className="w-full">
                      Start Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Related Codes */}
              {acsData.relatedCodes && acsData.relatedCodes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Related ACS Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {acsData.relatedCodes.map((relatedCode) => (
                        <Link
                          key={relatedCode}
                          href={`/acs/${relatedCode}`}
                          className="block rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-primary-600">
                            {relatedCode}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
