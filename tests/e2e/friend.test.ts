import { describe, it, expect } from 'vitest';
import { E2E_PREFIX } from './config';
import { postJson, ANY_TOKEN } from './helpers';

describe('friend request form', () => {
  it('creates a request with valid data', async () => {
    const res = await postJson('/api/friend', {
      name: `${E2E_PREFIX}Visitante`,
      phone: '3020003333',
      reason: 'oracion',
      note: 'nota de prueba',
      token: ANY_TOKEN,
    });
    expect(res.status).toBe(200);
  });

  it('requires a token', async () => {
    const res = await postJson('/api/friend', {
      name: `${E2E_PREFIX}Visitante`,
      phone: '3020003333',
      reason: 'oracion',
    });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid reason', async () => {
    const res = await postJson('/api/friend', {
      name: `${E2E_PREFIX}Visitante`,
      phone: '3020003333',
      reason: 'otra-cosa',
      token: ANY_TOKEN,
    });
    expect(res.status).toBe(400);
  });
});
