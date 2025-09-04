import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { fetchAcsCode, createCodeFromSlug, type TAcsCode } from "@/lib/api/acs";
import AcsDetail from "@/components/acs/AcsDetail";
import AcsRelated from "@/components/acs/AcsRelated";
import AcsActionButtons from "@/components/acs/AcsActionButtons";
import AcsErrorBoundary from "@/components/acs/AcsErrorBoundary";
import { generateAcsCodeJsonLd } from "@/lib/structured-data/acs";

interface AcsCodePageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for common ACS codes
export async function generateStaticParams() {
  // Return empty array to enable ISR for all routes
  // This allows Next.js to generate pages on-demand for better performance
  return [];
}

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({
  params,
}: AcsCodePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const code = await fetchAcsCode(slug, ["document"]);
    
    const title = `${code.code}: ${code.title} | ACS Code Database | CFIPros`;
    const description = code.shortDescription || code.description.slice(0, 160);
    
    return {
      title,
      description,
      keywords: [
        `ACS ${code.code}`,
        code.title,
        "Airman Certification Standards", 
        "pilot training",
        "aviation standards",
        code.type,
        code.area,
        code.task,
        ...(code.tags || []),
      ].filter(Boolean) as string[],
      openGraph: {
        title,
        description,
        type: "article",
        url: `/acs-database/${slug}`,
        siteName: "CFIPros",
        images: [
          {
            url: "/og-acs-code.png",
            width: 1200,
            height: 630,
            alt: `ACS Code ${code.code} - ${code.title}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/twitter-acs-code.png"],
      },
      alternates: {
        canonical: `/acs-database/${slug}`,
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
  } catch (error) {
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

export default async function AcsCodePage({ params }: AcsCodePageProps) {
  try {
    const { slug } = await params;
    let code: TAcsCode;
    
    try {
      // Try fetching with slug first, then fallback to code format
      code = await fetchAcsCode(slug, ["document"]);
    } catch (error) {
      // If slug format fails, try converting to code format
      try {
        const codeFormat = createCodeFromSlug(slug);
        code = await fetchAcsCode(codeFormat, ["document"]);
      } catch (fallbackError) {
        notFound();
      }
    }

    return (
      <AcsErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {/* Breadcrumb Navigation */}
          <div className="border-b border-gray-200 bg-white no-print">
            <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <Link href="/" className="text-gray-400 hover:text-gray-500">
                      <Home className="h-5 w-5" />
                      <span className="sr-only">Home</span>
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                      <Link
                        href="/acs-database"
                        className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                      >
                        ACS Database
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                      <span className="ml-4 text-sm font-medium text-gray-900">
                        {code.code}
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <AcsDetail code={code} />
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Training Actions */}
                <AcsActionButtons code={code} />

                {/* Related Codes */}
                <AcsRelated 
                  codeOrSlug={code.slug} 
                  relatedCodes={code.related || []} 
                />

                {/* Quick Actions */}
                <div className="rounded-lg border bg-white p-6 no-print">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.print();
                        }
                      }}
                      className="flex w-full items-center justify-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      Print This Page
                    </button>
                    
                    <button
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          navigator.share({
                            title: `ACS ${code.code}: ${code.title}`,
                            text: code.shortDescription || code.description.slice(0, 100),
                            url: window.location.href,
                          });
                        } else {
                          // Fallback: copy to clipboard
                          navigator.clipboard.writeText(window.location.href);
                        }
                      }}
                      className="flex w-full items-center justify-center rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                    >
                      Share This Code
                    </button>

                    <Link
                      href="/acs-database"
                      className="flex w-full items-center justify-center rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Back to Database
                    </Link>
                  </div>
                </div>

                {/* Document Info - Print-Friendly */}
                {code.document && (
                  <div className="rounded-lg border bg-white p-6 print:break-inside-avoid">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 print:text-black">Document Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-500 print:text-black">Source: </span>
                        <span className="text-gray-900 print:text-black">{code.document.title}</span>
                      </div>
                      {code.document.revision && (
                        <div>
                          <span className="font-medium text-gray-500 print:text-black">Revision: </span>
                          <span className="text-gray-900 print:text-black">{code.document.revision}</span>
                        </div>
                      )}
                      {code.pageNumber && (
                        <div>
                          <span className="font-medium text-gray-500 print:text-black">Page: </span>
                          <span className="text-gray-900 print:text-black">{code.pageNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateAcsCodeJsonLd(code, slug),
          }}
        />
      </AcsErrorBoundary>
    );
  } catch (error) {
    console.error("Error loading ACS code page:", error);
    notFound();
  }
}