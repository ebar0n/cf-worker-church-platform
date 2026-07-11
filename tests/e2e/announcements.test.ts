import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { E2E_PREFIX } from './config';
import { getRes, postJson, putJson, del } from './helpers';

let announcementId: number;

beforeAll(async () => {
  // Past date on purpose: creating an announcement deactivates all announcements
  // older than it, and the suite must not touch real data in a local dev DB.
  const res = await postJson('/api/admin/announcements', {
    title: `${E2E_PREFIX}Anuncio`,
    content: 'contenido de prueba',
    announcementDate: '2020-01-05',
    department: 'ministerio-infantil-adolescente',
  });
  expect(res.status, JSON.stringify(await res.clone().json())).toBe(201);
  announcementId = ((await res.json()) as { id: number }).id;
});

afterAll(async () => {
  if (announcementId) await del(`/api/admin/announcements/${announcementId}`);
});

describe('public announcements API', () => {
  it('serves the announcement by id', async () => {
    const res = await getRes(`/api/announcements/${announcementId}`);
    expect(res.status).toBe(200);
    const announcement = (await res.json()) as { title: string };
    expect(announcement.title).toContain('Anuncio');
  });

  it('serves the latest announcements list', async () => {
    const res = await getRes('/api/announcements/latest');
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  it('404s for unknown announcements', async () => {
    const res = await getRes('/api/announcements/999999');
    expect(res.status).toBe(404);
  });
});

describe('admin announcements CRUD', () => {
  it('lists announcements', async () => {
    const res = await getRes('/api/admin/announcements');
    expect(res.status).toBe(200);
  });

  it('updates the announcement', async () => {
    const res = await putJson(`/api/admin/announcements/${announcementId}`, {
      title: `${E2E_PREFIX}Anuncio Editado`,
      content: 'contenido nuevo',
      announcementDate: '2020-01-05',
    });
    expect(res.status).toBeLessThan(300);

    const check = await getRes(`/api/announcements/${announcementId}`);
    const announcement = (await check.json()) as { title: string };
    expect(announcement.title).toContain('Editado');
  });

  it('deletes the announcement', async () => {
    const res = await del(`/api/admin/announcements/${announcementId}`);
    expect(res.status).toBeLessThan(300);

    const check = await getRes(`/api/announcements/${announcementId}`);
    expect(check.status).toBe(404);
    announcementId = 0;
  });
});
