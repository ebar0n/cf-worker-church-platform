import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Turnstile verification function
export async function verifyTurnstileToken(
  token: string,
  secretKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const result = (await response.json()) as { success: boolean; 'error-codes'?: string[] };

    if (!result.success) {
      return {
        success: false,
        error: result['error-codes']?.join(', ') || 'Turnstile verification failed',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return {
      success: false,
      error: 'Failed to verify Turnstile token',
    };
  }
}

// Middleware function to protect API routes
export async function withTurnstileProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const secretKey = getTurnstileSecretKey();
    let token: string;

    // Get token based on HTTP method
    let originalBody: any = {};
    if (request.method === 'GET') {
      // For GET requests, get token from query parameters
      const url = new URL(request.url);
      token = url.searchParams.get('token') || '';
    } else {
      // For POST requests, get token from request body
      originalBody = await request.json();
      token = originalBody.token;
    }

    // Check if token is provided
    if (!token) {
      return NextResponse.json({ error: 'Turnstile token is required' }, { status: 400 });
    }

    // Verify the token
    const verification = await verifyTurnstileToken(token, secretKey);

    if (!verification.success) {
      // Check if it's a timeout-or-duplicate error
      if (verification.error?.includes('timeout-or-duplicate')) {
        return NextResponse.json(
          {
            error: `Invalid Turnstile token: ${verification.error}`,
            code: 'TURNSTILE_TIMEOUT_OR_DUPLICATE',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Invalid Turnstile token: ${verification.error}` },
        { status: 403 }
      );
    }

    // Create a new request with the original body for the handler
    const newRequest = new NextRequest(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'POST' ? JSON.stringify(originalBody) : undefined,
    });

    // If verification passes, call the original handler
    return await handler(newRequest);
  } catch (error) {
    console.error('Error in Turnstile protection middleware:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get Turnstile site key for frontend
export function getTurnstileSiteKey(): string {
  const { env } = getCloudflareContext();
  return env.TURNSTILE_SITE_KEY || '';
}

function getTurnstileSecretKey(): string {
  const { env } = getCloudflareContext();
  return env.TURNSTILE_SECRET_KEY || '';
}
