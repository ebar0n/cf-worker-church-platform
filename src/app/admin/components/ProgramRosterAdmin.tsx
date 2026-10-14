'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, ArrowLeft, ChevronDown, ChevronUp, FileDown, Users } from 'lucide-react';
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

function Badge({ classification }: { classification: Classification | null }) {
  if (!classification) return null;
  return (
    <span className="text-ink-soft inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
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
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
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

  // The packet route answers 422 naming the person/attachment to fix; a plain
  // download link would swallow that message, so fetch it and show it.
  const downloadFamilyPdf = async (family: Family) => {
    const fallback = 'No se pudo generar la carpeta familiar. Inténtalo de nuevo.';
    setDownloadingPdf(family.id);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/families/${family.id}/pdf`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        alert(body.error ?? fallback);
        return;
      }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(await res.blob());
      link.download = familyPdfFilename(family);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert(fallback);
    } finally {
      setDownloadingPdf(null);
    }
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
    <div className="bg-paper text-ink grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl p-4 text-sm md:grid-cols-3">
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
            className="text-denim hover:text-ink text-[13px] font-medium underline underline-offset-4"
          >
            Ver documento de identidad
          </a>
        )}
        {person.epsCertificateUrl && (
          <a
            href={person.epsCertificateUrl}
            target="_blank"
            rel="noreferrer"
            className="text-denim hover:text-ink text-[13px] font-medium underline underline-offset-4"
          >
            Ver certificado EPS
          </a>
        )}
        <label className="text-ink ml-auto flex min-h-11 cursor-pointer items-center gap-2.5 text-[13px] font-medium">
          <input
            type="checkbox"
            checked={Boolean(person.physicalFormReceivedAt)}
            onChange={(e) => togglePhysicalForm(person.documentID, e.target.checked)}
            className="accent-ink h-5 w-5"
          />
          Formato físico recibido
        </label>
      </div>
    </div>
  );

  // Compact identity row. Family details are opened at the family level (as a
  // group view), so this row does not expand on its own.
  const MemberSummary = ({ person, label }: { person: Person; label: string }) => (
    <div className="border-line flex flex-wrap items-center gap-3 border-t py-3">
      {person.photoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={person.photoUrl}
          alt={person.name}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <div className="text-ink-soft flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
          {person.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-ink break-words text-sm font-medium">
          {person.name}{' '}
          <span className="text-ink-soft font-normal">
            · {person.documentID}
            {label ? ` · ${label}` : ''}
          </span>
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge classification={person.classification} />
        </div>
      </div>
    </div>
  );

  // A member's full detail block, headed by their name + role, used inside the
  // family group detail view.
  const MemberDetail = ({ person, label }: { person: Person; label: string }) => (
    <div>
      <p className="text-ink mb-2 text-sm font-semibold">
        {person.name}
        {label ? <span className="text-ink-soft font-normal"> · {label}</span> : null}
      </p>
      <PersonDetails person={person} />
    </div>
  );

  // Standalone expandable row for unassigned children (not part of a family).
  const PersonRow = ({ person, label }: { person: Person; label: string }) => {
    const key = person.documentID;
    return (
      <div className="border-warm/40 border-t py-3">
        <div
          className="flex cursor-pointer flex-wrap items-center gap-3"
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
            <div className="text-ink-soft flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
              {person.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-ink break-words text-sm font-medium">
              {person.name}{' '}
              <span className="text-ink-soft font-normal">
                · {person.documentID}
                {label ? ` · ${label}` : ''}
              </span>
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge classification={person.classification} />
            </div>
          </div>
          {expanded === key ? (
            <ChevronUp className="text-ink-soft h-4 w-4" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="text-ink-soft h-4 w-4" strokeWidth={1.5} />
          )}
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <a
              href="/admin/programs"
              className="text-denim hover:text-ink mb-3 inline-flex items-center gap-1.5 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              Programas
            </a>
            <h1 className="text-[40px] leading-[1.04]">{roster?.program.title || 'Programa'}</h1>
            <p className="text-ink-soft mt-2">
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
          <Button onClick={exportCsv} disabled={!roster}>
            Exportar CSV
          </Button>
        </div>

        <Input
          placeholder="Buscar por niño, padre o documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6"
        />

        {loading && <p className="text-ink-soft">Cargando...</p>}
        {error && (
          <p className="border-line mb-4 flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm text-[#b3261e]">
            <AlertCircle className="h-4 w-4 flex-none" strokeWidth={1.5} />
            {error}
          </p>
        )}

        <div className="space-y-4">
          {filteredFamilies.map((family) => {
            const open = expanded === family.id;
            const pending = familyPendingItems(family);
            return (
              <div key={family.id} className="border-line rounded-2xl border bg-white p-5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="text-[22px] leading-tight">
                    Familia ·{' '}
                    {family.adults.map((a) => a.name.split(' ')[0]).join(' / ') || 'Sin nombre'}
                  </h2>
                  <button
                    onClick={() => setExpanded(open ? null : family.id)}
                    className="text-denim hover:text-ink flex shrink-0 items-center gap-1 text-sm font-medium"
                  >
                    {open ? 'Ocultar detalles' : 'Ver detalles'}
                    {open ? (
                      <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>

                <div className="my-3 flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => downloadFamilyPdf(family)}
                    disabled={downloadingPdf === family.id}
                  >
                    <FileDown className="h-4 w-4" strokeWidth={1.5} />
                    {downloadingPdf === family.id ? 'Generando PDF...' : 'Descargar PDF familiar'}
                  </Button>
                  <span className="text-ink-soft text-[13px]">
                    Portada, hojas de vida, anexos y autorizaciones para firma.
                  </span>
                </div>
                {pending.length > 0 && (
                  <details className="bg-warm-soft text-ink mb-3 rounded-xl px-4 py-3 text-sm">
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
                  <div className="border-line ml-4 border-l-2 pl-4">
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
                  <div className="border-line mt-3 space-y-4 border-t pt-4">
                    <p className="text-ink-soft text-[13px] font-semibold uppercase tracking-[.06em]">
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
            <div className="border-warm bg-warm-soft rounded-2xl border p-5">
              <h2 className="mb-2 text-[22px] leading-tight">
                Niños sin tutor inscrito en el programa
              </h2>
              {filteredUnassigned.map((child) => (
                <PersonRow key={child.documentID} person={child} label="" />
              ))}
            </div>
          )}

          {!loading && filteredFamilies.length === 0 && filteredUnassigned.length === 0 && (
            <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
              <div className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
                <Users className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <p className="text-[15px] font-semibold">
                {search
                  ? 'Sin resultados para la búsqueda.'
                  : 'Aún no hay inscritos en este programa.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
