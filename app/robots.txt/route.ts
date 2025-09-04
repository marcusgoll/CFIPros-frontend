import { NextResponse } from 'next/server';

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] || 'https://cfipros.com';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Allow crawling of public pages
Allow: /acs
Allow: /acs/*
Allow: /tools/*
Allow: /upload

# Disallow authentication and user-specific pages
Disallow: /auth/*
Disallow: /dashboard*
Disallow: /api/*
Disallow: /admin*
Disallow: /_next/*
Disallow: /favicon.ico

# Disallow user-generated content that shouldn't be indexed
Disallow: /results/*
Disallow: /batches/*

# Rate limiting
Crawl-delay: 1

# Sitemap location
Sitemap: ${SITE_URL}/sitemap.xml

# Additional search engine directives
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 2

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

User-agent: Baiduspider
Crawl-delay: 5

User-agent: YandexBot
Crawl-delay: 3

# Block AI training crawlers (optional)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: BypassGPT
Disallow: /

User-agent: Claude-Web
Disallow: /

# Additional instructions for compliant crawlers
User-agent: *
Request-rate: 1/10s  # Maximum 1 request per 10 seconds
Visit-time: 0600-2200  # Prefer crawling during these hours (UTC)
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}