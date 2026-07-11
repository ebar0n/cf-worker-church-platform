import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Cloudflare Turnstile testing keys (always passes)
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

// Short-lived signed cookie issued after a successful Turnstile verification.
// Lets multi-step forms make several protected lookups (member/child search)
// with a single captcha, since Turnstile tokens are single-use.
// The TTL slides on every protected request, but it must outlast a user
// parked on a single form step (auto-save only fires on step changes) —
// this is an anti-bot pass, not authentication, so a generous window is fine.
const FORM_PASS_COOKIE = 'form_pass';
const FORM_PASS_TTL_SECONDS = 60 * 60;

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

// Resolve the secret key for a request: test key on localhost, real key in production
export function getTurnstileSecretKeyForRequest(request: NextRequest): string {
  const host = request.headers.get('host') || '';
  const isDevelopment = host.includes('localhost') || host.includes('127.0.0.1');
  return isDevelopment ? TURNSTILE_TEST_SECRET_KEY : getTurnstileSecretKey();
}

async function getFormPassKey(): Promise<CryptoKey> {
  const secret = getTurnstileSecretKey();
  const keyMaterial = new TextEncoder().encode(`${secret}:form-pass`);
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function createFormPassValue(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + FORM_PASS_TTL_SECONDS;
  const key = await getFormPassKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${exp}`));
  return `${exp}.${toHex(signature)}`;
}

export async function hasValidFormPass(request: NextRequest): Promise<boolean> {
  const value = request.cookies.get(FORM_PASS_COOKIE)?.value;
  if (!value) return false;

  const [expStr, signatureHex] = value.split('.');
  const exp = parseInt(expStr, 10);
  if (!exp || !signatureHex || exp < Math.floor(Date.now() / 1000)) return false;

  const signature = fromHex(signatureHex);
  if (!signature) return false;

  const key = await getFormPassKey();
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(`${exp}`));
}

// Attach (or refresh) the form-pass cookie after a successful verification
export async function attachFormPass(response: NextResponse): Promise<void> {
  response.cookies.set(FORM_PASS_COOKIE, await createFormPassValue(), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/api',
    maxAge: FORM_PASS_TTL_SECONDS,
  });
}

// Middleware function to protect API routes.
// With `allowFormPass: true`, a valid form-pass cookie (issued after a prior
// successful Turnstile verification) satisfies the check without consuming a
// new token — use it for read-only lookups inside multi-step forms.
// Write endpoints should omit it so every submission needs a fresh token.
export async function withTurnstileProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: { allowFormPass?: boolean }
): Promise<NextResponse> {
  try {
    if (options?.allowFormPass && (await hasValidFormPass(request))) {
      const response = await handler(request);
      await attachFormPass(response); // sliding expiration
      return response;
    }

    const secretKey = getTurnstileSecretKeyForRequest(request);
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

    // If verification passes, call the original handler.
    // The form pass is issued regardless of the handler's outcome: the
    // captcha was solved, so follow-up lookups shouldn't need a new token.
    const response = await handler(newRequest);
    await attachFormPass(response);
    return response;
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
