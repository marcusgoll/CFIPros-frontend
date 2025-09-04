import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import AcsDetail from "@/components/acs/AcsDetail";
import AcsRelated from "@/components/acs/AcsRelated";
import { notFound } from "next/navigation";
import { fetchAcsCode, createSlugFromCode } from "@/lib/api/acs";
import { 
  createAcsCodeJsonLdScripts, 
  truncateDescription, 
  createAcsCodeOgImageUrl, 
  createAcsCodeTwitterImageUrl 
} from "@/lib/seo/jsonld";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 86400; // 24 hours ISR
export const dynamic = 'force-static';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const acsCode = await fetchAcsCode(slug, ["document", "related"]);
    
    const title = `${acsCode.code}: ${acsCode.title} | CFIPros ACS`;
    const description = truncateDescription(acsCode.description);
    
    const ogImageUrl = createAcsCodeOgImageUrl(acsCode);
    const twitterImageUrl = createAcsCodeTwitterImageUrl(acsCode);

    return {
      title,
      description,
      keywords: [
        `ACS ${acsCode.code}`,
        acsCode.title,
        acsCode.area,
        acsCode.task,
        "pilot training",
        "aviation standards", 
        "checkride preparation",
        "flight training",
        "ACS codes",
        ...(acsCode.tags?.filter(Boolean) || []),
        ...(acsCode.synonyms?.filter(Boolean) || []),
      ].filter(Boolean) as string[],
      openGraph: {
        title: `${acsCode.code}: ${acsCode.title} | CFIPros ACS`,
        description,
        type: "article",
        url: `/acs/${acsCode.slug}`,
        siteName: "CFIPros",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `ACS Code ${acsCode.code}: ${acsCode.title}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${acsCode.code}: ${acsCode.title} | CFIPros ACS`,
        description,
        images: [twitterImageUrl],
      },
      alternates: {
        canonical: `/acs/${acsCode.slug}`,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } catch {
    return {
      title: "ACS Code Not Found | CFIPros",
      description: "The requested ACS code could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// Generate static params for popular ACS codes (for ISR)
export async function generateStaticParams() {
  // In production, this would fetch popular codes from API
  // For now, return a few common ones
  const popularCodes = [
    "PA.I.A.K1", "PA.I.B.K1", "PA.I.B.K2", "PA.I.C.K1", "PA.I.D.K1",
    "PA.II.A.K1", "PA.III.A.K1", "PA.IV.A.K1", "PA.IV.E.K1",
    "PA.VII.A.K1", "PA.VII.B.K1", "PA.VIII.A.K1", "PA.IX.A.K1",
    "CA.I.A.K1", "IR.I.A.K1", "CFI.I.A.K1"
  ];

  return popularCodes.map(code => ({
    slug: createSlugFromCode(code)
  }));
}

export default async function AcsDetailPage({ params }: Props) {
  try {
    const { slug } = await params;
    const acsCode = await fetchAcsCode(slug, ["document", "related"]);
    
    // Generate JSON-LD structured data
    const jsonLdScripts = createAcsCodeJsonLdScripts(acsCode);

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScripts.definedTerm }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScripts.breadcrumbList }}
        />

        <div className="min-h-screen bg-gray-50">
          {/* Breadcrumb */}
          <div className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <nav className="flex items-center space-x-2 text-sm">
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
                <span className="text-gray-400">/</span>
                <Link href="/acs" className="text-gray-500 hover:text-gray-700">
                  ACS Codes
                </Link>
                {acsCode.document && (
                  <>
                    <span className="text-gray-400">/</span>
                    <Link 
                      href={`/acs?doc=${encodeURIComponent(acsCode.document.code)}`}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {acsCode.document.title}
                    </Link>
                  </>
                )}
                {acsCode.area && (
                  <>
                    <span className="text-gray-400">/</span>
                    <Link 
                      href={`/acs?area=${encodeURIComponent(acsCode.area)}`}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {acsCode.area}
                    </Link>
                  </>
                )}
                {acsCode.task && (
                  <>
                    <span className="text-gray-400">/</span>
                    <Link 
                      href={`/acs?task=${encodeURIComponent(acsCode.task)}`}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {acsCode.task}
                    </Link>
                  </>
                )}
                <span className="text-gray-400">/</span>
                <span className="font-medium text-gray-900">{acsCode.code}</span>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main Content Column */}
              <div className="lg:col-span-2">
                <div className="mb-8">
                  <Link href="/acs">
                    <Button variant="ghost" size="sm" className="mb-6">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to ACS Codes
                    </Button>
                  </Link>
                </div>

                <AcsDetail code={acsCode} />
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* CTA Card */}
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    Master This ACS Code
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Get personalized study plans, practice tests, and detailed explanations for {acsCode.code}.
                  </p>
                  <Link href="/auth/register" className="block">
                    <Button className="w-full">
                      Start Learning Now
                    </Button>
                  </Link>
                </div>

                {/* Related Codes */}
                <AcsRelated 
                  codeOrSlug={acsCode.slug}
                  relatedCodes={acsCode.related || []}
                />

                {/* Quick Navigation */}
                <div className="rounded-lg border bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Quick Navigation
                  </h3>
                  <div className="space-y-3">
                    {acsCode.area && (
                      <Link
                        href={`/acs?area=${encodeURIComponent(acsCode.area)}`}
                        className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View all codes in {acsCode.area}
                      </Link>
                    )}
                    {acsCode.task && (
                      <Link
                        href={`/acs?task=${encodeURIComponent(acsCode.task)}`}
                        className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View all codes for {acsCode.task}
                      </Link>
                    )}
                    {acsCode.document && (
                      <Link
                        href={`/acs?doc=${encodeURIComponent(acsCode.document.code)}`}
                        className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View all {acsCode.document.code} codes
                      </Link>
                    )}
                    <Link
                      href="/acs"
                      className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Search all ACS codes
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } catch {
    notFound();
  }
}