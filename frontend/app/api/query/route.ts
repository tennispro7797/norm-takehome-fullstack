import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { query } = body;

    // Validate that query exists in the body
    if (!query) {
      return NextResponse.json(
        { error: 'Query field is required in request body' },
        { status: 400 }
      );
    }

    // Make the request to the backend API
    const backendUrl = `${BACKEND_URL}/query?q=${encodeURIComponent(query)}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if the backend request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);

      return NextResponse.json(
        {
          error: 'Failed to query backend API',
          details: errorText,
          status: response.status,
        },
        { status: response.status }
      );
    }

    // Parse and return the response from the backend
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error making query request:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
