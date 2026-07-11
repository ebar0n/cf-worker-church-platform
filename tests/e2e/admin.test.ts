import { describe, it, expect } from 'vitest';
import { E2E_PREFIX, DOC_IDS } from './config';
import { getRes, postJson, putJson, patchJson, del, ANY_TOKEN } from './helpers';

// In production every /api/admin route sits behind Cloudflare Access;
// locally they are open, which lets the suite exercise them directly.

describe('admin read endpoints', () => {
  for (const path of [
    '/api/admin/dashboard',
    '/api/admin/members',
    '/api/admin/children',
    '/api/admin/friends',
    '/api/admin/announcements',
    '/api/admin/programs',
    '/api/admin/courses',
    '/api/admin/volunteer-events',
    '/api/admin/me',
  ]) {
    it(`GET ${path} responds 200 and is never cached`, async () => {
      const res = await getRes(path);
      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    });
  }
});

describe('admin friends workflow', () => {
  it('marks a friend request as read', async () => {
    const created = await postJson('/api/friend', {
      name: `${E2E_PREFIX}Visitante Lectura`,
      phone: '3020004444',
      reason: 'visita',
      token: ANY_TOKEN,
    });
    expect(created.status).toBe(200);

    const list = await getRes('/api/admin/friends');
    const body = (await list.json()) as
      | { id: number; name: string }[]
      | { friends: { id: number; name: string }[] };
    const friends = Array.isArray(body) ? body : body.friends;
    const friend = friends.find((f) => f.name === `${E2E_PREFIX}Visitante Lectura`);
    expect(friend).toBeTruthy();

    const read = await patchJson(`/api/admin/friends/${friend!.id}/read`, { isRead: true });
    expect(read.status).toBeLessThan(300);
    const updated = (await read.json()) as { success: boolean; friend: { isRead: boolean } };
    expect(updated.success).toBe(true);
    expect(updated.friend.isRead).toBe(true);
  });
});

describe('admin courses CRUD', () => {
  it('creates, reads, updates and deletes a course', async () => {
    const created = await postJson('/api/admin/courses', {
      title: `${E2E_PREFIX}Curso Admin`,
      description: 'descripcion',
      content: 'contenido',
      cost: 0,
      capacity: 10,
    });
    expect(created.status, JSON.stringify(await created.clone().json())).toBe(201);
    const course = (await created.json()) as { id: number; slug?: string };

    const got = await getRes(`/api/admin/courses/${course.id}`);
    expect(got.status).toBe(200);

    const enrollments = await getRes(`/api/admin/courses/${course.id}/enrollments`);
    expect(enrollments.status).toBe(200);

    const updated = await putJson(`/api/admin/courses/${course.id}`, {
      title: `${E2E_PREFIX}Curso Admin Editado`,
      description: 'descripcion nueva',
      content: 'contenido nuevo',
      cost: 1000,
    });
    expect(updated.status, JSON.stringify(await updated.clone().json())).toBeLessThan(300);

    const removed = await del(`/api/admin/courses/${course.id}`);
    expect(removed.status).toBeLessThan(300);
  });
});

describe('admin volunteer events CRUD', () => {
  it('creates, updates and deletes an event', async () => {
    const created = await postJson('/api/admin/volunteer-events', {
      title: `${E2E_PREFIX}Evento Admin`,
      description: 'descripcion',
      eventDate: '2027-06-01',
    });
    expect(created.status).toBe(201);
    const event = (await created.json()) as { id: number };

    const updated = await putJson(`/api/admin/volunteer-events/${event.id}`, {
      title: `${E2E_PREFIX}Evento Admin Editado`,
      description: 'descripcion nueva',
      eventDate: '2027-06-02',
    });
    expect(updated.status, JSON.stringify(await updated.clone().json())).toBeLessThan(300);

    const removed = await del(`/api/admin/volunteer-events/${event.id}`);
    expect(removed.status).toBeLessThan(300);

    const check = await getRes(`/api/volunteer-events/${event.id}`);
    expect(check.status).toBe(404);
  });
});

describe('admin member children', () => {
  it('lists the children linked to a member', async () => {
    // Self-sufficient: create a member so the lookup never depends on
    // other test files having run first
    const created = await postJson('/api/member', {
      documentID: DOC_IDS.adminMember,
      name: `${E2E_PREFIX}Miembro Admin`,
      phone: '3050006666',
      token: ANY_TOKEN,
    });
    expect(created.status).toBe(200);
    const member = (await created.json()) as { id: number };

    const res = await getRes(`/api/admin/members/${member.id}/children`);
    expect(res.status).toBe(200);
  });
});
