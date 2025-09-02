import type { TAcsCode } from "@/lib/api/acs";
import type { BreadcrumbList, DefinedTerm, WithContext } from "schema-dts";

// Base URL for the site
const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] || "https://cfipros.com";

/**
 * Creates a JSON-LD DefinedTerm for an ACS code
 */
export function createAcsCodeJsonLd(code: TAcsCode): WithContext<DefinedTerm> {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: `${code.code}: ${code.title}`,
    termCode: code.code,
    description: code.description,
    url: `${SITE_URL}/acs/${code.slug}`,
    ...(code.document && {
      inDefinedTermSet: {
        "@type": "DefinedTermSet",
        name: code.document.title,
        description: `Airman Certification Standards (ACS) - ${code.document.code}`,
        url: code.document.sourceUrl || `${SITE_URL}/acs-docs/${code.document.id}`,
        publisher: {
          "@type": "Organization",
          name: "Federal Aviation Administration",
        },
        ...(code.document.publicationDate && {
          datePublished: code.document.publicationDate,
        }),
      },
    }),
    ...(code.synonyms && code.synonyms.length > 0 && {
      alternateName: code.synonyms,
    }),
    ...(code.tags && code.tags.length > 0 && {
      keywords: code.tags.join(", "),
    }),
  };
}

/**
 * Creates a JSON-LD BreadcrumbList for an ACS code
 */
export function createAcsCodeBreadcrumbJsonLd(
  code: TAcsCode
): WithContext<BreadcrumbList> {
  const items = [
    {
      "@type": "ListItem" as const,
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem" as const,
      position: 2,
      name: "ACS Codes",
      item: `${SITE_URL}/acs`,
    },
  ];

  let position = 3;

  // Add document if available
  if (code.document) {
    items.push({
      "@type": "ListItem" as const,
      position: position++,
      name: code.document.title,
      item: `${SITE_URL}/acs?doc=${encodeURIComponent(code.document.code)}`,
    });
  }

  // Add area if available
  if (code.area) {
    items.push({
      "@type": "ListItem" as const,
      position: position++,
      name: code.area,
      item: `${SITE_URL}/acs?area=${encodeURIComponent(code.area)}`,
    });
  }

  // Add task if available
  if (code.task) {
    items.push({
      "@type": "ListItem" as const,
      position: position++,
      name: code.task,
      item: `${SITE_URL}/acs?task=${encodeURIComponent(code.task)}`,
    });
  }

  // Add current code
  items.push({
    "@type": "ListItem" as const,
    position: position,
    name: `${code.code}: ${code.title}`,
    item: `${SITE_URL}/acs/${code.slug}`,
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/**
 * Creates a JSON-LD script tag string
 */
export function createJsonLdScript(
  jsonLd: WithContext<DefinedTerm | BreadcrumbList>
): string {
  return JSON.stringify(jsonLd, null, 0);
}

/**
 * Creates multiple JSON-LD scripts for an ACS code page
 */
export function createAcsCodeJsonLdScripts(code: TAcsCode): {
  definedTerm: string;
  breadcrumbList: string;
} {
  return {
    definedTerm: createJsonLdScript(createAcsCodeJsonLd(code)),
    breadcrumbList: createJsonLdScript(createAcsCodeBreadcrumbJsonLd(code)),
  };
}

/**
 * Helper function to truncate description for meta tags
 */
export function truncateDescription(
  description: string,
  maxLength: number = 160
): string {
  if (description.length <= maxLength) {
    return description;
  }

  // Find the last space before the limit to avoid cutting words
  const truncated = description.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Creates Open Graph image URL for ACS code
 */
export function createAcsCodeOgImageUrl(code: TAcsCode): string {
  const params = new URLSearchParams({
    code: code.code,
    title: code.title,
    area: code.area || "",
    doc: code.doc || "",
  });

  return `${SITE_URL}/api/og/acs-code?${params.toString()}`;
}

/**
 * Creates Twitter card image URL for ACS code
 */
export function createAcsCodeTwitterImageUrl(code: TAcsCode): string {
  const params = new URLSearchParams({
    code: code.code,
    title: code.title,
    area: code.area || "",
    doc: code.doc || "",
    format: "twitter",
  });

  return `${SITE_URL}/api/og/acs-code?${params.toString()}`;
}