import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Cloudflare Turnstile testing keys (always passes)
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();

  // Check if we're in development (localhost)
  const host = request.headers.get('host') || '';
  const isDevelopment = host.includes('localhost') || host.includes('127.0.0.1');

  // Use test key in development, real key in production
  const siteKey = isDevelopment ? TURNSTILE_TEST_SITE_KEY : env.TURNSTILE_SITE_KEY;

  return NextResponse.json({
    siteKey,
  });
}
