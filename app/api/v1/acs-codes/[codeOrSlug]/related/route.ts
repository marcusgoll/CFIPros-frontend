import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env['BACKEND_API_URL'] || 'https://api.cfipros.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codeOrSlug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { codeOrSlug } = await params;
    
    // Build the backend URL with path parameter
    const backendUrl = new URL(`${BACKEND_API_URL}/api/v1/acs-codes/${encodeURIComponent(codeOrSlug)}/related`);
    
    // Forward all search parameters to the backend
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    // eslint-disable-next-line no-console
    console.log(`Proxying request to: ${backendUrl.toString()}`);

    // Make request to FastAPI backend
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Forward the response from backend
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': response.headers.get('Cache-Control') || 'public, max-age=600',
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
        path: `/api/v1/acs-codes/${codeOrSlug}/related`,
      },
      { status: 502 }
    );
  }
}