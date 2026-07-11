import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => ({
    env: {
      TURNSTILE_SECRET_KEY: 'unit-test-secret',
      TURNSTILE_SITE_KEY: 'unit-test-site-key',
    },
  }),
}));

import {
  attachFormPass,
  hasValidFormPass,
  withTurnstileProtection,
  getTurnstileSecretKeyForRequest,
} from '@/lib/turnstile';

const siteverifyOk = () =>
  vi.fn(async () => new Response(JSON.stringify({ success: true })) as any);

const siteverifyFail = (codes: string[]) =>
  vi.fn(async () => new Response(JSON.stringify({ success: false, 'error-codes': codes })) as any);

async function issueCookie(): Promise<string> {
  const res = NextResponse.json({});
  await attachFormPass(res);
  const value = res.cookies.get('form_pass')?.value;
  expect(value).toBeTruthy();
  return value!;
}

const requestWithCookie = (cookieValue: string) =>
  new NextRequest('https://example.org/api/members/search', {
    method: 'POST',
    headers: { cookie: `form_pass=${cookieValue}` },
    body: JSON.stringify({ documentID: '1' }),
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('form pass cookie', () => {
  it('verifies a cookie it issued', async () => {
    const value = await issueCookie();
    expect(await hasValidFormPass(requestWithCookie(value))).toBe(true);
  });

  it('sets safe cookie attributes', async () => {
    const res = NextResponse.json({});
    await attachFormPass(res);
    const cookie = res.cookies.get('form_pass')!;
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.secure).toBe(true);
    expect(cookie.sameSite).toBe('strict');
  });

  it('rejects a tampered signature', async () => {
    const value = await issueCookie();
    const tampered = value.slice(0, -1) + (value.endsWith('0') ? '1' : '0');
    expect(await hasValidFormPass(requestWithCookie(tampered))).toBe(false);
  });

  it('rejects a forged expiration for a valid signature', async () => {
    const value = await issueCookie();
    const [, signature] = value.split('.');
    const forged = `${Math.floor(Date.now() / 1000) + 9999999}.${signature}`;
    expect(await hasValidFormPass(requestWithCookie(forged))).toBe(false);
  });

  it('expires after 15 minutes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-10T10:00:00Z'));
    const value = await issueCookie();
    vi.setSystemTime(new Date('2026-07-10T10:16:00Z'));
    expect(await hasValidFormPass(requestWithCookie(value))).toBe(false);
  });

  it('rejects garbage values', async () => {
    for (const junk of ['', 'abc', '123.', '.beef', '123.zzzz', 'no-dot-at-all']) {
      expect(await hasValidFormPass(requestWithCookie(junk))).toBe(false);
    }
  });
});

describe('withTurnstileProtection', () => {
  it('rejects POST without token', async () => {
    const request = new NextRequest('https://example.org/api/x', {
      method: 'POST',
      body: JSON.stringify({ documentID: '1' }),
    });
    const handler = vi.fn();
    const res = await withTurnstileProtection(request, handler as any);
    expect(res.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it('verifies the token, forwards the body, and issues a form pass', async () => {
    vi.stubGlobal('fetch', siteverifyOk());
    const request = new NextRequest('https://example.org/api/x', {
      method: 'POST',
      body: JSON.stringify({ documentID: '42', token: 'tok' }),
    });
    const handler = vi.fn(async (req: NextRequest) => {
      const body = (await req.json()) as { documentID: string };
      return NextResponse.json({ got: body.documentID });
    });
    const res = await withTurnstileProtection(request, handler);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ got: '42' });
    expect(res.cookies.get('form_pass')?.value).toBeTruthy();
  });

  it('issues the form pass even when the handler returns an error status', async () => {
    // Regression: check-registration answers 404 for "not registered" (the
    // common case) and the follow-up member search still needs the pass.
    vi.stubGlobal('fetch', siteverifyOk());
    const request = new NextRequest('https://example.org/api/x', {
      method: 'POST',
      body: JSON.stringify({ token: 'tok' }),
    });
    const res = await withTurnstileProtection(request, async () =>
      NextResponse.json({ error: 'Not registered' }, { status: 404 })
    );
    expect(res.status).toBe(404);
    expect(res.cookies.get('form_pass')?.value).toBeTruthy();
  });

  it('maps timeout-or-duplicate to a retryable 400 with code', async () => {
    vi.stubGlobal('fetch', siteverifyFail(['timeout-or-duplicate']));
    const request = new NextRequest('https://example.org/api/x', {
      method: 'POST',
      body: JSON.stringify({ token: 'used-token' }),
    });
    const res = await withTurnstileProtection(request, vi.fn() as any);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code?: string }).code).toBe('TURNSTILE_TIMEOUT_OR_DUPLICATE');
  });

  it('rejects invalid tokens with 403', async () => {
    vi.stubGlobal('fetch', siteverifyFail(['invalid-input-response']));
    const request = new NextRequest('https://example.org/api/x', {
      method: 'POST',
      body: JSON.stringify({ token: 'bad' }),
    });
    const res = await withTurnstileProtection(request, vi.fn() as any);
    expect(res.status).toBe(403);
  });

  it('accepts a valid form pass without consuming a token when allowed', async () => {
    const cookieValue = await issueCookie();
    const fetchSpy = siteverifyOk();
    vi.stubGlobal('fetch', fetchSpy);
    const request = requestWithCookie(cookieValue);
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const res = await withTurnstileProtection(request, handler, { allowFormPass: true });
    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled(); // no siteverify call, token not consumed
    expect(res.cookies.get('form_pass')?.value).toBeTruthy(); // sliding expiration
  });

  it('ignores the cookie when allowFormPass is not set (write endpoints)', async () => {
    const cookieValue = await issueCookie();
    vi.stubGlobal('fetch', siteverifyOk());
    const request = new NextRequest('https://example.org/api/x', {
      method: 'POST',
      headers: { cookie: `form_pass=${cookieValue}` },
      body: JSON.stringify({}), // no token
    });
    const res = await withTurnstileProtection(request, vi.fn() as any);
    expect(res.status).toBe(400); // token still required
  });

  it('reads the token from query params on GET', async () => {
    vi.stubGlobal('fetch', siteverifyOk());
    const request = new NextRequest('https://example.org/api/x?token=tok', { method: 'GET' });
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const res = await withTurnstileProtection(request, handler);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });
});

describe('getTurnstileSecretKeyForRequest', () => {
  it('uses the always-pass test key on localhost', () => {
    const request = new NextRequest('http://localhost:3000/api/x', {
      headers: { host: 'localhost:3000' },
    });
    expect(getTurnstileSecretKeyForRequest(request)).toBe('1x0000000000000000000000000000000AA');
  });

  it('uses the real secret in production', () => {
    const request = new NextRequest('https://iglesiajordanibague.org/api/x', {
      headers: { host: 'iglesiajordanibague.org' },
    });
    expect(getTurnstileSecretKeyForRequest(request)).toBe('unit-test-secret');
  });
});
