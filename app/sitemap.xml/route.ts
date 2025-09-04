import { NextRequest, NextResponse } from 'next/server';
import { fetchAcsCodes } from '@/lib/api/acs';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cfipros.com';
  
  // Static pages with priority and change frequency
  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/acs', priority: '0.9', changefreq: 'daily' },
    { path: '/tools/aktr-to-acs', priority: '0.8', changefreq: 'weekly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
    { path: '/terms', priority: '0.5', changefreq: 'yearly' },
  ];

  const sitemapEntries: Array<{
    url: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }> = [];

  // Add static pages
  const today = new Date().toISOString().split('T')[0];
  staticPages.forEach(page => {
    sitemapEntries.push({
      url: `${baseUrl}${page.path}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // Add ACS code pages dynamically
  try {
    const BATCH_SIZE = 500; // Process in batches to avoid memory issues
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await fetchAcsCodes({
          limit: BATCH_SIZE,
          offset,
          include: [] // Minimal data for sitemap generation
        });

        // Add ACS code pages to sitemap
        response.results.forEach(code => {
          sitemapEntries.push({
            url: `${baseUrl}/acs/${code.slug}`,
            lastmod: today,
            changefreq: 'weekly',
            priority: '0.8'
          });
        });

        hasMore = response.results.length === BATCH_SIZE;
        offset += BATCH_SIZE;

        // Prevent infinite loops - max 10k codes
        if (offset > 10000) {
          break;
        }
      } catch (error) {
        // Log error but continue with what we have
        break;
      }
    }
  } catch (error) {
    // Continue with static pages even if ACS codes fail
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200', // 24h cache, 12h stale
    },
  });
}