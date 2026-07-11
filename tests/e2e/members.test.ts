import { describe, it, expect } from 'vitest';
import { DOC_IDS } from './config';
import { getRes, postJson, putJson, obtainFormPass, ANY_TOKEN } from './helpers';

const MEMBER = {
  documentID: DOC_IDS.member,
  name: 'E2E Miembro Uno',
  phone: '3010001111',
};

describe('member lifecycle (create, lookup, update)', () => {
  it('rejects creation with neither token nor form pass', async () => {
    const res = await postJson('/api/member', MEMBER);
    expect(res.status).toBe(400);
  });

  it('creates a member with a verified token', async () => {
    const res = await postJson('/api/member', { ...MEMBER, token: ANY_TOKEN });
    expect(res.status).toBe(200);
    const member = (await res.json()) as { documentID: string; id: number };
    expect(member.documentID).toBe(MEMBER.documentID);
  });

  it('returns the member via the token-protected GET', async () => {
    const res = await getRes(`/api/member?documentID=${MEMBER.documentID}&token=${ANY_TOKEN}`);
    expect(res.status).toBe(200);
    const member = (await res.json()) as { name: string };
    expect(member.name).toBe(MEMBER.name);
  });

  it('rejects update with neither token nor form pass', async () => {
    const res = await putJson('/api/member', { ...MEMBER, phone: '3010002222' });
    expect(res.status).toBe(400);
  });

  it('updates the member riding the form pass (auto-save flow)', async () => {
    const cookie = await obtainFormPass();
    const res = await putJson(
      '/api/member',
      { ...MEMBER, phone: '3010002222' },
      { Cookie: cookie }
    );
    expect(res.status).toBe(200);

    const check = await getRes(`/api/member?documentID=${MEMBER.documentID}&token=${ANY_TOKEN}`);
    const member = (await check.json()) as { phone: string };
    expect(member.phone).toBe('3010002222');
  });

  it('the member is now searchable from public forms', async () => {
    const res = await postJson('/api/members/search', {
      documentID: MEMBER.documentID,
      token: ANY_TOKEN,
    });
    const data = (await res.json()) as { found: boolean; member: { name: string } };
    expect(data.found).toBe(true);
    expect(data.member.name).toBe(MEMBER.name);
  });
});
