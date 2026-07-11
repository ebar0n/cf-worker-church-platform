import { describe, it, expect } from 'vitest';
import { getRes, postJson, ANY_TOKEN } from './helpers';

describe('members search protection', () => {
  it('no longer exposes the GET endpoint', async () => {
    const res = await getRes('/api/members/search?documentID=123');
    expect(res.status).toBe(405);
  });

  it('requires a token when there is no form pass', async () => {
    const res = await postJson('/api/members/search', { documentID: '123' });
    expect(res.status).toBe(400);
  });

  it('accepts a valid token', async () => {
    const res = await postJson('/api/members/search', { documentID: '123', token: ANY_TOKEN });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { found: boolean };
    expect(data.found).toBe(false);
  });
});

describe('children search protection', () => {
  it('requires a token or form pass', async () => {
    const res = await postJson('/api/children/search', { documentID: '123' });
    expect(res.status).toBe(400);
  });

  it('accepts a valid token', async () => {
    const res = await postJson('/api/children/search', { documentID: '123', token: ANY_TOKEN });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { found: boolean };
    expect(data.found).toBe(false);
  });
});

describe('form pass cookie flow (volunteer form sequence)', () => {
  it('a 404 check-registration still issues the pass, and the pass authorizes the member search', async () => {
    // Step 1: check-registration verifies the token (not registered -> 404)
    const check = await postJson('/api/volunteer-events/1/check-registration', {
      documentID: '123',
      token: ANY_TOKEN,
    });
    expect(check.status).toBe(404);
    const setCookie = check.headers.get('set-cookie') || '';
    expect(setCookie).toContain('form_pass=');
    expect(setCookie).toContain('HttpOnly');

    // Step 2: member search rides the cookie; the garbage token proves
    // no new Turnstile verification is needed
    const cookie = setCookie.split(';')[0];
    const search = await postJson(
      '/api/members/search',
      { documentID: '123', token: 'already-consumed-garbage' },
      { Cookie: cookie }
    );
    expect(search.status).toBe(200);
  });
});
