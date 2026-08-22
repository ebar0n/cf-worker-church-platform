import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { E2E_PREFIX } from './config';
import { getRes, postJson, putJson, del, expectJson } from './helpers';

// Health surveys captured during a volunteer event. The capture screen lives
// under /admin (volunteers use configured iPads), so everything here goes
// through the admin API, which is open locally.

let eventId = 0;
let otherEventId = 0;

const createEvent = async (suffix: string) => {
  const res = await postJson('/api/admin/volunteer-events', {
    title: `${E2E_PREFIX}Encuestas ${suffix}`,
    description: 'Evento de prueba',
    eventDate: '2027-03-20',
    services: ['Salud'],
    maxCapacities: [10],
  });
  const body = await expectJson<{ id: number }>(res, 201);
  return body.id;
};

beforeAll(async () => {
  eventId = await createEvent('A');
  otherEventId = await createEvent('B');
});

afterAll(async () => {
  if (eventId) await del(`/api/admin/volunteer-events/${eventId}`);
  if (otherEventId) await del(`/api/admin/volunteer-events/${otherEventId}`);
});

const surveysPath = (id: number = eventId) => `/api/admin/surveys/${id}`;

describe('health survey capture', () => {
  it('starts with no surveys and reports the event', async () => {
    const res = await getRes(surveysPath());
    const body = await expectJson<{ event: { id: number; title: string }; surveys: unknown[] }>(
      res,
      200
    );
    expect(body.event.id).toBe(eventId);
    expect(body.event.title).toContain(E2E_PREFIX);
    expect(body.surveys).toEqual([]);
  });

  it('rejects a survey without a name', async () => {
    const res = await postJson(surveysPath(), { phone: '3001112233' });
    const body = await expectJson<{ error: string }>(res, 400);
    expect(body.error).toContain('Nombre');
  });

  it('rejects a survey without a phone', async () => {
    const res = await postJson(surveysPath(), { name: 'Ana' });
    const body = await expectJson<{ error: string }>(res, 400);
    expect(body.error).toContain('Teléfono');
  });

  it('404s for an unknown event', async () => {
    const res = await postJson('/api/admin/surveys/99999', { name: 'Ana', phone: '3001112233' });
    expect(res.status).toBe(404);
  });

  it('stores checks, unanswered questions and open answers', async () => {
    const res = await postJson(surveysPath(), {
      name: `${E2E_PREFIX}Ana Pérez`,
      phone: '3001112233',
      neighborhood: 'Boquerón',
      address: 'Torre 1 Ap 101',
      hasHighBloodPressure: true,
      otherCondition: 'Asma',
      familyHistory: true,
      familyHistoryDetail: 'Madre',
      drinksWater: false,
      exercises: true,
      wantsPersonalFinanceCourse: true,
      neighborhoodIssue: 'Falta de agua potable',
      neighborhoodImprovement: 'Jornadas con la junta de acción comunal',
    });

    const survey = await expectJson<Record<string, unknown>>(res, 201);
    expect(survey.name).toBe(`${E2E_PREFIX}Ana Pérez`);
    expect(survey.hasHighBloodPressure).toBe(1);
    expect(survey.hasDiabetes).toBe(0);
    expect(survey.drinksWater).toBe(0);
    expect(survey.exercises).toBe(1);
    // never asked: stays distinguishable from "No"
    expect(survey.sleepsEightHours).toBeNull();
    expect(survey.wantsPersonalFinanceCourse).toBe(1);
    expect(survey.neighborhoodIssue).toBe('Falta de agua potable');
    expect(survey.volunteerEventId).toBe(eventId);
    // locally there is no Cloudflare Access header, so nobody is attributed
    expect(survey.capturedBy).toBeNull();
  });

  it('lists the survey and counts it on the events list', async () => {
    const list = await getRes(surveysPath());
    const body = await expectJson<{ surveys: { id: number; name: string }[] }>(list, 200);
    expect(body.surveys).toHaveLength(1);

    const events = await getRes('/api/admin/volunteer-events');
    const eventsBody = await expectJson<
      { id: number; _count: { healthSurveys: number; registrations: number } }[]
    >(events, 200);
    const event = eventsBody.find((e) => e.id === eventId);
    expect(event?._count.healthSurveys).toBe(1);
  });

  it('edits a survey and clears an answer', async () => {
    const list = await getRes(surveysPath());
    const { surveys } = await expectJson<{ surveys: { id: number }[] }>(list, 200);
    const surveyId = surveys[0].id;

    const res = await putJson(`${surveysPath()}/${surveyId}`, {
      name: `${E2E_PREFIX}Ana Pérez Gómez`,
      phone: '3009998877',
      drinksWater: true,
      exercises: null,
      hasHighBloodPressure: false,
    });

    const updated = await expectJson<Record<string, unknown>>(res, 200);
    expect(updated.name).toBe(`${E2E_PREFIX}Ana Pérez Gómez`);
    expect(updated.drinksWater).toBe(1);
    expect(updated.exercises).toBeNull();
    expect(updated.hasHighBloodPressure).toBe(0);
    // fields left out of the payload are cleared, the form always posts them all
    expect(updated.neighborhoodIssue).toBeNull();
  });

  it('cannot reach a survey through another event', async () => {
    const list = await getRes(surveysPath());
    const { surveys } = await expectJson<{ surveys: { id: number }[] }>(list, 200);
    const surveyId = surveys[0].id;

    const wrongEvent = await putJson(`${surveysPath(otherEventId)}/${surveyId}`, { name: 'Otra' });
    expect(wrongEvent.status).toBe(404);

    const wrongDelete = await del(`${surveysPath(otherEventId)}/${surveyId}`);
    expect(wrongDelete.status).toBe(404);
  });

  it('deletes a survey and 404s the second time', async () => {
    const list = await getRes(surveysPath());
    const { surveys } = await expectJson<{ surveys: { id: number }[] }>(list, 200);
    const surveyId = surveys[0].id;

    const res = await del(`${surveysPath()}/${surveyId}`);
    expect(res.status).toBe(200);

    const again = await del(`${surveysPath()}/${surveyId}`);
    expect(again.status).toBe(404);

    const after = await getRes(surveysPath());
    const body = await expectJson<{ surveys: unknown[] }>(after, 200);
    expect(body.surveys).toEqual([]);
  });
});

describe('health survey admin page', () => {
  it('renders the capture view without the admin navigation', async () => {
    const res = await getRes(`/admin/surveys/${eventId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Encuesta de Salud');
    // the standalone view must not offer the rest of the admin
    expect(html).not.toContain('Admin Dashboard');
    expect(html).not.toContain('/admin/members');
  });
});
