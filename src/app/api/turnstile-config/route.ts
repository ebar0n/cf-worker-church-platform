import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();

  // Solo devolver la site key pública, nunca la secret key
  return NextResponse.json({
    siteKey: env.TURNSTILE_SITE_KEY
  });
}