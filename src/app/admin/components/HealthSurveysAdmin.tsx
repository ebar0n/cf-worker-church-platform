'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const outbox = useSurveyOutbox(eventId);
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

      return { ...current, values };
    });
  };

  const finishSave = (startAnother: boolean) => {
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
    const csv = surveysToCsv(visible)
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventTitle || 'evento'}_encuestas.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] font-sans">
      {/* Standalone header: this view is used by volunteers on shared iPads,
          so it deliberately carries no admin navigation. */}
      <header className="flex flex-col gap-2 bg-[#4b207f] px-4 py-5 text-white shadow-md md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <h1 className="font-['Advent_Pro'] text-2xl font-bold md:text-3xl">Encuesta de Salud</h1>
          {/* Tapping the jornada reloads its records and retries whatever is
              queued: the gesture a volunteer reaches for after regaining signal. */}
          <button
            type="button"
            onClick={() => {
              loadSurveys();
              outbox.sync();
            }}
            className="text-left text-sm text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white md:text-base"
            title="Actualizar"
          >
            {eventTitle || 'Voluntariado'}
          </button>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          {volunteerEmail && (
            <div className="hidden text-right text-sm text-white/80 md:block">
              <p>Registrando como</p>
              <p className="font-medium text-white">{volunteerEmail}</p>
            </div>
          )}
          {/* Where the exit lives in the rest of the admin — here going back to
              the picker IS the way out, and it never leads into the admin. */}
          <a
            href="/admin/surveys"
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20 md:px-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            <span className="hidden md:inline">Jornadas</span>
          </a>
          <AccessLogoutButton className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20 disabled:opacity-60 md:px-4" />
        </div>
      </header>

      {!outbox.online && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900 md:px-8">
          Sin conexión — las encuestas se guardan en el dispositivo y se envían al recuperar señal
        </div>
      )}

      <main className="mx-auto max-w-4xl px-3 py-6 md:px-6">
        {outbox.pending.length > 0 && (
          <PendingPanel
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
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {statusMessage}
          </div>
        )}

        {/* While the form is open the message lives next to Guardar: the top of
            a long form scrolls out of sight. */}
        {error && !editing && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {surveys.length} {surveys.length === 1 ? 'encuesta' : 'encuestas'} registradas
                </p>
                <p className="text-sm text-gray-500">Toque una fila para editarla.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={exportCsv}
                  disabled={visible.length === 0}
                  variant="outline"
                  className="h-12 border border-gray-300 bg-white px-5 text-base text-gray-700 hover:bg-gray-50"
                >
                  Descargar CSV
                </Button>
                <Button
                  onClick={startNew}
                  className="h-12 bg-[#4b207f] px-6 text-base text-white hover:bg-[#3b1965]"
                >
                  + Nueva encuesta
                </Button>
              </div>
            </div>

            <div role="tablist" className="mb-4 flex gap-2 border-b border-gray-200">
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
                      ? 'border-[#4b207f] text-[#4b207f]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
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
                <p className="py-8 text-center text-gray-500">
                  Aún no hay encuestas para calcular métricas.
                </p>
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
                  className="mb-4 h-12 bg-white text-base"
                />

                {loading ? (
                  <p className="py-8 text-center text-gray-500">Cargando…</p>
                ) : visible.length === 0 ? (
                  <p className="rounded-md border border-dashed border-gray-300 bg-white py-10 text-center text-gray-500">
                    {surveys.length === 0
                      ? 'Aún no hay encuestas registradas para este evento.'
                      : 'Ninguna encuesta coincide con la búsqueda.'}
                  </p>
                ) : (
                  <>
                    {/* Phones get cards: six columns do not fit, and a horizontally
                    scrolled table hides the actions. */}
                    <ul className="space-y-3 sm:hidden">
                      {pageRows.map((survey) => (
                        <li
                          key={survey.id}
                          className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                        >
                          <p className="font-medium text-gray-900">{survey.name}</p>
                          <p className="text-sm text-gray-700">{survey.phone}</p>
                          <p className="text-sm text-gray-500">
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

                    <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm sm:block">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
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
                                className="px-4 py-3 text-left font-semibold text-gray-700"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleSort(key)}
                                  className="flex items-center gap-1 hover:text-[#4b207f]"
                                >
                                  {label}
                                  <span className="text-xs text-gray-400">
                                    {sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                                  </span>
                                </button>
                              </th>
                            ))}
                            <th className="px-4 py-3 text-right font-semibold text-gray-700">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {pageRows.map((survey) => (
                            <tr key={survey.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">{survey.name}</td>
                              <td className="px-4 py-3 text-gray-700">{survey.phone || '—'}</td>
                              <td className="px-4 py-3 text-gray-700">
                                {survey.neighborhood || '—'}
                              </td>
                              {/* Stored in UTC and rendered in the viewer's zone;
                                  the tooltip keeps the raw instant auditable. */}
                              <td
                                title={`Capturada: ${surveyMoment(survey)} · Guardada en el servidor: ${survey.createdAt}`}
                                className="whitespace-nowrap px-4 py-3 text-gray-500"
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
                          className="h-11 border border-gray-300 bg-white px-5 text-gray-700 hover:bg-gray-50"
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-gray-600">
                          {pageStart + 1}–{pageStart + pageRows.length} de {visible.length}
                        </span>
                        <Button
                          variant="outline"
                          disabled={currentPage === pageCount}
                          onClick={() => setPage(currentPage + 1)}
                          className="h-11 border border-gray-300 bg-white px-5 text-gray-700 hover:bg-gray-50"
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          {isNew ? 'Nueva encuesta' : 'Editar encuesta'}
        </h2>
        <Button
          variant="outline"
          className="h-11 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          onClick={onCancel}
          disabled={saving}
        >
          Volver al listado
        </Button>
      </div>

      {SURVEY_BLOCKS.map((block) => (
        <section
          key={block.title}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6"
        >
          <h3 className="text-base font-semibold text-[#4b207f] md:text-lg">{block.title}</h3>
          {block.hint && <p className="mt-1 text-sm text-gray-500">{block.hint}</p>}
          {block.link && (
            <a
              href={block.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-[#4b207f] underline"
            >
              {block.link.label}
            </a>
          )}
          <div className="mt-3 space-y-3">
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
                      <div
                        key={followUpField}
                        className="ml-3 border-l-2 border-[#4b207f]/30 pl-4 md:ml-6"
                      >
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

      <div className="sticky bottom-0 border-t border-gray-200 bg-[#f7f6f3] py-4">
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {duplicateWarning && (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {duplicateWarning} Presione «Guardar de todas formas» si es otra persona.
          </div>
        )}
        <div className="flex flex-col gap-2 md:flex-row">
          <Button
            onClick={() => onSave(false)}
            disabled={saving}
            className="h-12 bg-[#4b207f] px-8 text-base text-white hover:bg-[#3b1965]"
          >
            {saving ? 'Guardando…' : duplicateWarning ? 'Guardar de todas formas' : 'Guardar'}
          </Button>
          {isNew && (
            <Button
              variant="outline"
              onClick={() => onSave(true)}
              disabled={saving}
              className="h-12 border border-gray-300 bg-white px-8 text-base text-gray-700 hover:bg-gray-50"
            >
              Guardar y registrar otra
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
            className="h-12 px-6 text-gray-600 hover:bg-gray-100"
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
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(question.field, e.target.checked)}
          className="h-5 w-5 accent-[#4b207f]"
        />
        <span className="text-sm text-gray-800 md:text-base">{question.label}</span>
      </label>
    );
  }

  if (question.type === 'frequency') {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-gray-200 px-3 py-2 md:flex-row md:items-center md:justify-between">
        <span className="text-sm text-gray-800 md:text-base">{question.label}</span>
        <div className="flex gap-2">
          {FREQUENCY_VALUES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={value === option}
              onClick={() => onChange(question.field, value === option ? null : option)}
              className={`h-11 min-w-20 rounded-md border px-3 text-base font-medium transition-colors ${
                value === option
                  ? 'border-[#4b207f] bg-[#4b207f] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
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
      <div className="flex flex-col gap-2 rounded-md border border-gray-200 px-3 py-2 md:flex-row md:items-center md:justify-between">
        <span className="text-sm text-gray-800 md:text-base">{question.label}</span>
        <div className="flex gap-2">
          {[
            { label: 'Sí', answer: true },
            { label: 'No', answer: false },
          ].map(({ label, answer }) => (
            <button
              key={label}
              type="button"
              aria-pressed={value === answer}
              onClick={() => onChange(question.field, value === answer ? null : answer)}
              className={`h-11 w-20 rounded-md border text-base font-medium transition-colors ${
                value === answer
                  ? 'border-[#4b207f] bg-[#4b207f] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
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
        <label className="mb-1 block text-sm text-gray-700 md:text-base">{question.label}</label>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_AGE}
          value={textValue}
          onChange={(e) => onChange(question.field, e.target.value)}
          className="h-12 w-28 bg-white text-base"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-gray-700 md:text-base">
        {question.label}
        {question.required && <span className="text-red-600"> *</span>}
      </label>
      {question.type === 'textarea' ? (
        <Textarea
          value={textValue}
          onChange={(e) => onChange(question.field, e.target.value)}
          className="min-h-20 bg-white text-base"
        />
      ) : (
        <>
          <Input
            value={textValue}
            onChange={(e) => onChange(question.field, e.target.value)}
            inputMode={question.inputMode}
            autoComplete={question.autoComplete}
            autoCapitalize={question.autoCapitalize}
            list={question.suggestFromEvent ? `${question.field}-suggestions` : undefined}
            className="h-12 bg-white text-base"
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
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:p-4">
      <p className="text-xs text-gray-500 md:text-sm">{label}</p>
      <p className="text-2xl font-bold text-[#4b207f] md:text-3xl">{value}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
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
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-800 md:text-base">{title}</h3>
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
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-800 md:text-base">{title}</h3>
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
        <p className="text-xs text-gray-500">
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
        {/* Institutional palette (globals.css): grapevine for conditions, tree
            frog for habits, campfire for interest — the brand purple is the
            chrome color, so a chart in it reads as part of the header. */}
        <ChartCard
          title="Enfermedades"
          block={block('conditions')}
          total={summary.total}
          color="#7f264a"
          exclude={['familyHistory']}
        />
        <ChartCard
          title="Hábitos"
          block={block('habits')}
          total={summary.total}
          color="#448d21"
          stacked
        />
        <ChartCard
          title="Interés en formación"
          block={block('interests')}
          total={summary.total}
          color="#e36520"
          stacked
        />
        <CountsChartCard
          title="Edad"
          data={summary.ageBands}
          total={summary.total}
          color="#2f557f"
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-xs text-gray-600">¿Eliminar?</span>
        <Button className="h-10 bg-red-600 text-white hover:bg-red-700" onClick={onConfirmDelete}>
          Sí, eliminar
        </Button>
        <Button
          variant="outline"
          className="h-10 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          onClick={onCancelDelete}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        className="h-10 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        onClick={onEdit}
      >
        Editar
      </Button>
      <Button
        variant="outline"
        className="h-10 border border-red-300 bg-white text-red-700 hover:bg-red-50"
        onClick={onAskDelete}
      >
        Eliminar
      </Button>
    </div>
  );
}

function PendingPanel({
  pending,
  syncing,
  blockedMessage,
  onSync,
  onRetryAllowingDuplicate,
  onDiscard,
}: {
  pending: QueuedSurvey[];
  syncing: boolean;
  blockedMessage: string;
  onSync: () => void;
  onRetryAllowingDuplicate: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
}) {
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null);

  return (
    <section className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 md:p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-amber-900">
            {pending.length} {pending.length === 1 ? 'encuesta' : 'encuestas'} en este dispositivo,
            sin enviar
          </p>
          <p className="text-sm text-amber-800">
            No cierres la app hasta enviarlas. Se reintenta solo al recuperar señal.
          </p>
        </div>
        <Button
          onClick={onSync}
          disabled={syncing}
          className="h-11 bg-amber-700 px-5 text-white hover:bg-amber-800"
        >
          {syncing ? 'Enviando…' : 'Enviar ahora'}
        </Button>
      </div>

      {blockedMessage && (
        <p className="mt-2 text-sm font-medium text-amber-900">{blockedMessage}</p>
      )}

      <ul className="mt-3 divide-y divide-amber-200 text-sm">
        {pending.map((item) => (
          <li key={item.clientId} className="flex flex-col gap-1 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-amber-900">{item.name}</span>
              <span className="text-xs text-amber-700">{formatDate(item.capturedAt)}</span>
            </div>
            {item.lastError && (
              <p className="text-xs text-amber-800">
                {item.lastError}
                {item.attempts > 1 && ` · ${item.attempts} intentos`}
              </p>
            )}
            {/* A repeated phone is the operator's call, not the queue's */}
            {item.lastError?.includes('teléfono') && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="h-9 border border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
                  onClick={() => onRetryAllowingDuplicate(item.clientId)}
                >
                  Enviar de todas formas
                </Button>
                {confirmDiscard === item.clientId ? (
                  <>
                    <Button
                      className="h-9 bg-red-600 text-white hover:bg-red-700"
                      onClick={() => onDiscard(item.clientId)}
                    >
                      Sí, descartar
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      onClick={() => setConfirmDiscard(null)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="h-9 border border-red-300 bg-white text-red-700 hover:bg-red-50"
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
