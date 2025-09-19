import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken, accountId } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // ShipHero refresh token endpoint
    const shipheroUrl = 'https://public-api.shiphero.com/auth/refresh';
    
    const body = {
      refresh_token: refreshToken
    };

    const response = await fetch(shipheroUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ShipHero API Error Response:', errorText);
      
      let errorMessage = 'Authentication failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error_description || errorData.error || 'Authentication failed';
      } catch {
        errorMessage = `ShipHero API Error: ${response.status} - ${errorText.substring(0, 200)}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      accountId: accountId || null,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}