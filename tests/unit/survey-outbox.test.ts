import { describe, it, expect } from 'vitest';
import {
  createMemoryStore,
  flushOutbox,
  interpretResponse,
  newClientId,
  type PostResult,
  type QueuedSurvey,
} from '@/lib/survey-outbox';

const queued = (overrides: Partial<QueuedSurvey> = {}): QueuedSurvey => ({
  clientId: 'cid-1',
  eventId: 1,
  payload: { name: 'Ana', phone: '3001234567', acceptsDataTreatment: true },
  capturedAt: '2026-08-22T14:00:00.000Z',
  name: 'Ana',
  attempts: 0,
  ...overrides,
});

describe('interpretResponse', () => {
  const item = queued();

  it('only calls it synced when the API answers with the stored row', () => {
    expect(interpretResponse(item, { status: 201, body: { id: 7 } })).toEqual({ status: 'synced' });
    // a retry of something the server already had is just as final
    expect(interpretResponse(item, { status: 200, body: { id: 7 } })).toEqual({ status: 'synced' });
  });

  it('keeps the survey when there was no answer at all', () => {
    expect(interpretResponse(item, { status: 0, body: null })).toMatchObject({
      status: 'kept',
      reason: 'offline',
    });
  });

  it('keeps the survey when Cloudflare Access answers with its login page', () => {
    // the dangerous case: a 200 that is HTML, not our API
    expect(interpretResponse(item, { status: 200, body: null, redirected: true })).toMatchObject({
      status: 'kept',
      reason: 'auth',
    });
    expect(interpretResponse(item, { status: 200, body: null })).toMatchObject({
      status: 'kept',
      reason: 'auth',
    });
    expect(interpretResponse(item, { status: 403, body: { error: 'forbidden' } })).toMatchObject({
      status: 'kept',
      reason: 'auth',
    });
  });

  it('never treats a 2xx without an id as saved', () => {
    expect(interpretResponse(item, { status: 200, body: { ok: true } })).toMatchObject({
      status: 'kept',
    });
    expect(interpretResponse(item, { status: 201, body: { id: 'seven' } })).toMatchObject({
      status: 'kept',
    });
  });

  it('keeps a real duplicate for the operator to decide', () => {
    expect(
      interpretResponse(item, {
        status: 409,
        body: { duplicate: true, error: 'Ya hay una encuesta con ese teléfono' },
      })
    ).toMatchObject({ status: 'kept', reason: 'duplicate' });
  });

  it('keeps an invalid payload instead of dropping the data', () => {
    expect(
      interpretResponse(item, { status: 400, body: { error: 'Nombre es requerido' } })
    ).toMatchObject({ status: 'kept', reason: 'invalid', message: 'Nombre es requerido' });
  });

  it('keeps anything else, including server errors', () => {
    expect(interpretResponse(item, { status: 500, body: { error: 'boom' } })).toMatchObject({
      status: 'kept',
      reason: 'server',
    });
  });
});

describe('flushOutbox', () => {
  it('sends oldest first and removes only what the server confirmed', async () => {
    const store = createMemoryStore([
      queued({ clientId: 'b', capturedAt: '2026-08-22T15:00:00.000Z', name: 'Beto' }),
      queued({ clientId: 'a', capturedAt: '2026-08-22T14:00:00.000Z', name: 'Ana' }),
    ]);

    const sent: string[] = [];
    const outcomes = await flushOutbox(store, async (item) => {
      sent.push(item.clientId);
      return item.clientId === 'a'
        ? { status: 201, body: { id: 1 } }
        : { status: 400, body: { error: 'Teléfono es requerido' } };
    });

    expect(sent).toEqual(['a', 'b']);
    expect(outcomes.map((o) => o.status)).toEqual(['synced', 'kept']);

    const left = await store.all();
    expect(left.map((i) => i.clientId)).toEqual(['b']);
    expect(left[0].attempts).toBe(1);
    expect(left[0].lastError).toBe('Teléfono es requerido');
  });

  it('keeps everything when the request throws', async () => {
    const store = createMemoryStore([queued()]);

    const outcomes = await flushOutbox(store, async () => {
      throw new Error('network down');
    });

    expect(outcomes[0]).toMatchObject({ status: 'kept', reason: 'offline' });
    expect(await store.all()).toHaveLength(1);
  });

  it('stops after an auth failure instead of burning the whole queue', async () => {
    const store = createMemoryStore([
      queued({ clientId: 'a', capturedAt: '2026-08-22T14:00:00.000Z' }),
      queued({ clientId: 'b', capturedAt: '2026-08-22T15:00:00.000Z' }),
      queued({ clientId: 'c', capturedAt: '2026-08-22T16:00:00.000Z' }),
    ]);

    let calls = 0;
    const outcomes = await flushOutbox(store, async () => {
      calls += 1;
      return { status: 200, body: null, redirected: true };
    });

    expect(calls).toBe(1);
    expect(outcomes).toHaveLength(1);
    expect(await store.all()).toHaveLength(3);
  });

  it('drains a queue the server accepts', async () => {
    const store = createMemoryStore([
      queued({ clientId: 'a', capturedAt: '2026-08-22T14:00:00.000Z' }),
      queued({ clientId: 'b', capturedAt: '2026-08-22T15:00:00.000Z' }),
    ]);

    await flushOutbox(store, async () => ({ status: 201, body: { id: 1 } }));
    expect(await store.all()).toEqual([]);
  });
});

describe('newClientId', () => {
  it('gives a distinct id per survey', () => {
    expect(newClientId()).not.toBe(newClientId());
  });
});
