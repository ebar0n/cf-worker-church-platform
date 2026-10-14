'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CircleCheck, ClipboardList, WifiOff } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  DEPENDENTS,
  FREQUENCY_LABELS,
  FREQUENCY_VALUES,
  MAX_AGE,
  SURVEY_BLOCKS,
  emptySurveyValues,
  rowToFormValues,
  summarizeSurveys,
  surveysToCsv,
  type BlockStat,
  type SurveyPayload,
  type SurveyQuestion,
  type SurveySummary,
} from '@/lib/health-survey';
import { downloadCsv } from '@/lib/csv';
import SurveyBarChart from '@/app/admin/components/SurveyBarChart';
import { useSurveyOutbox } from '@/app/admin/components/useSurveyOutbox';
import AccessLogoutButton from '@/app/admin/components/AccessLogoutButton';
import type { QueuedSurvey } from '@/lib/survey-outbox';

interface SurveyRow extends Record<string, unknown> {
  id: number;
  name: string;
  phone: string;
  neighborhood: string | null;
  capturedBy: string | null;
  capturedAt: string | null;
  createdAt: string;
}

interface Props {
  eventId: number;
  volunteerEmail: string;
}

// One page fills a tablet screen; a jornada can leave hundreds of records and
// rendering them all is what makes the iPad crawl.
const PAGE_SIZE = 25;

type SortKey = 'name' | 'phone' | 'neighborhood' | 'createdAt';

// A survey queued offline reaches the server hours later, so its own capture
// time is the real one; createdAt is the insert time and only a fallback.
const surveyMoment = (survey: SurveyRow) => survey.capturedAt || survey.createdAt;

// "hace 6 minutos" is what lets a volunteer tell whether the draft belongs to
// the person in front of them or to the previous one.
const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - parseDate(iso)) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return 'hace unos segundos';
  if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  const hours = Math.round(minutes / 60);
  return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
};

// D1 hands back either an ISO string or "YYYY-MM-DD HH:MM:SS" (UTC)
const parseDate = (value: string) =>
  new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z').getTime();

const formatDate = (value: string) => {
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HealthSurveysAdmin({ eventId, volunteerEmail }: Props) {
  const [eventTitle, setEventTitle] = useState('');
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // null = list view; otherwise the survey being edited (id null = new one)
  const [editing, setEditing] = useState<{ id: number | null; values: SurveyPayload } | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  // The dashboard pushed the list below the fold, so the two live in tabs.
  // Metrics lead: capture starts from the always-visible "Nueva encuesta".
  const [tab, setTab] = useState<'list' | 'stats'>('stats');
  const [page, setPage] = useState(1);
  // The prop comes from the server-rendered HTML, which offline is served from
  // the service worker cache — and that copy may have been rendered for whoever
  // used the iPad before. Re-ask the server whenever there is signal.
  const [accessEmail, setAccessEmail] = useState(volunteerEmail);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => (res.ok ? (res.json() as Promise<{ email?: string }>) : null))
      .then((data) => {
        if (data?.email) setAccessEmail(data.email);
      })
      .catch(() => {
        /* offline: keep the rendered value, and the typed name carries the day */
      });
  }, []);

  // A half-filled form survives a reload or iOS killing the tab, but it is never
  // restored on its own: the volunteer may already be in front of a different
  // person, and silently refilling the fields is how one person's answers end up
  // saved under another's name.
  const [draft, setDraft] = useState<{ values: SurveyPayload; savedAt: string } | null>(null);
  const draftKey = `surveys.draft.${eventId}`;

  const readDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return null;
      return JSON.parse(raw) as { values: SurveyPayload; savedAt: string };
    } catch {
      return null;
    }
  }, [draftKey]);

  const writeDraft = useCallback(
    (values: SurveyPayload) => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ values, savedAt: new Date().toISOString() })
        );
      } catch {
        /* private mode or full storage: the form still works, just unprotected */
      }
    },
    [draftKey]
  );

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* nothing to clean up */
    }
    setDraft(null);
  }, [draftKey]);

  useEffect(() => {
    setDraft(readDraft());
  }, [readDraft]);

  const [interviewer, setInterviewer] = useState('');
  const [interviewerLoaded, setInterviewerLoaded] = useState(false);
  const [editingInterviewer, setEditingInterviewer] = useState(false);

  // Typed once per device and remembered there: with a shared Access account the
  // email identifies nobody, and this survives both the cache and a sign-out.
  useEffect(() => {
    try {
      setInterviewer(localStorage.getItem('surveys.interviewer') || '');
    } catch {
      /* private mode or blocked storage: the name is simply not remembered */
    }
    setInterviewerLoaded(true);
  }, []);

  const saveInterviewer = (value: string) => {
    setInterviewer(value);
    try {
      localStorage.setItem('surveys.interviewer', value);
    } catch {
      /* nothing to do: the name still applies to this session */
    }
  };

  const outbox = useSurveyOutbox(eventId, interviewer);
  // Set while the survey on screen is already queued on the device, so pressing
  // Guardar again retries that queued item instead of creating a second one.
  const [queuedClientId, setQueuedClientId] = useState<string | null>(null);

  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'createdAt',
    dir: 'desc',
  });

  const loadSurveys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/surveys/${eventId}`);
      if (res.status === 404) throw new Error('Evento no encontrado');
      // The service worker answers 503 {offline} rather than serving stale
      // records: capturing still works, only the list needs signal.
      if (res.status === 503) {
        throw new Error('Sin conexión: el listado y las métricas se verán cuando haya señal');
      }
      if (!res.ok) throw new Error('No se pudieron cargar las encuestas');
      const data = (await res.json()) as {
        event: { id: number; title: string };
        surveys: SurveyRow[];
      };
      setEventTitle(data.event.title);
      setSurveys(data.surveys);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando encuestas');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  // The form is much taller than the list, so a swap that keeps the scroll
  // position leaves the viewport past the end of the new content.
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

  const startNew = () => {
    setDuplicateWarning('');
    setQueuedClientId(null);
    setStatusMessage('');
    setEditing({ id: null, values: emptySurveyValues() });
    scrollToTop();
  };
  const startEdit = (survey: SurveyRow) => {
    setDuplicateWarning('');
    setQueuedClientId(null);
    setStatusMessage('');
    setEditing({ id: survey.id, values: rowToFormValues(survey) });
    scrollToTop();
  };
  const closeForm = () => {
    // Cancelling is a decision; the draft only outlives what was not chosen.
    clearDraft();
    setDuplicateWarning('');
    setError('');
    setEditing(null);
    scrollToTop();
  };

  const setValue = (field: string, value: string | boolean | null) => {
    setEditing((current) => {
      if (!current) return current;

      const values = { ...current.values, [field]: value };
      // Answering "No" (or clearing the answer) drops the follow-up it carried
      if (value !== true) {
        for (const followUp of DEPENDENTS[field] ?? []) values[followUp] = '';
      }

      // Only new captures are protected: an edit of a stored survey has the
      // server copy to fall back on.
      if (current.id === null) writeDraft(values);

      return { ...current, values };
    });
  };

  const finishSave = (startAnother: boolean) => {
    clearDraft();
    setDuplicateWarning('');
    setQueuedClientId(null);
    setEditing(startAnother ? { id: null, values: emptySurveyValues() } : null);
    scrollToTop();
  };

  // New surveys go through the outbox: written to the device first, then sent.
  // A tab that dies mid-request still has the survey, and nothing leaves the
  // queue without the server answering with the stored row.
  const saveNew = async (startAnother: boolean, values: SurveyPayload) => {
    const name = String(values.name ?? '').trim() || 'Sin nombre';
    const outcome = queuedClientId
      ? (await outbox.retry(queuedClientId, { allowDuplicate: duplicateWarning !== '' }))?.find(
          (o) => o.item.clientId === queuedClientId
        )
      : await outbox.saveThroughOutbox(values, name);

    if (!outcome) {
      setError('No se pudo guardar la encuesta');
      return;
    }

    if (outcome.status === 'synced') {
      await loadSurveys();
      finishSave(startAnother);
      return;
    }

    setQueuedClientId(outcome.item.clientId);

    if (outcome.reason === 'duplicate') {
      setDuplicateWarning(
        outcome.message || 'Ya hay una encuesta con ese teléfono en este evento.'
      );
      return;
    }

    if (outcome.reason === 'invalid') {
      // The data is still on screen, so the queued copy would be a duplicate of
      // what the volunteer is about to fix. Dropping it here loses nothing.
      await outbox.discard(outcome.item.clientId);
      setQueuedClientId(null);
      setError(outcome.message || 'Datos incompletos');
      return;
    }

    // The server answered and refused it (e.g. the jornada was deleted): signal
    // will not fix that, so do not promise it. It stays in the pending panel.
    if (outcome.reason === 'server') {
      setError(
        `El servidor no aceptó la encuesta de ${name} (${outcome.message}). Quedó guardada en este dispositivo, sin enviar: avisa al coordinador.`
      );
      finishSave(startAnother);
      return;
    }

    // Offline or an expired session: the survey is safely on the device, so the
    // form can close. The pending panel is what tells the volunteer it is there.
    setStatusMessage(
      outcome.reason === 'auth'
        ? 'Guardada en el dispositivo. La sesión expiró: vuelve a iniciar sesión para enviarla.'
        : 'Guardada en el dispositivo. Se enviará cuando haya señal.'
    );
    finishSave(startAnother);
  };

  const save = async (startAnother: boolean) => {
    if (!editing) return;

    setSaving(true);
    setError('');
    setStatusMessage('');
    try {
      if (editing.id === null) {
        await saveNew(startAnother, editing.values);
        return;
      }

      // Editing an existing survey needs the server: it is not queued, because
      // merging offline edits of a row someone else may have changed is a
      // different problem than capturing a new one.
      const res = await fetch(`/api/admin/surveys/${eventId}/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing.values),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'No se pudo guardar la encuesta');
      }

      await loadSurveys();
      finishSave(startAnother);
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'Failed to fetch'
          ? err.message
          : 'Sin conexión: para editar una encuesta ya guardada hace falta señal'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    setError('');
    try {
      const res = await fetch(`/api/admin/surveys/${eventId}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('No se pudo eliminar la encuesta');
      setConfirmDeleteId(null);
      await loadSurveys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando la encuesta');
    }
  };

  const neighborhoodSuggestions = [
    ...new Set(
      surveys
        .map((s) => (s.neighborhood || '').trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'es'))
    ),
  ];

  const term = search.trim().toLowerCase();
  const visible = term
    ? surveys.filter((s) =>
        [s.name, s.phone, s.neighborhood]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))
      )
    : surveys;

  // Indicators follow the search, so filtering by barrio also narrows the
  // dashboard; the header says which set is being summarized.
  const summary = summarizeSurveys(visible);

  const sorted = [...visible].sort((a, b) => {
    const factor = sort.dir === 'asc' ? 1 : -1;
    if (sort.key === 'createdAt') {
      return factor * (parseDate(surveyMoment(a)) - parseDate(surveyMoment(b)));
    }
    const left = String(a[sort.key] ?? '');
    const right = String(b[sort.key] ?? '');
    // blanks last regardless of direction, they carry no information
    if (!left !== !right) return left ? -1 : 1;
    return factor * left.localeCompare(right, 'es');
  });

  const toggleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'createdAt' ? 'desc' : 'asc' }
    );
    // re-sorting from page 3 would show the middle of the new order
    setPage(1);
  };

  // Clamp instead of resetting: deleting the last row of the last page should
  // land on the new last page, not on a blank one.
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  const exportCsv = () => {
    downloadCsv(`${eventTitle || 'evento'}_encuestas.csv`, surveysToCsv(visible));
  };

  // Asked on arrival, not at save time: the typed name is the only record of who
  // ran the interview, and discovering it is missing after a full form is worse.
  if (interviewerLoaded && !interviewer.trim()) {
    return <InterviewerPrompt eventTitle={eventTitle} onSubmit={saveInterviewer} />;
  }

  return (
    <div className="bg-paper min-h-screen">
      {/* Standalone header: this view is used by volunteers on shared iPads,
          so it deliberately carries no admin navigation. */}
      <header className="border-line flex items-start justify-between gap-3 border-b bg-white px-5 py-4 md:items-center md:px-8">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight md:text-[32px]">Encuesta de Salud</h1>
          {/* Tapping the jornada reloads its records and retries whatever is
              queued: the gesture a volunteer reaches for after regaining signal. */}
          <button
            type="button"
            onClick={() => {
              loadSurveys();
              outbox.sync();
            }}
            className="text-ink-soft hover:text-ink text-left text-sm underline decoration-gray-300 underline-offset-4 md:text-base"
            title="Actualizar"
          >
            {eventTitle || 'Voluntariado'}
          </button>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <div className="text-ink-soft hidden text-right text-sm md:block">
            <p>Encuestando</p>
            {editingInterviewer ? (
              <input
                autoFocus
                value={interviewer}
                onChange={(e) => saveInterviewer(e.target.value)}
                onBlur={() => setEditingInterviewer(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingInterviewer(false)}
                placeholder="Su nombre"
                className="text-ink focus-visible:border-denim h-9 w-44 rounded-lg border border-gray-300 bg-white px-3 text-right text-sm"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingInterviewer(true)}
                className="text-ink font-medium underline decoration-gray-300 underline-offset-4"
              >
                {interviewer || 'Escriba su nombre'}
              </button>
            )}
            {accessEmail && <p className="text-xs">{accessEmail}</p>}
          </div>
          {/* Where the exit lives in the rest of the admin — here going back to
              the picker IS the way out, and it never leads into the admin. */}
          <a href="/admin/surveys" className={headerButtonClass}>
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
            <span className="hidden md:inline">Jornadas</span>
          </a>
          {/* Signing out with surveys still queued strands them: the queue
              cannot sync without a session. */}
          <AccessLogoutButton
            className={headerButtonClass}
            warning={
              outbox.pending.length > 0
                ? `Quedan ${outbox.pending.length} encuestas sin enviar en este dispositivo`
                : undefined
            }
          />
        </div>
      </header>

      {!outbox.online && (
        <div className="bg-ink text-paper flex items-center justify-center gap-2 px-5 py-2.5 text-center text-sm font-medium md:px-8">
          <WifiOff className="text-warm h-4 w-4 flex-none" strokeWidth={1.5} />
          Sin conexión — las encuestas se guardan en el dispositivo y se envían al recuperar señal
        </div>
      )}

      <main className="mx-auto max-w-4xl px-5 py-6 md:px-6 md:py-10">
        {outbox.pending.length === 0 && outbox.pendingElsewhere > 0 && (
          <div className="border-warm bg-warm-soft text-ink mb-4 rounded-xl border px-4 py-3 text-sm">
            Hay {outbox.pendingElsewhere} {outbox.pendingElsewhere === 1 ? 'encuesta' : 'encuestas'}{' '}
            sin enviar de otra jornada en este dispositivo.{' '}
            <button type="button" onClick={() => outbox.sync()} className="font-semibold underline">
              Enviar ahora
            </button>
          </div>
        )}

        {outbox.pending.length > 0 && (
          <PendingPanel
            pendingElsewhere={outbox.pendingElsewhere}
            pending={outbox.pending}
            syncing={outbox.syncing}
            blockedMessage={outbox.blockedMessage}
            onSync={() => outbox.sync()}
            onRetryAllowingDuplicate={(clientId) =>
              outbox.retry(clientId, { allowDuplicate: true })
            }
            onDiscard={(clientId) => outbox.discard(clientId)}
          />
        )}

        {statusMessage && (
          <div className={`${noticeClass} text-ink mb-4`}>
            <CircleCheck className="h-5 w-5 flex-none text-green-700" strokeWidth={1.5} />
            {statusMessage}
          </div>
        )}

        {/* While the form is open the message lives next to Guardar: the top of
            a long form scrolls out of sight. */}
        {error && !editing && (
          <div className={`${noticeClass} mb-4 text-[#b3261e]`}>
            <AlertCircle className="h-5 w-5 flex-none" strokeWidth={1.5} />
            {error}
          </div>
        )}

        {editing ? (
          <SurveyForm
            values={editing.values}
            isNew={editing.id === null}
            saving={saving}
            error={error}
            duplicateWarning={duplicateWarning}
            suggestions={neighborhoodSuggestions}
            onChange={setValue}
            onCancel={closeForm}
            onSave={save}
          />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-heading text-[28px] font-bold leading-tight tracking-[-0.02em] md:text-[32px]">
                  {surveys.length} {surveys.length === 1 ? 'encuesta' : 'encuestas'} registradas
                </p>
                <p className="text-ink-soft mt-1 text-sm">Toque una fila para editarla.</p>
              </div>
              {/* On a phone the capture button goes first, full width */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  onClick={exportCsv}
                  disabled={visible.length === 0}
                  variant="outline"
                  size="lg"
                >
                  Descargar CSV
                </Button>
                <Button onClick={startNew} size="lg">
                  + Nueva encuesta
                </Button>
              </div>
            </div>

            {draft && (
              <DraftNotice
                draft={draft}
                onResume={() => {
                  setDuplicateWarning('');
                  setQueuedClientId(null);
                  setStatusMessage('');
                  setEditing({ id: null, values: draft.values });
                  setDraft(null);
                  scrollToTop();
                }}
                onDiscard={clearDraft}
              />
            )}

            <div role="tablist" className="border-line mb-6 flex gap-2 border-b">
              {(
                [
                  ['stats', 'Métricas'],
                  ['list', `Encuestas (${surveys.length})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`-mb-px border-b-2 px-4 py-3 text-base font-medium transition-colors ${
                    tab === key
                      ? 'border-warm text-ink'
                      : 'text-ink-soft hover:text-ink border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'stats' ? (
              !loading && surveys.length > 0 ? (
                <SurveyDashboard summary={summary} filtered={term.length > 0} />
              ) : (
                <EmptyState>Aún no hay encuestas para calcular métricas.</EmptyState>
              )
            ) : (
              <>
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar por nombre, teléfono o barrio"
                  className="mb-4"
                />

                {loading ? (
                  <p className="text-ink-soft py-8 text-center">Cargando…</p>
                ) : visible.length === 0 ? (
                  <EmptyState>
                    {surveys.length === 0
                      ? 'Aún no hay encuestas registradas para este evento.'
                      : 'Ninguna encuesta coincide con la búsqueda.'}
                  </EmptyState>
                ) : (
                  <>
                    {/* Phones get cards: six columns do not fit, and a horizontally
                    scrolled table hides the actions. */}
                    <ul className="space-y-3 sm:hidden">
                      {pageRows.map((survey) => (
                        <li key={survey.id} className="border-line rounded-2xl border bg-white p-4">
                          <p className="text-ink font-medium">{survey.name}</p>
                          <p className="text-ink text-sm">{survey.phone}</p>
                          <p className="text-ink-soft text-sm">
                            {survey.neighborhood || 'Sin barrio'} ·{' '}
                            {formatDate(surveyMoment(survey))}
                          </p>
                          <div className="mt-3">
                            <RowActions
                              confirming={confirmDeleteId === survey.id}
                              onEdit={() => startEdit(survey)}
                              onAskDelete={() => setConfirmDeleteId(survey.id)}
                              onCancelDelete={() => setConfirmDeleteId(null)}
                              onConfirmDelete={() => remove(survey.id)}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="border-line hidden overflow-x-auto rounded-2xl border bg-white sm:block">
                      <table className="divide-line min-w-full divide-y text-sm">
                        <thead className="text-ink-soft bg-gray-50 text-xs font-semibold uppercase tracking-[.04em]">
                          <tr>
                            {(
                              [
                                ['name', 'Nombre'],
                                ['phone', 'Teléfono'],
                                ['neighborhood', 'Barrio'],
                                ['createdAt', 'Registrada'],
                              ] as const
                            ).map(([key, label]) => (
                              <th
                                key={key}
                                aria-sort={
                                  sort.key === key
                                    ? sort.dir === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : 'none'
                                }
                                className="px-4 py-3 text-left"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleSort(key)}
                                  className="hover:text-ink flex items-center gap-1 uppercase"
                                >
                                  {label}
                                  <span className="text-gray-400">
                                    {sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                                  </span>
                                </button>
                              </th>
                            ))}
                            <th className="px-4 py-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-line divide-y">
                          {pageRows.map((survey) => (
                            <tr key={survey.id} className="hover:bg-gray-50">
                              <td className="text-ink px-4 py-3 font-medium">{survey.name}</td>
                              <td className="text-ink px-4 py-3">{survey.phone || '—'}</td>
                              <td className="text-ink px-4 py-3">{survey.neighborhood || '—'}</td>
                              {/* Stored in UTC and rendered in the viewer's zone;
                                  the tooltip keeps the raw instant auditable. */}
                              <td
                                title={`Capturada: ${surveyMoment(survey)} · Guardada en el servidor: ${survey.createdAt}`}
                                className="text-ink-soft whitespace-nowrap px-4 py-3"
                              >
                                {formatDate(surveyMoment(survey))}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <RowActions
                                  confirming={confirmDeleteId === survey.id}
                                  onEdit={() => startEdit(survey)}
                                  onAskDelete={() => setConfirmDeleteId(survey.id)}
                                  onCancelDelete={() => setConfirmDeleteId(null)}
                                  onConfirmDelete={() => remove(survey.id)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {pageCount > 1 && (
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <Button
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => setPage(currentPage - 1)}
                        >
                          Anterior
                        </Button>
                        <span className="text-ink-soft text-sm">
                          {pageStart + 1}–{pageStart + pageRows.length} de {visible.length}
                        </span>
                        <Button
                          variant="outline"
                          disabled={currentPage === pageCount}
                          onClick={() => setPage(currentPage + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function SurveyForm({
  values,
  isNew,
  saving,
  error,
  duplicateWarning,
  suggestions,
  onChange,
  onCancel,
  onSave,
}: {
  values: SurveyPayload;
  isNew: boolean;
  saving: boolean;
  error: string;
  duplicateWarning: string;
  suggestions: string[];
  onChange: (field: string, value: string | boolean | null) => void;
  onCancel: () => void;
  onSave: (startAnother: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[28px] leading-tight md:text-[32px]">
          {isNew ? 'Nueva encuesta' : 'Editar encuesta'}
        </h2>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Volver al listado
        </Button>
      </div>

      {SURVEY_BLOCKS.map((block) => (
        <section key={block.title} className="border-line rounded-2xl border bg-white p-4 md:p-8">
          <h3 className="text-[22px] leading-tight md:text-2xl">{block.title}</h3>
          {block.hint && (
            <p className="text-ink-soft mt-1.5 text-sm md:text-[15px]">{block.hint}</p>
          )}
          {block.link && (
            <a
              href={block.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-denim hover:text-ink mt-1.5 inline-block text-sm underline underline-offset-4"
            >
              {block.link.label}
            </a>
          )}
          <div className="mt-5 space-y-3">
            {block.questions
              .filter((question) => !question.dependsOn)
              .map((question) => (
                <div key={question.field} className="space-y-2">
                  <QuestionField
                    question={question}
                    value={values[question.field]}
                    suggestions={suggestions}
                    onChange={onChange}
                  />
                  {/* Follow-ups live inside their parent's block, indented and
                      only once it is answered "Sí", so the link is unmistakable. */}
                  {(DEPENDENTS[question.field] ?? []).map((followUpField) => {
                    if (values[question.field] !== true) return null;
                    const followUp = block.questions.find((q) => q.field === followUpField);
                    if (!followUp) return null;

                    return (
                      <div key={followUpField} className="border-warm ml-3 border-l-2 pl-4 md:ml-6">
                        <QuestionField
                          question={followUp}
                          value={values[followUpField]}
                          suggestions={suggestions}
                          onChange={onChange}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </section>
      ))}

      {/* Edge to edge on a phone, like the kit's mobile form bar */}
      <div className="border-line bg-paper sticky bottom-0 -mx-5 border-t px-5 py-4 md:mx-0 md:px-0">
        {error && (
          <div className={`${noticeClass} mb-3 text-[#b3261e]`}>
            <AlertCircle className="h-5 w-5 flex-none" strokeWidth={1.5} />
            {error}
          </div>
        )}
        {duplicateWarning && (
          <div className="border-warm bg-warm-soft text-ink mb-3 rounded-xl border px-4 py-3 text-sm">
            {duplicateWarning} Presione «Guardar de todas formas» si es otra persona.
          </div>
        )}
        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <Button
            size="lg"
            onClick={() => onSave(false)}
            disabled={saving}
            className="w-full md:w-auto md:px-8"
          >
            {saving ? 'Guardando…' : duplicateWarning ? 'Guardar de todas formas' : 'Guardar'}
          </Button>
          {isNew && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => onSave(true)}
              disabled={saving}
              className="grow px-4 md:grow-0 md:px-6"
            >
              Guardar y registrar otra
            </Button>
          )}
          <Button
            variant="ghost"
            size="lg"
            onClick={onCancel}
            disabled={saving}
            className="grow px-4 md:grow-0 md:px-6"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  suggestions,
  onChange,
}: {
  question: SurveyQuestion;
  value: string | boolean | null | undefined;
  suggestions: string[];
  onChange: (field: string, value: string | boolean | null) => void;
}) {
  if (question.type === 'check') {
    return (
      <label
        className={`text-ink flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-base transition-colors ${
          value === true ? choiceOn : choiceOff
        }`}
      >
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(question.field, e.target.checked)}
          className="accent-ink h-5 w-5 flex-none"
        />
        <span>{question.label}</span>
      </label>
    );
  }

  if (question.type === 'frequency') {
    return (
      <div className={questionRowClass}>
        <span className="text-ink text-base">{question.label}</span>
        <div className="grid flex-none grid-cols-3 gap-2 md:flex">
          {FREQUENCY_VALUES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={value === option}
              onClick={() => onChange(question.field, value === option ? null : option)}
              className={`${choiceButtonClass} ${value === option ? choiceOn : choiceOff}`}
            >
              {FREQUENCY_LABELS[option]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === 'yesno') {
    return (
      <div className={questionRowClass}>
        <span className="text-ink text-base">{question.label}</span>
        <div className="grid flex-none grid-cols-2 gap-2 md:flex">
          {[
            { label: 'Sí', answer: true },
            { label: 'No', answer: false },
          ].map(({ label, answer }) => (
            <button
              key={label}
              type="button"
              aria-pressed={value === answer}
              onClick={() => onChange(question.field, value === answer ? null : answer)}
              className={`${choiceButtonClass} ${value === answer ? choiceOn : choiceOff}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const textValue = typeof value === 'string' ? value : '';

  if (question.type === 'number') {
    return (
      <div>
        <label className={fieldLabelClass}>{question.label}</label>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_AGE}
          value={textValue}
          onChange={(e) => onChange(question.field, e.target.value)}
          className="w-28"
        />
      </div>
    );
  }

  return (
    <div>
      <label className={fieldLabelClass}>
        {question.label}
        {question.required && <span className="text-[#b3261e]"> *</span>}
      </label>
      {question.type === 'textarea' ? (
        <Textarea value={textValue} onChange={(e) => onChange(question.field, e.target.value)} />
      ) : (
        <>
          <Input
            value={textValue}
            onChange={(e) => onChange(question.field, e.target.value)}
            inputMode={question.inputMode}
            autoComplete={question.autoComplete}
            autoCapitalize={question.autoCapitalize}
            list={question.suggestFromEvent ? `${question.field}-suggestions` : undefined}
          />
          {/* One jornada is one barrio: offering what was already typed keeps
              "Jordán", "el jordan" and "Jordan etapa 5" from being three
              different places. */}
          {question.suggestFromEvent && suggestions.length > 0 && (
            <datalist id={`${question.field}-suggestions`}>
              {suggestions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={cardClass}>
      <p className="text-ink-soft text-[13px] md:text-sm">{label}</p>
      <p className="font-heading mt-1 text-[32px] font-bold leading-none md:text-[40px]">{value}</p>
      {hint && <p className="text-ink-soft mt-1 text-[13px]">{hint}</p>}
    </div>
  );
}

function ChartCard({
  title,
  block,
  total,
  color,
  stacked,
  exclude,
}: {
  title: string;
  block: BlockStat | undefined;
  total: number;
  color: string;
  stacked?: boolean;
  exclude?: string[];
}) {
  if (!block) return null;

  const data = block.questions
    .filter((q) => !exclude?.includes(q.field))
    .map((q) => ({
      name: q.chartLabel,
      yes: q.yes,
      sometimes: q.sometimes,
      no: q.no,
      unanswered: q.unanswered,
    }));

  return (
    <div className={cardClass}>
      <h3 className="mb-3 text-xl">{title}</h3>
      <div className="h-64 md:h-72">
        <SurveyBarChart data={data} total={total} color={color} stacked={stacked} />
      </div>
    </div>
  );
}

function CountsChartCard({
  title,
  data,
  total,
  color,
}: {
  title: string;
  data: { name: string; count: number }[];
  total: number;
  color: string;
}) {
  return (
    <div className={cardClass}>
      <h3 className="mb-3 text-xl">{title}</h3>
      <div className="h-64 md:h-72">
        <SurveyBarChart
          data={data.map((d) => ({ name: d.name, yes: d.count, no: 0, unanswered: 0 }))}
          total={total}
          color={color}
        />
      </div>
    </div>
  );
}

function SurveyDashboard({ summary, filtered }: { summary: SurveySummary; filtered: boolean }) {
  const block = (id: string) => summary.blocks.find((b) => b.id === id);
  const familyHistory = summary.blocks
    .flatMap((b) => b.questions)
    .find((q) => q.field === 'familyHistory');
  const pct = (count: number) =>
    summary.total === 0 ? '0%' : `${Math.round((count / summary.total) * 100)}%`;

  return (
    <section className="mb-6 space-y-4">
      {filtered && (
        <p className="text-ink-soft text-[13px]">
          Indicadores calculados sobre las {summary.total} encuestas del filtro actual.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Personas encuestadas" value={String(summary.total)} />
        <StatCard
          label="Con alguna enfermedad"
          value={String(summary.withAnyCondition)}
          hint={pct(summary.withAnyCondition)}
        />
        <StatCard
          label="Con antecedente familiar"
          value={String(familyHistory?.yes ?? 0)}
          hint={familyHistory ? `${familyHistory.pct}%` : undefined}
        />
        <StatCard
          label="Interesadas en un curso"
          value={String(summary.interestedInAnyCourse)}
          hint={pct(summary.interestedInAnyCourse)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Kit chart series: ink, denim and warm; the No / Sin responder bands
            of the stacked charts are grays. */}
        <ChartCard
          title="Enfermedades"
          block={block('conditions')}
          total={summary.total}
          color="#1c1b19"
          exclude={['familyHistory']}
        />
        <ChartCard
          title="Hábitos"
          block={block('habits')}
          total={summary.total}
          color="#2f557f"
          stacked
        />
        <ChartCard
          title="Interés en formación"
          block={block('interests')}
          total={summary.total}
          color="#ffa92d"
          stacked
        />
        <CountsChartCard
          title="Edad"
          data={summary.ageBands}
          total={summary.total}
          color="#1c1b19"
        />
      </div>
    </section>
  );
}

function RowActions({
  confirming,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  confirming: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  if (confirming) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
        <span className="text-ink-soft text-sm">¿Eliminar?</span>
        <Button variant="destructive" onClick={onConfirmDelete}>
          Sí, eliminar
        </Button>
        <Button variant="secondary" onClick={onCancelDelete}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
      <Button variant="secondary" onClick={onEdit}>
        Editar
      </Button>
      <Button variant="secondary" className="text-[#b3261e]" onClick={onAskDelete}>
        Eliminar
      </Button>
    </div>
  );
}

function PendingPanel({
  pending,
  pendingElsewhere,
  syncing,
  blockedMessage,
  onSync,
  onRetryAllowingDuplicate,
  onDiscard,
}: {
  pending: QueuedSurvey[];
  pendingElsewhere: number;
  syncing: boolean;
  blockedMessage: string;
  onSync: () => void;
  onRetryAllowingDuplicate: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
}) {
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null);

  return (
    <section className="border-warm bg-warm-soft text-ink mb-4 rounded-2xl border p-4 md:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">
            {pending.length} {pending.length === 1 ? 'encuesta' : 'encuestas'} en este dispositivo,
            sin enviar
          </p>
          <p className="text-ink-soft text-sm">
            No cierres la app hasta enviarlas. Se reintenta solo al recuperar señal.
            {pendingElsewhere > 0 &&
              ` Además hay ${pendingElsewhere} de otra jornada en este dispositivo.`}
          </p>
        </div>
        <Button variant="dark" onClick={onSync} disabled={syncing}>
          {syncing ? 'Enviando…' : 'Enviar ahora'}
        </Button>
      </div>

      {blockedMessage && <p className="mt-2 text-sm font-medium">{blockedMessage}</p>}

      <ul className="divide-warm/40 mt-3 divide-y text-sm">
        {pending.map((item) => (
          <li key={item.clientId} className="flex flex-col gap-1 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{item.name}</span>
              <span className="text-ink-soft text-xs">{formatDate(item.capturedAt)}</span>
            </div>
            {item.interviewerName && (
              <p className="text-ink-soft text-xs">Capturada por {item.interviewerName}</p>
            )}
            {item.lastError && (
              <p className="text-xs">
                {item.lastError}
                {item.attempts > 1 && ` · ${item.attempts} intentos`}
              </p>
            )}
            {/* A repeated phone is the operator's call, not the queue's */}
            {item.lastError?.includes('teléfono') && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetryAllowingDuplicate(item.clientId)}
                >
                  Enviar de todas formas
                </Button>
                {confirmDiscard === item.clientId ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDiscard(item.clientId)}
                    >
                      Sí, descartar
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmDiscard(null)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[#b3261e]"
                    onClick={() => setConfirmDiscard(item.clientId)}
                  >
                    Descartar
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DraftNotice({
  draft,
  onResume,
  onDiscard,
}: {
  draft: { values: SurveyPayload; savedAt: string };
  onResume: () => void;
  onDiscard: () => void;
}) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const name = String(draft.values.name ?? '').trim();

  return (
    <section className={`${cardClass} mb-4`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-ink font-semibold">Hay una encuesta a medio llenar</p>
          <p className="text-ink-soft text-sm">
            {name || 'Sin nombre'} · {timeAgo(draft.savedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onResume}>Continuar</Button>
          {confirmDiscard ? (
            <>
              <Button variant="destructive" onClick={onDiscard}>
                Sí, descartar
              </Button>
              <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setConfirmDiscard(true)}>
              Descartar
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function InterviewerPrompt({
  eventTitle,
  onSubmit,
}: {
  eventTitle: string;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState('');

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <header className="border-line border-b bg-white px-5 py-4 md:px-8">
        <h1 className="text-[28px] leading-tight md:text-[32px]">Encuesta de Salud</h1>
        <p className="text-ink-soft text-sm md:text-base">{eventTitle || 'Voluntariado'}</p>
      </header>

      <main className="mx-auto w-full max-w-sm px-5 py-10">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) onSubmit(name.trim());
          }}
          className="border-line rounded-2xl border bg-white p-6"
        >
          <h2 className="text-[28px] leading-tight">¿Quién está encuestando?</h2>
          <p className="text-ink-soft mt-2 text-sm">
            Su nombre queda en cada encuesta que registre. Se pide una sola vez en este dispositivo.
          </p>
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre y apellido"
            autoCapitalize="words"
            autoComplete="off"
            className="mt-5"
          />
          <Button type="submit" size="lg" disabled={!name.trim()} className="mt-4 w-full">
            Continuar
          </Button>
        </form>
      </main>
    </div>
  );
}

const headerButtonClass =
  'border-line text-ink flex h-11 flex-none items-center gap-2 rounded-xl border bg-white px-3 hover:bg-gray-100 md:px-4';
const noticeClass =
  'border-line flex items-start gap-2.5 rounded-xl border bg-white px-4 py-3 text-sm';
const cardClass = 'border-line rounded-2xl border bg-white p-4 md:p-5';
const fieldLabelClass = 'text-ink mb-2 block text-sm font-medium';

// Kit choice cards: the selected answer is ink-bordered on warm-soft
const questionRowClass =
  'border-line flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between md:gap-6 md:p-4';
const choiceButtonClass =
  'text-ink h-[52px] rounded-xl px-2 text-base transition-colors md:min-w-24 md:px-4';
const choiceOn = 'border-ink bg-warm-soft border-[1.5px] font-medium';
const choiceOff = 'border border-gray-300 bg-white hover:bg-gray-50';

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
      <div className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
        <ClipboardList className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <p className="text-[15px] font-semibold">{children}</p>
    </div>
  );
}
