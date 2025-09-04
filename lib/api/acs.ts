import { z } from "zod";

// Base API URL - will use Next.js API routes as proxy to backend
const API_BASE = "/api/v1";

// Zod schemas matching the API contract
export const AcsCodeSummary = z.object({
  code: z.string(),
  slug: z.string(),
  title: z.string(),
  shortDescription: z.string().optional(),
  doc: z.string(),
  type: z.enum(["knowledge", "skill", "risk_management"]),
});

export type TAcsCodeSummary = z.infer<typeof AcsCodeSummary>;

export const AcsDocument = z.object({
  id: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  revision: z.string().optional(),
  publicationDate: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

export type TAcsDocument = z.infer<typeof AcsDocument>;

export const AcsCode = AcsCodeSummary.extend({
  id: z.string().uuid(),
  description: z.string(),
  area: z.string().optional(),
  task: z.string().optional(),
  document: AcsDocument.nullable().optional(),
  sourcePdfUrl: z.string().url().optional(),
  pageNumber: z.number().optional(),
  version: z.string().optional(),
  effectiveDate: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TAcsCode = z.infer<typeof AcsCode>;

export const AcsCodeListResponse = z.object({
  items: z.array(AcsCodeSummary),
  limit: z.number(),
  offset: z.number(),
  count: z.number(),
});

export type TAcsCodeListResponse = z.infer<typeof AcsCodeListResponse>;

// Search response type alias for backward compatibility
export type AcsSearchResponse = TAcsCodeListResponse;

export const AcsDocumentListResponse = z.object({
  items: z.array(AcsDocument),
  limit: z.number(),
  offset: z.number(),
  count: z.number(),
});

export type TAcsDocumentListResponse = z.infer<typeof AcsDocumentListResponse>;

// API Error schema
export const ApiError = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string(),
  path: z.string(),
});

export type TApiError = z.infer<typeof ApiError>;

// Search and filter types
export interface AcsSearchParams {
  q?: string;
  limit?: number;
  offset?: number;
  fields?: string;
  sort?: string;
  doc?: string;
  type?: "knowledge" | "skill" | "risk_management";
  area?: string;
  task?: string;
  code_prefix?: string;
  tags?: string[];
  include?: string[];
}

export interface AcsDocSearchParams {
  limit?: number;
  offset?: number;
  fields?: string;
  sort?: string;
}

// Fetch functions
export async function fetchAcsCodes(
  params: AcsSearchParams = {}
): Promise<TAcsCodeListResponse> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v.toString()));
      } else {
        searchParams.set(key, value.toString());
      }
    }
  });

  const res = await fetch(`${API_BASE}/acs-codes?${searchParams.toString()}`, {
    next: { revalidate: 600 }, // 10 minutes
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch ACS codes");
  }

  const json = await res.json();
  return AcsCodeListResponse.parse(json);
}

export async function fetchAcsCode(
  codeOrSlug: string,
  include: string[] = []
): Promise<TAcsCode> {
  const searchParams = new URLSearchParams();
  
  if (include.length > 0) {
    searchParams.set("include", include.join(","));
  }

  const url = `${API_BASE}/acs-codes/${encodeURIComponent(codeOrSlug)}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const res = await fetch(url, {
    cache: "force-cache", // Static generation with ISR
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch ACS code");
  }

  const json = await res.json();
  return AcsCode.parse(json);
}

export async function fetchAcsCodeRelated(
  codeOrSlug: string,
  params: Pick<AcsSearchParams, "limit" | "offset"> = {}
): Promise<TAcsCodeListResponse> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, value.toString());
    }
  });

  const url = `${API_BASE}/acs-codes/${encodeURIComponent(codeOrSlug)}/related${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const res = await fetch(url, {
    next: { revalidate: 600 }, // 10 minutes
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch related ACS codes");
  }

  const json = await res.json();
  return AcsCodeListResponse.parse(json);
}

export async function fetchAcsDocuments(
  params: AcsDocSearchParams = {}
): Promise<TAcsDocumentListResponse> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, value.toString());
    }
  });

  const res = await fetch(`${API_BASE}/acs-docs?${searchParams.toString()}`, {
    next: { revalidate: 600 }, // 10 minutes
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch ACS documents");
  }

  const json = await res.json();
  return AcsDocumentListResponse.parse(json);
}

export async function fetchAcsDocument(id: string): Promise<TAcsDocument> {
  const res = await fetch(`${API_BASE}/acs-docs/${encodeURIComponent(id)}`, {
    cache: "force-cache", // Static generation with ISR
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch ACS document");
  }

  const json = await res.json();
  return AcsDocument.parse(json);
}

// Utility functions for client-side usage
export function createSlugFromCode(code: string): string {
  return code.toLowerCase().replace(/\./g, "-");
}

export function createCodeFromSlug(slug: string): string {
  return slug.toUpperCase().replace(/-/g, ".");
}

// Default search parameters
export const DEFAULT_SEARCH_PARAMS: Required<
  Pick<AcsSearchParams, "limit" | "offset">
> = {
  limit: 20,
  offset: 0,
};

// Cache configuration
export const CACHE_CONFIG = {
  LIST_REVALIDATE: 600, // 10 minutes
  DETAIL_REVALIDATE: 86400, // 1 day
  SEARCH_REVALIDATE: 300, // 5 minutes
} as const;