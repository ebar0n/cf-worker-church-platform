import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { E2E_PREFIX, DOC_IDS } from './config';
import { getRes, postJson, putJson, del, ANY_TOKEN } from './helpers';

let eventId: number;

beforeAll(async () => {
  const res = await postJson('/api/admin/volunteer-events', {
    title: `${E2E_PREFIX}Jornada Voluntariado`,
    description: 'Evento de prueba',
    eventDate: '2027-01-15',
    services: ['Cocina', 'Transporte'],
    maxCapacities: [2, 1],
  });
  expect(res.status).toBe(201);
  eventId = ((await res.json()) as { id: number }).id;
});

afterAll(async () => {
  if (eventId) await del(`/api/admin/volunteer-events/${eventId}`);
});

const registration = {
  memberDocumentID: DOC_IDS.volunteer,
  memberName: 'E2E Voluntario',
  memberPhone: '3030004444',
  memberBirthDate: '1995-03-20',
  selectedService: 'Cocina',
  hasTransport: false,
  dietType: 'normal',
  turnstileToken: ANY_TOKEN,
};

describe('volunteer event public API', () => {
  it('returns the event', async () => {
    const res = await getRes(`/api/volunteer-events/${eventId}`);
    expect(res.status).toBe(200);
    const event = (await res.json()) as { title: string };
    expect(event.title).toContain('Jornada Voluntariado');
  });

  it('exposes service capacities', async () => {
    const res = await getRes(`/api/volunteer-events/${eventId}/capacities`);
    expect(res.status).toBe(200);
  });
});

describe('volunteer registration', () => {
  it('registers a volunteer', async () => {
    const res = await postJson(`/api/volunteer-events/${eventId}/register`, registration);
    expect(res.status, JSON.stringify(await res.clone().json())).toBeLessThan(300);
  });

  it('rejects a duplicate registration', async () => {
    const res = await postJson(`/api/volunteer-events/${eventId}/register`, registration);
    expect(res.status).toBe(400);
  });

  it('check-registration now finds the volunteer', async () => {
    const res = await postJson(`/api/volunteer-events/${eventId}/check-registration`, {
      documentID: DOC_IDS.volunteer,
      token: ANY_TOKEN,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { selectedService: string };
    expect(data.selectedService).toBe('Cocina');
  });

  it('updates the registration via PUT', async () => {
    const res = await putJson(`/api/volunteer-events/${eventId}/register`, {
      ...registration,
      selectedService: 'Transporte',
    });
    expect(res.status).toBeLessThan(300);

    const check = await postJson(`/api/volunteer-events/${eventId}/check-registration`, {
      documentID: DOC_IDS.volunteer,
      token: ANY_TOKEN,
    });
    const data = (await check.json()) as { selectedService: string };
    expect(data.selectedService).toBe('Transporte');
  });

  it('rejects volunteers under 16', async () => {
    const res = await postJson(`/api/volunteer-events/${eventId}/register`, {
      ...registration,
      memberDocumentID: '000',
      memberBirthDate: '2015-01-01',
    });
    expect(res.status).toBe(400);
  });

  it('requires a token', async () => {
    const res = await postJson(`/api/volunteer-events/${eventId}/register`, {
      ...registration,
      turnstileToken: undefined,
    });
    expect(res.status).toBe(400);
  });
});

describe('admin registration management', () => {
  it('lists registrations and deletes one', async () => {
    const list = await getRes(`/api/admin/volunteer-events/${eventId}/registrations`);
    expect(list.status).toBe(200);
    const body = (await list.json()) as { id: number }[] | { registrations: { id: number }[] };
    const registrations = Array.isArray(body) ? body : body.registrations;
    expect(registrations.length).toBe(1);

    const remove = await del(
      `/api/admin/volunteer-events/${eventId}/registrations/${registrations[0].id}`
    );
    expect(remove.status).toBeLessThan(300);
  });
});
