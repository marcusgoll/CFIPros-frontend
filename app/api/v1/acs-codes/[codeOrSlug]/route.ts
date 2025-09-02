import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env['BACKEND_API_URL'] || 'https://api.cfipros.com';

// Helper function to convert slug back to code format
function createCodeFromSlug(slug: string): string {
  return slug.toUpperCase().replace(/-/g, ".");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codeOrSlug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { codeOrSlug } = await params;
    
    // Helper function to make a backend request
    const makeBackendRequest = async (identifier: string) => {
      const backendUrl = new URL(`${BACKEND_API_URL}/api/v1/acs-codes/${encodeURIComponent(identifier)}`);
      searchParams.forEach((value, key) => {
        backendUrl.searchParams.append(key, value);
      });

      // eslint-disable-next-line no-console
      console.log(`Proxying request to: ${backendUrl.toString()}`); 

      const response = await fetch(backendUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return { response, data };
    };

    // Try the original parameter first
    let { response, data } = await makeBackendRequest(codeOrSlug);

    // If it fails and looks like a slug format, try converting it back to code format
    if (!response.ok && codeOrSlug.includes('-') && /^[a-z]/.test(codeOrSlug)) {
      // eslint-disable-next-line no-console
      console.log(`First attempt failed, trying code format for slug: ${codeOrSlug}`);
      const codeFormat = createCodeFromSlug(codeOrSlug);
      const fallbackResult = await makeBackendRequest(codeFormat);
      
      // Use fallback result if it's successful
      if (fallbackResult.response.ok) {
        response = fallbackResult.response;
        data = fallbackResult.data;
        // eslint-disable-next-line no-console
        console.log(`Fallback successful with code format: ${codeFormat}`);
      }
    }

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Backend returned ${response.status}:`, data);
    }

    // Forward the response from backend
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': response.headers.get('Cache-Control') || 'public, max-age=86400',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error proxying to backend:', error);
    
    return NextResponse.json(
      {
        error: 'Backend service unavailable',
        code: 'BACKEND_ERROR',
        details: { message: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString(),
        path: `/api/v1/acs-codes/${codeOrSlug}`,
      },
      { status: 502 }
    );
  }
}