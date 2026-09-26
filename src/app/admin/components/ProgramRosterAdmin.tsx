'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { familyPendingItems, familyPdfFilename } from '@/lib/program-family';

interface Classification {
  age: number;
  category: string;
  className: string | null;
}

interface Person {
  name: string;
  documentID: string;
  birthDate: string | null;
  phone?: string | null;
  gender?: string | null;
  relationship?: string;
  bloodType: string | null;
  eps: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  photoUrl: string | null;
  idDocumentUrl: string | null;
  epsCertificateUrl: string | null;
  physicalFormReceivedAt: string | null;
  classification: Classification | null;
}

interface Adult extends Person {
  memberId: number;
  dataTreatmentAcceptedAt?: string | null;
  participationConfirmedAt?: string | null;
}

interface Family {
  id: string;
  adults: Adult[];
  children: Person[];
}

interface Roster {
  program: { id: number; title: string };
  families: Family[];
  unassignedChildren: Person[];
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  father: 'Padre',
  mother: 'Madre',
  tutor: 'Tutor',
};

const relationshipLabel = (relationship?: string) =>
  RELATIONSHIP_LABELS[relationship || ''] || relationship || 'Responsable';

const CATEGORY_COLORS: Record<string, string> = {
  Principiante: 'bg-gray-100 text-gray-700',
  Aventurero: 'bg-amber-100 text-amber-800',
  Conquistador: 'bg-green-100 text-green-800',
  'Guía Mayor': 'bg-purple-100 text-purple-800',
};

function Badge({ classification }: { classification: Classification | null }) {
  if (!classification) return null;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[classification.category] || 'bg-gray-100'}`}
    >
      {classification.category}
      {classification.className ? ` · ${classification.className}` : ''} ({classification.age})
    </span>
  );
}

export default function ProgramRosterAdmin({
  programId,
  adminEmail,
}: {
  programId: number;
  adminEmail: string;
}) {
  const [roster, setRoster] = useState<Roster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/programs/${programId}/roster`);
      if (!res.ok) throw new Error('No se pudo cargar el programa');
      setRoster((await res.json()) as Roster);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePhysicalForm = async (documentID: string, received: boolean) => {
    const res = await fetch(`/api/admin/programs/${programId}/physical-form`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentID, received }),
    });
    if (res.ok) await load();
  };

  const matches = (person: Person) =>
    person.name.toLowerCase().includes(search.toLowerCase()) || person.documentID.includes(search);

  // Family search: a family shows if any of its adults or children match
  const filteredFamilies = (roster?.families || []).filter(
    (fam) => !search || fam.adults.some(matches) || fam.children.some(matches)
  );
  const filteredUnassigned = (roster?.unassignedChildren || []).filter(
    (child) => !search || matches(child)
  );

  const exportCsv = () => {
    if (!roster) return;
    const header = [
      'Tipo',
      'Nombre',
      'Documento',
      'Nacimiento',
      'Clasificación',
      'Clase',
      'Parentesco',
      'Tutor',
      'Sangre',
      'EPS',
      'Alergias',
      'Condiciones',
      'Medicamentos',
      'Contacto emergencia',
      'Tel. emergencia',
      'Foto',
      'Documento ID',
      'Certificado EPS',
      'Formato físico',
    ];
    const rows: string[][] = [];
    const personRow = (kind: string, p: Person, roleLabel: string, tutorName: string) => [
      kind,
      p.name,
      p.documentID,
      p.birthDate?.split('T')[0] || '',
      p.classification?.category || '',
      p.classification?.className || '',
      roleLabel,
      tutorName,
      p.bloodType || '',
      p.eps || '',
      p.allergies || '',
      p.conditions || '',
      p.medications || '',
      p.emergencyContactName || '',
      p.emergencyContactPhone || '',
      p.photoUrl ? 'Sí' : 'No',
      p.idDocumentUrl ? 'Sí' : 'No',
      p.epsCertificateUrl ? 'Sí' : 'No',
      p.physicalFormReceivedAt ? 'Recibido' : 'Pendiente',
    ];
    for (const family of roster.families) {
      const familyName = family.adults.map((a) => a.name).join(' / ');
      for (const adult of family.adults) {
        rows.push(personRow('Adulto', adult, relationshipLabel(adult.relationship), familyName));
      }
      for (const child of family.children) {
        rows.push(personRow('Niño', child, 'Hijo/a', familyName));
      }
    }
    for (const child of roster.unassignedChildren) {
      rows.push(personRow('Niño', child, '', 'Sin tutor inscrito'));
    }

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${roster.program.title}_inscritos.csv`;
    link.click();
  };

  const PersonDetails = ({ person }: { person: Person }) => (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-gray-50 p-3 text-sm md:grid-cols-3">
      <p>
        <span className="font-medium">Sangre:</span> {person.bloodType || '—'}
      </p>
      <p>
        <span className="font-medium">EPS:</span> {person.eps || '—'}
      </p>
      <p>
        <span className="font-medium">Alergias:</span> {person.allergies || '—'}
      </p>
      <p>
        <span className="font-medium">Condiciones:</span> {person.conditions || '—'}
      </p>
      <p>
        <span className="font-medium">Medicamentos:</span> {person.medications || '—'}
      </p>
      <p>
        <span className="font-medium">Emergencia:</span>{' '}
        {person.emergencyContactName
          ? `${person.emergencyContactName} (${person.emergencyContactPhone || ''})`
          : '—'}
      </p>
      <div className="col-span-2 mt-2 flex flex-wrap items-center gap-2 md:col-span-3">
        {person.idDocumentUrl && (
          <a
            href={person.idDocumentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#4b207f] underline"
          >
            Ver documento de identidad
          </a>
        )}
        {person.epsCertificateUrl && (
          <a
            href={person.epsCertificateUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#4b207f] underline"
          >
            Ver certificado EPS
          </a>
        )}
        <label className="ml-auto flex items-center gap-1 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(person.physicalFormReceivedAt)}
            onChange={(e) => togglePhysicalForm(person.documentID, e.target.checked)}
          />
          Formato físico recibido
        </label>
      </div>
    </div>
  );

  // Compact identity row. Family details are opened at the family level (as a
  // group view), so this row does not expand on its own.
  const MemberSummary = ({ person, label }: { person: Person; label: string }) => (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 py-2">
      {person.photoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={person.photoUrl}
          alt={person.name}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
          {person.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">
          {person.name}{' '}
          <span className="font-normal text-gray-500">
            · {person.documentID}
            {label ? ` · ${label}` : ''}
          </span>
        </p>
        <div className="mt-0.5 flex flex-wrap gap-1">
          <Badge classification={person.classification} />
        </div>
      </div>
    </div>
  );

  // A member's full detail block, headed by their name + role, used inside the
  // family group detail view.
  const MemberDetail = ({ person, label }: { person: Person; label: string }) => (
    <div>
      <p className="mb-1 text-sm font-semibold text-gray-700">
        {person.name}
        {label ? <span className="font-normal text-gray-500"> · {label}</span> : null}
      </p>
      <PersonDetails person={person} />
    </div>
  );

  // Standalone expandable row for unassigned children (not part of a family).
  const PersonRow = ({ person, label }: { person: Person; label: string }) => {
    const key = person.documentID;
    return (
      <div className="border-t border-gray-100 py-2">
        <div
          className="flex cursor-pointer flex-wrap items-center gap-2"
          onClick={() => setExpanded(expanded === key ? null : key)}
        >
          {person.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={person.photoUrl}
              alt={person.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
              {person.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">
              {person.name}{' '}
              <span className="font-normal text-gray-500">
                · {person.documentID}
                {label ? ` · ${label}` : ''}
              </span>
            </p>
            <div className="mt-0.5 flex flex-wrap gap-1">
              <Badge classification={person.classification} />
            </div>
          </div>
          <span className="text-xs text-gray-400">{expanded === key ? '▲' : '▼'}</span>
        </div>
        {expanded === key && (
          <div className="mt-2">
            <PersonDetails person={person} />
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <a href="/admin/programs" className="text-sm text-[#4b207f] underline">
              ← Programas
            </a>
            <h1 className="text-2xl font-bold text-gray-800">
              {roster?.program.title || 'Programa'}
            </h1>
            <p className="text-sm text-gray-600">
              {roster
                ? `${roster.families.length} familias · ${roster.families.reduce(
                    (n, f) => n + f.adults.length,
                    0
                  )} adultos · ${
                    roster.families.reduce((n, f) => n + f.children.length, 0) +
                    roster.unassignedChildren.length
                  } niños`
                : ''}
            </p>
          </div>
          <Button onClick={exportCsv} disabled={!roster} className="bg-[#4b207f] text-white">
            Exportar CSV
          </Button>
        </div>

        <Input
          placeholder="Buscar por niño, padre o documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6"
        />

        {loading && <p className="text-gray-600">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-4">
          {filteredFamilies.map((family) => {
            const open = expanded === family.id;
            const pending = familyPendingItems(family);
            return (
              <div key={family.id} className="rounded-xl bg-white p-4 shadow">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Familia ·{' '}
                    {family.adults.map((a) => a.name.split(' ')[0]).join(' / ') || 'Sin nombre'}
                  </h2>
                  <button
                    onClick={() => setExpanded(open ? null : family.id)}
                    className="shrink-0 text-xs font-semibold text-[#4b207f]"
                  >
                    {open ? 'Ocultar detalles ▲' : 'Ver detalles ▼'}
                  </button>
                </div>

                <div className="my-3 flex flex-wrap items-center gap-3">
                  <Button asChild className="bg-[#4b207f] text-white">
                    <a
                      href={`/api/admin/programs/${programId}/families/${family.id}/pdf`}
                      download={familyPdfFilename(family)}
                    >
                      Descargar PDF familiar
                    </a>
                  </Button>
                  <span className="text-xs text-gray-600">
                    Portada, hojas de vida, anexos y autorizaciones para firma.
                  </span>
                </div>
                {pending.length > 0 && (
                  <details className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    <summary className="cursor-pointer font-medium">
                      Información pendiente ({pending.length})
                    </summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {pending.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {family.adults.map((adult) => (
                  <MemberSummary
                    key={adult.memberId}
                    person={adult}
                    label={`${relationshipLabel(adult.relationship)} · ${adult.phone || ''}`}
                  />
                ))}
                {family.children.length > 0 && (
                  <div className="ml-6 border-l-2 border-gray-100 pl-4">
                    {family.children.map((child) => (
                      <MemberSummary
                        key={`${family.id}-${child.documentID}`}
                        person={child}
                        label="Hijo/a"
                      />
                    ))}
                  </div>
                )}

                {open && (
                  <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Detalle del grupo familiar
                    </p>
                    {family.adults.map((adult) => (
                      <MemberDetail
                        key={`d-${adult.memberId}`}
                        person={adult}
                        label={relationshipLabel(adult.relationship)}
                      />
                    ))}
                    {family.children.map((child) => (
                      <MemberDetail
                        key={`d-${family.id}-${child.documentID}`}
                        person={child}
                        label="Hijo/a"
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredUnassigned.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h2 className="mb-2 text-sm font-semibold text-amber-800">
                Niños sin tutor inscrito en el programa
              </h2>
              {filteredUnassigned.map((child) => (
                <PersonRow key={child.documentID} person={child} label="" />
              ))}
            </div>
          )}

          {!loading && filteredFamilies.length === 0 && filteredUnassigned.length === 0 && (
            <p className="py-8 text-center text-gray-500">
              {search
                ? 'Sin resultados para la búsqueda.'
                : 'Aún no hay inscritos en este programa.'}
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
