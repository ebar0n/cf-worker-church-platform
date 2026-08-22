'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createIdbStore,
  flushOutbox,
  newClientId,
  type OutboxStore,
  type PostResult,
  type QueuedSurvey,
} from '@/lib/survey-outbox';

export interface OutboxState {
  pending: QueuedSurvey[];
  online: boolean;
  syncing: boolean;
  /** Set when the queue could not be drained, e.g. an expired Access session. */
  blockedMessage: string;
}

async function postSurvey(eventId: number, item: QueuedSurvey): Promise<PostResult> {
  const res = await fetch(`/api/admin/surveys/${eventId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...item.payload,
      clientId: item.clientId,
      capturedAt: item.capturedAt,
      interviewerName: item.interviewerName,
    }),
  });

  // A Cloudflare Access login page is HTML, so JSON parsing fails: that is the
  // signal the survey was NOT stored, and the queue must keep it.
  let body: Record<string, unknown> | null = null;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  return { status: res.status, body, redirected: res.redirected || res.type === 'opaqueredirect' };
}

/**
 * Durable save path for surveys: every save is written to the queue first and
 * only then sent. A tab that dies between the two still has the survey on the
 * device, and nothing is ever removed from the queue without the server
 * answering with the stored row.
 */
export function useSurveyOutbox(
  eventId: number,
  interviewerName = '',
  store: OutboxStore = createIdbStore()
) {
  const storeRef = useRef(store);
  const [pending, setPending] = useState<QueuedSurvey[]>([]);
  // Queued for other jornadas: sync drains the whole queue, but the panel only
  // lists this event's, so without this a volunteer who opens another jornada
  // sees nothing and assumes the device is empty.
  const [pendingElsewhere, setPendingElsewhere] = useState(0);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');

  const refresh = useCallback(async () => {
    const all = await storeRef.current.all();
    setPending(all.filter((item) => item.eventId === eventId));
    setPendingElsewhere(all.filter((item) => item.eventId !== eventId).length);
  }, [eventId]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const outcomes = await flushOutbox(storeRef.current, (item) =>
        postSurvey(item.eventId, item)
      );
      const blocked = outcomes.find((o) => o.status === 'kept');
      setBlockedMessage(blocked && blocked.status === 'kept' ? (blocked.message ?? '') : '');
      await refresh();
      return outcomes;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  /**
   * Retries one queued survey. `allowDuplicate` is how the volunteer answers
   * the API's duplicate warning for a survey that was captured offline and only
   * hit the check at sync time.
   */
  const retry = useCallback(
    async (clientId: string, options: { allowDuplicate?: boolean } = {}) => {
      const item = (await storeRef.current.all()).find((i) => i.clientId === clientId);
      if (!item) return;

      if (options.allowDuplicate) {
        await storeRef.current.put({
          ...item,
          payload: { ...item.payload, allowDuplicate: true },
        });
      }

      return sync();
    },
    [sync]
  );

  /**
   * Removes a queued survey. Only ever called from an explicit, confirmed
   * action by the volunteer — the sync path never discards anything.
   */
  const discard = useCallback(
    async (clientId: string) => {
      await storeRef.current.remove(clientId);
      await refresh();
    },
    [refresh]
  );

  /** Queues the survey, then tries to send it right away. */
  const saveThroughOutbox = useCallback(
    async (payload: Record<string, unknown>, name: string) => {
      const item: QueuedSurvey = {
        clientId: newClientId(),
        eventId,
        payload,
        // Device time: with a queue, the server's insert time is when signal
        // came back, not when the person was surveyed.
        capturedAt: new Date().toISOString(),
        name,
        interviewerName: interviewerName || undefined,
        attempts: 0,
      };

      await storeRef.current.put(item);
      await refresh();

      const outcomes = await sync();
      return outcomes.find((o) => o.item.clientId === item.clientId);
    },
    [eventId, refresh, sync, interviewerName]
  );

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();

    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => setOnline(false);
    // iOS has no Background Sync, so retries have to happen in the foreground
    const onFocus = () => {
      if (navigator.onLine) sync();
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, sync]);

  // Closing the app with surveys still on the device is the one thing a
  // volunteer must not do by accident.
  useEffect(() => {
    if (pending.length === 0) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending.length]);

  return {
    pending,
    pendingElsewhere,
    online,
    syncing,
    blockedMessage,
    saveThroughOutbox,
    sync,
    retry,
    discard,
    refresh,
  };
}
