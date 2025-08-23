import { MetadataRoute } from "next";

// In production, these would be fetched from the API
const acsCodesList = [
  "PA.I.A.K1",
  "PA.I.B.K1", 
  "PA.I.B.K2",
  "PA.II.A.K1",
  "PA.II.A.K2",
  // Add more ACS codes...
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "https://cfipros.com";
  
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/acs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/upload`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Generate sitemap entries for all ACS codes
  const acsRoutes: MetadataRoute.Sitemap = acsCodesList.map((code) => ({
    url: `${baseUrl}/acs/${code}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...acsRoutes];
}

// Optional: Generate sitemap in batches for large datasets
export async function generateSitemaps() {
  // In production, this would calculate the number of batches
  // based on the total number of ACS codes (max 50,000 URLs per sitemap)
  return [{ id: 0 }];
}