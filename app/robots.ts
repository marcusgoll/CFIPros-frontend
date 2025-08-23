import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "https://cfipros.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/acs", "/acs/*", "/upload"],
        disallow: [
          "/dashboard",
          "/lesson/*",
          "/study-plan/*",
          "/settings",
          "/analytics",
          "/api/*",
          "/(authed)/*",
          "/auth/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/acs", "/acs/*", "/upload"],
        disallow: [
          "/dashboard",
          "/lesson/*", 
          "/study-plan/*",
          "/settings",
          "/analytics",
          "/api/*",
          "/(authed)/*",
          "/auth/*",
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}