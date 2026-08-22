'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  SURVEY_BLOCKS,
  emptySurveyValues,
  rowToFormValues,
  type SurveyPayload,
  type SurveyQuestion,
} from '@/lib/health-survey';

interface SurveyRow extends Record<string, unknown> {
  id: number;
  name: string;
  phone: string;
  neighborhood: string | null;
  capturedBy: string | null;
  createdAt: string;
}

interface Props {
  eventId: number;
}

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

export default function HealthSurveysAdmin({ eventId }: Props) {
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

  const startNew = () => {
    setDuplicateWarning('');
    setEditing({ id: null, values: emptySurveyValues() });
  };
  const startEdit = (survey: SurveyRow) => {
    setDuplicateWarning('');
    setEditing({ id: survey.id, values: rowToFormValues(survey) });
  };

  const setValue = (field: string, value: string | boolean | null) => {
    setEditing((current) =>
      current ? { ...current, values: { ...current.values, [field]: value } } : current
    );
  };

  const save = async (startAnother: boolean) => {
    if (!editing) return;

    // Two volunteers can survey the same person at one event. The phone is not
    // unique in the database (a household may share a line), so warn once and
    // let the second Guardar go through.
    const phone = String(editing.values.phone ?? '').trim();
    if (editing.id === null && phone && !duplicateWarning) {
      const twin = surveys.find((s) => (s.phone || '').trim() === phone);
      if (twin) {
        setDuplicateWarning(`Ya hay una encuesta con ese teléfono en este evento (${twin.name}).`);
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      const isNew = editing.id === null;
      const res = await fetch(
        isNew ? `/api/admin/surveys/${eventId}` : `/api/admin/surveys/${eventId}/${editing.id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editing.values),
        }
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'No se pudo guardar la encuesta');
      }

      await loadSurveys();
      setDuplicateWarning('');
      setEditing(startAnother ? { id: null, values: emptySurveyValues() } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando la encuesta');
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

  const term = search.trim().toLowerCase();
  const visible = term
    ? surveys.filter((s) =>
        [s.name, s.phone, s.neighborhood]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))
      )
    : surveys;

  return (
    <div className="min-h-screen bg-[#f7f6f3] font-sans">
      {/* Standalone header: this view is used by volunteers on shared iPads,
          so it deliberately carries no admin navigation. */}
      <header className="bg-[#4b207f] px-4 py-5 text-white shadow-md md:px-8">
        <h1 className="font-['Advent_Pro'] text-2xl font-bold md:text-3xl">Encuesta de Salud</h1>
        <p className="text-sm text-white/80 md:text-base">{eventTitle || 'Voluntariado'}</p>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-6 md:px-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {editing ? (
          <SurveyForm
            values={editing.values}
            isNew={editing.id === null}
            saving={saving}
            duplicateWarning={duplicateWarning}
            onChange={setValue}
            onCancel={() => {
              setDuplicateWarning('');
              setEditing(null);
            }}
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
              <Button onClick={startNew} className="h-12 bg-[#4b207f] px-6 text-base">
                + Nueva encuesta
              </Button>
            </div>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Teléfono</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Barrio</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Registrada
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Por</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visible.map((survey) => (
                      <tr key={survey.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{survey.name}</td>
                        <td className="px-4 py-3 text-gray-700">{survey.phone || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{survey.neighborhood || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                          {formatDate(survey.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{survey.capturedBy || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {confirmDeleteId === survey.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-gray-600">¿Eliminar?</span>
                              <Button
                                variant="destructive"
                                className="h-9"
                                onClick={() => remove(survey.id)}
                              >
                                Sí, eliminar
                              </Button>
                              <Button
                                variant="outline"
                                className="h-9"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                className="h-9"
                                onClick={() => startEdit(survey)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                className="h-9 border-red-300 text-red-700 hover:bg-red-50"
                                onClick={() => setConfirmDeleteId(survey.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
  duplicateWarning,
  onChange,
  onCancel,
  onSave,
}: {
  values: SurveyPayload;
  isNew: boolean;
  saving: boolean;
  duplicateWarning: string;
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
        <Button variant="outline" className="h-11" onClick={onCancel} disabled={saving}>
          Volver al listado
        </Button>
      </div>

      {duplicateWarning && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {duplicateWarning} Presione «Guardar de todas formas» si es otra persona.
        </div>
      )}

      {SURVEY_BLOCKS.map((block) => (
        <section
          key={block.title}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6"
        >
          <h3 className="text-base font-semibold text-[#4b207f] md:text-lg">{block.title}</h3>
          {block.hint && <p className="mb-3 text-sm text-gray-500">{block.hint}</p>}
          <div className="mt-3 space-y-3">
            {block.questions.map((question) => (
              <QuestionField
                key={question.field}
                question={question}
                value={values[question.field]}
                onChange={onChange}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-gray-200 bg-[#f7f6f3] py-4 md:flex-row">
        <Button
          onClick={() => onSave(false)}
          disabled={saving}
          className="h-12 bg-[#4b207f] px-8 text-base"
        >
          {saving ? 'Guardando…' : duplicateWarning ? 'Guardar de todas formas' : 'Guardar'}
        </Button>
        {isNew && (
          <Button
            variant="outline"
            onClick={() => onSave(true)}
            disabled={saving}
            className="h-12 px-8 text-base"
          >
            Guardar y registrar otra
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel} disabled={saving} className="h-12 px-6">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string | boolean | null | undefined;
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
        <Input
          value={textValue}
          onChange={(e) => onChange(question.field, e.target.value)}
          className="h-12 bg-white text-base"
        />
      )}
    </div>
  );
}
