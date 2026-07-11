import { expect } from 'vitest';
import { BASE_URL } from './config';

// The server runs with the Turnstile test secret (siteverify always passes),
// so any non-empty token string is accepted. Tokens are still required.
export const ANY_TOKEN = 'e2e-dummy-token';

export const getRes = (path: string, headers: Record<string, string> = {}) =>
  fetch(`${BASE_URL}${path}`, { headers });

export const postJson = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

export const putJson = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

export const patchJson = (path: string, body: unknown) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const del = (path: string) => fetch(`${BASE_URL}${path}`, { method: 'DELETE' });

export async function expectJson<T>(res: Response, status: number): Promise<T> {
  const body = (await res.json()) as T;
  expect(res.status, JSON.stringify(body)).toBe(status);
  return body;
}

// Obtain a form_pass cookie by letting the server verify a (test) token
// on a lookup endpoint — mirrors what real forms do in their first step.
export async function obtainFormPass(): Promise<string> {
  const res = await postJson('/api/members/search', { documentID: '0', token: ANY_TOKEN });
  const setCookie = res.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0];
  expect(cookie, 'expected a form_pass cookie').toContain('form_pass=');
  return cookie;
}

export function paymentProofForm(fields: Record<string, string>, withProof = true): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  if (withProof) {
    form.append(
      'paymentProof',
      new File([new Uint8Array(64)], 'comprobante.jpg', { type: 'image/jpeg' })
    );
  }
  return form;
}
