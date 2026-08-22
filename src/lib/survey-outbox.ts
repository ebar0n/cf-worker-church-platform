// Outbox for health surveys captured without connectivity.
//
// The one rule that matters: a queued survey is deleted ONLY when the server
// answers with the stored row. Anything else — a network error, an expired
// Cloudflare Access session answering with its login page, a validation error,
// a real duplicate — keeps the record in the queue. "The request did not throw"
// is not proof that a survey was saved, and treating it as such silently loses
// work a volunteer already did in front of a person.
//
// The queue lives in IndexedDB rather than localStorage: it survives more, has
// no practical size cap for a jornada, and does not block the UI thread while a
// volunteer types.

export interface QueuedSurvey {
  /** Idempotency key: the API upserts by this, so a retry cannot duplicate. */
  clientId: string;
  eventId: number;
  payload: Record<string, unknown>;
  /** Device time when the volunteer saved it, not when it reached the server. */
  capturedAt: string;
  /** Name shown in the pending list, so the volunteer recognizes the record. */
  name: string;
  attempts: number;
  lastError?: string;
}

export interface OutboxStore {
  all(): Promise<QueuedSurvey[]>;
  put(item: QueuedSurvey): Promise<void>;
  remove(clientId: string): Promise<void>;
}

export type KeptReason = 'offline' | 'auth' | 'duplicate' | 'invalid' | 'server';

export type SyncOutcome =
  | { status: 'synced'; item: QueuedSurvey }
  | { status: 'kept'; item: QueuedSurvey; reason: KeptReason; message?: string };

export interface PostResult {
  /** HTTP status, or 0 when the request never got an answer. */
  status: number;
  /** Parsed JSON body, or null when the answer was not JSON (a login page). */
  body: Record<string, unknown> | null;
  /** True when the response was a redirect or an opaque cross-origin answer. */
  redirected?: boolean;
}

const DB_NAME = 'jordan-surveys';
const DB_VERSION = 1;
const STORE = 'outbox';

/**
 * Decides what a response means for the queue. Split out from the request so
 * the rule can be tested exhaustively — it is the part that must never be
 * wrong.
 */
export function interpretResponse(
  item: QueuedSurvey,
  result: PostResult
): { status: 'synced' | 'kept'; reason?: KeptReason; message?: string } {
  // Never trust a redirect: Cloudflare Access answers with one (to its login
  // page) when the session expired, and its body is HTML, not our API.
  if (result.redirected || result.body === null) {
    return {
      status: 'kept',
      reason: result.status === 0 ? 'offline' : 'auth',
      message:
        result.status === 0
          ? 'Sin conexión'
          : 'La sesión expiró: vuelve a iniciar sesión para enviar lo pendiente',
    };
  }

  if (result.status === 0) {
    return { status: 'kept', reason: 'offline', message: 'Sin conexión' };
  }

  // The only path that deletes: our API answered with the stored row. A retry
  // of a survey the server already has comes back 200 with the same row, which
  // is exactly as final as the original 201.
  if ((result.status === 201 || result.status === 200) && typeof result.body.id === 'number') {
    return { status: 'synced' };
  }

  if (result.status === 401 || result.status === 403) {
    return {
      status: 'kept',
      reason: 'auth',
      message: 'La sesión expiró: vuelve a iniciar sesión para enviar lo pendiente',
    };
  }

  if (result.status === 409 && result.body.duplicate === true) {
    return {
      status: 'kept',
      reason: 'duplicate',
      message: typeof result.body.error === 'string' ? result.body.error : 'Teléfono repetido',
    };
  }

  if (result.status === 400) {
    return {
      status: 'kept',
      reason: 'invalid',
      message: typeof result.body.error === 'string' ? result.body.error : 'Datos incompletos',
    };
  }

  return {
    status: 'kept',
    reason: 'server',
    message: typeof result.body.error === 'string' ? result.body.error : `Error ${result.status}`,
  };
}

/**
 * Walks the queue in capture order, oldest first, so a jornada syncs in the
 * order it happened. Stops early on an auth failure: every later item would
 * fail the same way and burn attempts for nothing.
 */
export async function flushOutbox(
  store: OutboxStore,
  post: (item: QueuedSurvey) => Promise<PostResult>
): Promise<SyncOutcome[]> {
  const pending = (await store.all()).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const outcomes: SyncOutcome[] = [];

  for (const item of pending) {
    let result: PostResult;
    try {
      result = await post(item);
    } catch {
      result = { status: 0, body: null };
    }

    const verdict = interpretResponse(item, result);

    if (verdict.status === 'synced') {
      await store.remove(item.clientId);
      outcomes.push({ status: 'synced', item });
      continue;
    }

    const kept: QueuedSurvey = {
      ...item,
      attempts: item.attempts + 1,
      lastError: verdict.message,
    };
    await store.put(kept);
    outcomes.push({
      status: 'kept',
      item: kept,
      reason: verdict.reason ?? 'server',
      message: verdict.message,
    });

    if (verdict.reason === 'offline' || verdict.reason === 'auth') break;
  }

  return outcomes;
}

/** In-memory store, for tests. */
export function createMemoryStore(initial: QueuedSurvey[] = []): OutboxStore {
  const items = new Map(initial.map((item) => [item.clientId, item]));

  return {
    all: async () => [...items.values()],
    put: async (item) => void items.set(item.clientId, item),
    remove: async (clientId) => void items.delete(clientId),
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'clientId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

/** IndexedDB store, for the browser. */
export function createIdbStore(): OutboxStore {
  return {
    all: () => tx<QueuedSurvey[]>('readonly', (store) => store.getAll()),
    put: (item) => tx('readwrite', (store) => store.put(item)).then(() => undefined),
    remove: (clientId) => tx('readwrite', (store) => store.delete(clientId)).then(() => undefined),
  };
}

export const newClientId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `cid-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
