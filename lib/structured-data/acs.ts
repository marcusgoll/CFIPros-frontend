import type { TAcsCode } from "@/lib/api/acs";

export interface StructuredDataArticle {
  "@context": string;
  "@type": string;
  headline: string;
  description: string;
  author: {
    "@type": string;
    name: string;
    url: string;
  };
  publisher: {
    "@type": string;
    name: string;
    url: string;
    logo: {
      "@type": string;
      url: string;
    };
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    "@type": string;
    "@id": string;
  };
  keywords: string;
  about?: {
    "@type": string;
    name: string;
    description: string;
  };
  isPartOf?: {
    "@type": string;
    name: string;
    url: string;
  };
  educationalLevel?: string;
  educationalUse?: string[];
  learningResourceType?: string;
  inLanguage?: string;
}

export interface StructuredDataBreadcrumb {
  "@context": string;
  "@type": string;
  itemListElement: Array<{
    "@type": string;
    position: number;
    name: string;
    item?: string;
  }>;
}

export function generateAcsCodeStructuredData(
  code: TAcsCode,
  slug: string,
  baseUrl: string = "https://cfipros.com"
): StructuredDataArticle {
  const url = `${baseUrl}/acs-database/${slug}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${code.code}: ${code.title}`,
    description: code.shortDescription || code.description.slice(0, 160),
    author: {
      "@type": "Organization",
      name: "CFIPros",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "CFIPros",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: code.createdAt,
    dateModified: code.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: [
      `ACS ${code.code}`,
      code.title,
      "Airman Certification Standards",
      code.type,
      code.area,
      code.task,
      ...(code.tags || []),
    ].filter(Boolean).join(", "),
    about: {
      "@type": "EducationalOccupationalProgram",
      name: "Airman Certification Standards",
      description: "Standards for pilot certification and training in aviation",
    },
    isPartOf: {
      "@type": "EducationalOccupationalProgram", 
      name: "ACS Code Database",
      url: `${baseUrl}/acs-database`,
    },
    educationalLevel: "Professional Development",
    educationalUse: [
      "instruction",
      "assessment", 
      "professional development"
    ],
    learningResourceType: "reference material",
    inLanguage: "en-US",
  };
}

export function generateBreadcrumbStructuredData(
  code: TAcsCode,
  _slug: string,
  baseUrl: string = "https://cfipros.com"
): StructuredDataBreadcrumb {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "ACS Database",
        item: `${baseUrl}/acs-database`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: code.code,
      },
    ],
  };
}

export function generateAcsCodeJsonLd(
  code: TAcsCode,
  slug: string,
  baseUrl?: string
): string {
  const articleData = generateAcsCodeStructuredData(code, slug, baseUrl);
  const breadcrumbData = generateBreadcrumbStructuredData(code, slug, baseUrl);
  
  // Combine both structured data objects
  const structuredData = [articleData, breadcrumbData];
  
  return JSON.stringify(structuredData, null, 0);
}