import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { E2E_PREFIX, TEST_COURSE_SLUG } from './config';
import { getRes, postJson, del } from './helpers';
import { CHURCH_CONTACT } from '@/lib/constants';

// Landing pages rendered by the real worker. Async Server Components can't
// be unit-tested with Vitest (per the Next.js guide), so the rendered HTML
// is verified here instead.

const STATIC_PAGES = [
  '/',
  '/member',
  '/friend',
  '/privacy',
  '/announcements',
  '/clubes/especialidades/inteligencia-artificial',
];

const ADMIN_PAGES = [
  '/admin',
  '/admin/announcements',
  '/admin/children',
  '/admin/courses',
  '/admin/friends',
  '/admin/members',
  '/admin/programs',
  '/admin/volunteer-events',
];

// Entities created so the dynamic [id] landings have something to render
let programId: number;
let eventId: number;
let announcementId: number;

beforeAll(async () => {
  const program = await postJson('/api/admin/programs', {
    title: `${E2E_PREFIX}Programa Landing`,
    department: 'ministerio-infantil-adolescente',
    content: 'contenido',
    isActive: true,
  });
  programId = ((await program.json()) as { id: number }).id;

  const event = await postJson('/api/admin/volunteer-events', {
    title: `${E2E_PREFIX}Evento Landing`,
    description: 'descripcion',
    eventDate: '2027-03-01',
    services: ['Cocina'],
  });
  eventId = ((await event.json()) as { id: number }).id;

  const announcement = await postJson('/api/admin/announcements', {
    title: `${E2E_PREFIX}Anuncio Landing`,
    content: 'contenido',
    announcementDate: '2020-01-06',
  });
  announcementId = ((await announcement.json()) as { id: number }).id;
});

afterAll(async () => {
  if (announcementId) await del(`/api/admin/announcements/${announcementId}`);
  if (eventId) await del(`/api/admin/volunteer-events/${eventId}`);
  if (programId) await del(`/api/admin/programs/${programId}`);
});

describe('static landings', () => {
  for (const path of STATIC_PAGES) {
    it(`renders ${path}`, async () => {
      const res = await getRes(path);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
    });
  }
});

describe('admin pages', () => {
  for (const path of ADMIN_PAGES) {
    it(`renders ${path}`, async () => {
      const res = await getRes(path);
      expect(res.status).toBe(200);
    });
  }
});

describe('dynamic landings', () => {
  it('renders the course landing', async () => {
    const res = await getRes(`/curso/${TEST_COURSE_SLUG}`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Curso Smoke');
  });

  it('renders the program landing', async () => {
    const res = await getRes(`/program/${programId}`);
    expect(res.status).toBe(200);
  });

  it('renders the volunteer event landing', async () => {
    const res = await getRes(`/volunteer/${eventId}`);
    expect(res.status).toBe(200);
  });

  it('renders the announcement landing', async () => {
    const res = await getRes(`/announcements/${announcementId}`);
    expect(res.status).toBe(200);
  });
});

describe('church contact data (changes from time to time)', () => {
  it('the home landing shows the current pastor and phone', async () => {
    const html = await (await getRes('/')).text();
    expect(html).toContain(CHURCH_CONTACT.pastorName);
    expect(html).toContain(CHURCH_CONTACT.pastorPhone);
  });

  it('the privacy page shows the current contact data', async () => {
    const html = await (await getRes('/privacy')).text();
    expect(html).toContain(CHURCH_CONTACT.pastorName);
    expect(html).toContain(CHURCH_CONTACT.pastorPhone);
    expect(html).toContain(CHURCH_CONTACT.email);
  });
});
