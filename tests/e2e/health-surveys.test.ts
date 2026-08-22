import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { E2E_PREFIX } from './config';
import { getRes, postJson, putJson, del, expectJson } from './helpers';

// Ley 1581 consent gates every write: the health answers are sensitive data.
const CONSENT = { acceptsDataTreatment: true };

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

  it('stores an anonymous survey: nobody has to give their name or phone', async () => {
    const res = await postJson(surveysPath(), { ...CONSENT, neighborhood: 'El Jordán etapa 1' });
    const survey = await expectJson<{ id: number; name: string | null; phone: string | null }>(
      res,
      201
    );
    expect(survey.name).toBeNull();
    expect(survey.phone).toBeNull();
    await del(`${surveysPath()}/${survey.id}`);
  });

  it('rejects an impossible age instead of storing the survey without it', async () => {
    const res = await postJson(surveysPath(), { ...CONSENT, name: 'Ana', age: '355' });
    const body = await expectJson<{ error: string }>(res, 400);
    expect(body.error).toContain('Edad');
  });

  it('refuses to store a survey without the data-treatment consent', async () => {
    const res = await postJson(surveysPath(), { name: 'Ana', phone: '3001112255' });
    const body = await expectJson<{ error: string }>(res, 400);
    expect(body.error).toContain('autorizar el tratamiento');
  });

  it('404s for an unknown event', async () => {
    const res = await postJson('/api/admin/surveys/99999', {
      name: 'Ana',
      phone: '3001112233',
      ...CONSENT,
    });
    expect(res.status).toBe(404);
  });

  it('stores checks, unanswered questions and open answers', async () => {
    const res = await postJson(surveysPath(), {
      ...CONSENT,
      name: `${E2E_PREFIX}Ana Pérez`,
      phone: '3001112233',
      age: '41',
      neighborhood: 'Boquerón',
      hasHighBloodPressure: true,
      otherCondition: 'Asma',
      familyHistory: true,
      familyHistoryDetail: 'Madre',
      drinksWater: 'no',
      exercises: 'aveces',
      wantsPersonalFinanceCourse: true,
      neighborhoodIssue: 'Falta de agua potable',
      neighborhoodImprovement: 'Jornadas con la junta de acción comunal',
    });

    const survey = await expectJson<Record<string, unknown>>(res, 201);
    expect(survey.name).toBe(`${E2E_PREFIX}Ana Pérez`);
    expect(survey.hasHighBloodPressure).toBe(1);
    expect(survey.hasDiabetes).toBe(0);
    expect(survey.drinksWater).toBe('no');
    // "a veces" is a level of its own, not a "No" in disguise
    expect(survey.exercises).toBe('aveces');
    // never asked: stays distinguishable from "No"
    expect(survey.sleepsEightHours).toBeNull();
    expect(survey.wantsPersonalFinanceCourse).toBe(1);
    expect(survey.neighborhoodIssue).toBe('Falta de agua potable');
    expect(survey.volunteerEventId).toBe(eventId);
    expect(survey.age).toBe(41);
    expect(survey.acceptsDataTreatment).toBe(1);
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
      ...CONSENT,
      name: `${E2E_PREFIX}Ana Pérez Gómez`,
      phone: '3009998877',
      drinksWater: 'si',
      exercises: null,
      hasHighBloodPressure: false,
    });

    const updated = await expectJson<Record<string, unknown>>(res, 200);
    expect(updated.name).toBe(`${E2E_PREFIX}Ana Pérez Gómez`);
    expect(updated.drinksWater).toBe('si');
    expect(updated.exercises).toBeNull();
    expect(updated.hasHighBloodPressure).toBe(0);
    // fields left out of the payload are cleared, the form always posts them all
    expect(updated.neighborhoodIssue).toBeNull();
  });

  it('warns about a repeated phone and stores it when insisted', async () => {
    const twin = {
      ...CONSENT,
      name: `${E2E_PREFIX}Hermana Misma Línea`,
      phone: '3009998877', // same phone the survey above ended up with
    };

    const conflict = await postJson(surveysPath(), twin);
    const body = await expectJson<{ error: string; duplicate: boolean }>(conflict, 409);
    expect(body.duplicate).toBe(true);
    expect(body.error).toContain('ese teléfono');

    // a household can share a line: insisting goes through
    const forced = await postJson(surveysPath(), { ...twin, allowDuplicate: true });
    const created = await expectJson<{ id: number }>(forced, 201);
    await del(`${surveysPath()}/${created.id}`);
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

// Volunteers capture on iPads with no signal: surveys queue on the device and
// are retried when it comes back, so the same POST can arrive twice — or arrive
// once and have its response lost on the way home. The clientId is what keeps
// that retry from storing a second row.
describe('health survey offline retries', () => {
  const clientId = 'e2e-ipad-a-0001';
  const phone = '3005550011';
  const payload = {
    ...CONSENT,
    name: `${E2E_PREFIX}Reintento Ana`,
    phone,
    clientId,
    hasDiabetes: true,
  };
  let surveyId = 0;

  afterAll(async () => {
    if (surveyId) await del(`${surveysPath()}/${surveyId}`);
  });

  it('stores the survey once and answers the retry with the same row', async () => {
    const first = await postJson(surveysPath(), payload);
    const created = await expectJson<{ id: number; clientId: string }>(first, 201);
    surveyId = created.id;
    expect(created.clientId).toBe(clientId);

    // the same POST again: the success the device never got to see
    const retry = await postJson(surveysPath(), payload);
    const same = await expectJson<{ id: number }>(retry, 200);
    expect(same.id).toBe(created.id);

    const list = await getRes(surveysPath());
    const { surveys } = await expectJson<{ surveys: { id: number; clientId: string }[] }>(
      list,
      200
    );
    expect(surveys.filter((s) => s.clientId === clientId)).toHaveLength(1);
    expect(surveys).toHaveLength(1);
  });

  it('does not answer 409 to a retry whose phone is already stored', async () => {
    // the phone matches the row the retry itself created, so checking duplicates
    // before the clientId would 409 here and leave the survey stuck in the queue
    const retry = await postJson(surveysPath(), payload);
    const body = await expectJson<{ id: number; duplicate?: boolean }>(retry, 200);
    expect(body.id).toBe(surveyId);
    expect(body.duplicate).toBeUndefined();
  });

  it('still warns about a real duplicate phone from another device', async () => {
    const other = await postJson(surveysPath(), {
      ...CONSENT,
      name: `${E2E_PREFIX}Otra Persona`,
      phone,
      clientId: 'e2e-ipad-b-0002',
    });
    const body = await expectJson<{ error: string; duplicate: boolean }>(other, 409);
    expect(body.duplicate).toBe(true);
    expect(body.error).toContain('ese teléfono');
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
