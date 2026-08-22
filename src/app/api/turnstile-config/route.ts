import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { isDevelopmentRequest } from '@/lib/turnstile';

// Cloudflare Turnstile testing key (always passes)
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();

  // Test key in dev/preview, real key in production — matches the secret used
  // to verify, so the widget produces a valid token locally.
  const siteKey = isDevelopmentRequest(request) ? TURNSTILE_TEST_SITE_KEY : env.TURNSTILE_SITE_KEY;

  return NextResponse.json({ siteKey });
}
