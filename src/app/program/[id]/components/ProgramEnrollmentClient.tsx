'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { classify } from '@/lib/age-classification';
import PdfFilePreview from '@/app/components/PdfFilePreview';
import { printableImage } from '@/lib/printable-image';

interface Props {
  programId: number;
  programTitle: string;
  programContent: string | null;
  programColor: string;
  departmentName: string;
  departmentImage: string;
}

interface HealthValues {
  bloodType: string;
  eps: string;
  allergies: string;
  conditions: string;
  medications: string;
}

interface EmergencyValues {
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

const EMPTY_HEALTH: HealthValues = {
  bloodType: '',
  eps: '',
  allergies: '',
  conditions: '',
  medications: '',
};

const EMPTY_EMERGENCY: EmergencyValues = {
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
};

interface PersonRecord extends Partial<HealthValues> {
  name: string;
  documentID: string;
  birthDate: string | null;
  phone?: string;
  email?: string | null;
  gender?: string | null;
  relationship?: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  photoUrl?: string | null;
  idDocumentUrl?: string | null;
  epsCertificateUrl?: string | null;
  physicalFormReceivedAt?: string | null;
  dataTreatmentAcceptedAt?: string | null;
  participationConfirmedAt?: string | null;
  classification?: { age: number; category: string; className: string | null } | null;
}

interface MemberPrefill extends Partial<HealthValues> {
  name: string;
  phone: string;
  birthDate: string | null;
  email: string | null;
  gender?: string | null;
}

// Optional health fields are never left blank: an empty answer is stored as
// "n/a" (no aplica) so every record reads as intentionally complete.
const OPTIONAL_HEALTH: (keyof HealthValues)[] = ['allergies', 'conditions', 'medications'];

const appendHealth = (form: FormData, health: HealthValues) => {
  for (const key of Object.keys(health) as (keyof HealthValues)[]) {
    const value = health[key]?.trim();
    if (value) {
      form.append(key, value);
    } else if (OPTIONAL_HEALTH.includes(key)) {
      form.append(key, 'n/a');
    }
  }
};

// A person is "completamente diligenciado" when identity, required health and
// photo, identity document and EPS certificate are present. Tutors don't need a gender (relationship is set
// by the checkbox). Used to tint the card a subtle green.
const isPersonComplete = (p: PersonRecord): boolean =>
  Boolean(
    p.birthDate &&
      (p.gender || p.relationship === 'tutor') &&
      p.bloodType &&
      p.eps &&
      p.photoUrl &&
      p.idDocumentUrl &&
      p.epsCertificateUrl
  );

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONSHIPS = [
  { value: 'father', label: 'Padre' },
  { value: 'mother', label: 'Madre' },
  { value: 'tutor', label: 'Tutor' },
];

// The family relationship is derived: a parent's gender decides padre/madre,
// and a checkbox marks the tutor/acudiente case.
const relationshipFrom = (gender: string, isTutor: boolean): string =>
  isTutor ? 'tutor' : gender === 'F' ? 'mother' : 'father';

const relationshipLabel = (relationship?: string): string =>
  RELATIONSHIPS.find((r) => r.value === relationship)?.label || 'Responsable';

const safeCategory = (birthDate: string | null): string => {
  if (!birthDate) return 'Niño';
  try {
    return classify(birthDate).category;
  } catch {
    return 'Niño';
  }
};

// Buttons and interactive accents use the church brand color, not the
// department color (which can be jarring, e.g. red for Aventureros).
const FORM_COLOR = '#4b207f';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#4b207f] focus:outline-none focus:ring-1 focus:ring-[#4b207f]';
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-gray-700';

const CATEGORY_COLORS: Record<string, string> = {
  Principiante: 'bg-gray-100 text-gray-700',
  Aventurero: 'bg-amber-100 text-amber-800',
  Conquistador: 'bg-green-100 text-green-800',
  'Guía Mayor': 'bg-purple-100 text-purple-800',
};

function ClassificationBadge({ birthDate }: { birthDate: string | null }) {
  if (!birthDate) return null;
  let result;
  try {
    result = classify(birthDate);
  } catch {
    return null;
  }
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[result.category] || 'bg-gray-100'}`}
    >
      {result.category}
      {result.className ? ` · ${result.className}` : ''} ({result.age} años)
    </span>
  );
}

// Live camera capture via getUserMedia — works on desktop (webcam) and mobile
// (rear camera). Falls back to a message if the camera is unavailable.
function CameraModal({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Este navegador no permite usar la cámara. Usa “Subir archivo”.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      })
      .catch(() => setCameraError('No se pudo acceder a la cámara. Usa “Subir archivo”.'));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(new File([blob], `foto-${blob.size}.jpg`, { type: 'image/jpeg' }));
        }
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        {cameraError ? (
          <p className="py-8 text-center text-sm text-gray-700">{cameraError}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full rounded-lg bg-black object-cover"
          />
        )}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700"
          >
            Cerrar
          </button>
          {!cameraError && (
            <button
              type="button"
              onClick={capture}
              className="flex-1 rounded-lg bg-[#4b207f] py-2 text-sm font-semibold text-white"
            >
              📸 Capturar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Photo/document field: capture live from the camera or upload a file.
// `viewUrl` (when editing) points to the owner-scoped file route so the
// already-uploaded file can be viewed/previewed.
export function FileCapture({
  label,
  description,
  accept,
  file,
  existingUrl,
  viewUrl,
  onChange,
  onProcessingChange,
}: {
  label: string;
  description?: string;
  accept: string;
  file: File | null;
  existingUrl?: string | null;
  viewUrl?: string | null;
  onChange: (file: File | null) => void;
  onProcessingChange?: (processing: boolean) => void;
}) {
  const fileId = React.useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [preparingFile, setPreparingFile] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const status = file
    ? file.name
    : existingUrl
      ? 'Archivo cargado ✓ — reemplazar'
      : 'Ningún archivo seleccionado';

  const source = file ? preview : viewUrl;
  const isPdf = file ? file.type === 'application/pdf' : /\.pdf(?:\?|$)/i.test(existingUrl || '');
  const isImage = file
    ? /^image\/(jpeg|png|webp|gif)$/.test(file.type)
    : /\.(jpe?g|png|webp|gif)(?:\?|$)/i.test(existingUrl || '');

  const selectFile = async (selected: File | null) => {
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024 || !accept.split(',').includes(selected.type)) {
      setFileError('Selecciona un archivo del tipo indicado de máximo 10 MB.');
      return;
    }
    setFileError(null);
    if (
      !selected.type.startsWith('image/') ||
      ['image/jpeg', 'image/png'].includes(selected.type)
    ) {
      onChange(selected);
      return;
    }
    setPreparingFile(true);
    onProcessingChange?.(true);
    try {
      onChange(await printableImage(selected));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'No se pudo preparar la imagen');
    } finally {
      setPreparingFile(false);
      onProcessingChange?.(false);
    }
  };

  return (
    <div>
      <label htmlFor={fileId} className={LABEL_CLASS}>
        {label}
      </label>
      {description && (
        <p id={`${fileId}-help`} className="mb-2 text-sm text-gray-600">
          {description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-3">
        {source && isImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={source}
            alt={`Vista previa: ${label}`}
            className="h-16 w-16 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-200 text-gray-400">
            {file || existingUrl ? '📄' : '＋'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-gray-600">{status}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-[#4b207f] shadow-sm ring-1 ring-gray-200"
            >
              📷 Tomar foto
            </button>
            <label className="cursor-pointer rounded-md bg-white px-3 py-1 text-xs font-semibold text-[#4b207f] shadow-sm ring-1 ring-gray-200">
              📎 Subir archivo
              <input
                id={fileId}
                aria-label={label}
                aria-describedby={description ? `${fileId}-help` : undefined}
                type="file"
                disabled={preparingFile}
                accept={accept}
                className="hidden"
                onChange={(e) => {
                  selectFile(e.target.files?.[0] || null);
                  e.target.value = '';
                }}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setFileError(null);
                }}
                className="rounded-md px-2 py-1 text-xs font-semibold text-red-600"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>
      {preparingFile && (
        <p role="status" className="mt-2 text-sm text-gray-600">
          Preparando imagen para impresión...
        </p>
      )}
      {fileError && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {fileError}
        </p>
      )}
      {source && (isImage || isPdf) && (
        <details
          key={source}
          className="mt-2 rounded-lg border border-gray-200 p-3"
          onToggle={(event) => setShowPdf(event.currentTarget.open)}
        >
          <summary className="cursor-pointer text-sm font-semibold text-[#4b207f]">
            Vista previa de {label.toLowerCase()}
          </summary>
          {isPdf ? (
            showPdf && <PdfFilePreview key={source} source={source} label={label} />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={source}
              alt={`Documento completo: ${label}`}
              className="mt-3 max-h-96 w-full object-contain"
            />
          )}
        </details>
      )}
      {source && !isImage && !isPdf && (
        <p className="mt-2 text-xs text-gray-600">
          No se puede mostrar la vista previa de este formato. Sube una copia en JPG, PNG o PDF.
        </p>
      )}
      {cameraOpen && (
        <CameraModal
          onCapture={(f) => {
            selectFile(f);
            setCameraOpen(false);
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}

function HealthFields({
  values,
  onChange,
  children,
}: {
  values: HealthValues;
  onChange: (values: HealthValues) => void;
  children: React.ReactNode;
}) {
  const epsSuggestionsId = React.useId();
  const set = (key: keyof HealthValues) => (e: React.ChangeEvent<any>) =>
    onChange({ ...values, [key]: e.target.value });

  // Optional fields autocomplete to "n/a" (no aplica) when left blank, so the
  // record reads as intentionally complete rather than forgotten.
  const fillNa = (key: keyof HealthValues) => () => {
    if (!values[key]?.trim()) onChange({ ...values, [key]: 'n/a' });
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="enrollment-field-1" className={LABEL_CLASS}>
          Tipo de sangre *
        </label>
        <select
          id="enrollment-field-1"
          value={values.bloodType}
          onChange={set('bloodType')}
          className={INPUT_CLASS}
          required
        >
          <option value="">Selecciona...</option>
          {BLOOD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="enrollment-field-3" className={LABEL_CLASS}>
          Alergias
        </label>
        <input
          id="enrollment-field-3"
          value={values.allergies}
          onChange={set('allergies')}
          onBlur={fillNa('allergies')}
          className={INPUT_CLASS}
          placeholder="n/a"
        />
      </div>
      <div>
        <label htmlFor="enrollment-field-4" className={LABEL_CLASS}>
          Enfermedades o condiciones
        </label>
        <input
          id="enrollment-field-4"
          value={values.conditions}
          onChange={set('conditions')}
          onBlur={fillNa('conditions')}
          className={INPUT_CLASS}
          placeholder="n/a"
        />
      </div>
      <div>
        <label htmlFor="enrollment-field-5" className={LABEL_CLASS}>
          Medicamentos (si utiliza)
        </label>
        <input
          id="enrollment-field-5"
          value={values.medications}
          onChange={set('medications')}
          onBlur={fillNa('medications')}
          className={INPUT_CLASS}
          placeholder="n/a"
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="enrollment-field-2" className={LABEL_CLASS}>
          EPS *
        </label>
        <input
          id="enrollment-field-2"
          list={epsSuggestionsId}
          aria-describedby={`${epsSuggestionsId}-help`}
          value={values.eps}
          onChange={set('eps')}
          className={INPUT_CLASS}
          placeholder="Escribe el nombre de tu EPS"
          autoComplete="off"
          required
        />
        <datalist id={epsSuggestionsId}>
          {['Compensar', 'Nueva EPS', 'Salud Total', 'Sura', 'Sanitas'].map((eps) => (
            <option key={eps} value={eps} />
          ))}
        </datalist>
        <p id={`${epsSuggestionsId}-help`} className="mt-1 text-xs text-gray-500">
          Selecciona una sugerencia o escribe el nombre de otra EPS o régimen especial.
        </p>
      </div>
      <div className="min-w-0 sm:col-span-2">{children}</div>
    </div>
  );
}

function EmergencyFields({
  values,
  onChange,
}: {
  values: EmergencyValues;
  onChange: (values: EmergencyValues) => void;
}) {
  const set = (key: keyof EmergencyValues) => (e: React.ChangeEvent<any>) =>
    onChange({ ...values, [key]: e.target.value });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="enrollment-field-6" className={LABEL_CLASS}>
          Nombre del contacto *
        </label>
        <input
          id="enrollment-field-6"
          value={values.emergencyContactName}
          onChange={set('emergencyContactName')}
          className={INPUT_CLASS}
          placeholder="Nombre completo"
          required
        />
      </div>
      <div>
        <label htmlFor="enrollment-field-7" className={LABEL_CLASS}>
          Teléfono *
        </label>
        <input
          id="enrollment-field-7"
          value={values.emergencyContactPhone}
          onChange={set('emergencyContactPhone')}
          className={INPUT_CLASS}
          required
        />
      </div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function pickHealth(source: Partial<HealthValues>): HealthValues {
  return {
    ...EMPTY_HEALTH,
    ...Object.fromEntries(
      Object.entries(source).filter(
        ([key, value]) => key in EMPTY_HEALTH && typeof value === 'string' && value
      )
    ),
  };
}

export default function ProgramEnrollmentClient({
  programId,
  programTitle,
  programContent,
  programColor,
  departmentName,
  departmentImage,
}: Props) {
  const [step, setStep] = useState<'identify' | 'adult' | 'dashboard'>('identify');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(0);
  const onFileProcessing = useCallback((processing: boolean) => {
    setProcessingFiles((count) => Math.max(0, count + (processing ? 1 : -1)));
  }, []);
  const [dirty, setDirty] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [pendingClose, setPendingClose] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const closeEditor = (close: () => void) => {
    if (busy || processingFiles > 0) return;
    if (dirty) {
      setPendingClose(() => close);
      return;
    }
    setDirty(false);
    close();
  };

  const turnstileRef = useRef<HTMLDivElement>(null);
  const [siteKey, setSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const widgetRendered = useRef(false);

  const [documentID, setDocumentID] = useState('');

  // Adult (self) form
  const [adultForm, setAdultForm] = useState({
    name: '',
    phone: '',
    birthDate: '',
    email: '',
    gender: '',
    isTutor: false,
  });
  const [emergency, setEmergency] = useState<EmergencyValues>(EMPTY_EMERGENCY);
  // Consent gate on the dashboard: the primary responsible re-affirms before
  // the printable forms are revealed.
  const [finalizeAccept, setFinalizeAccept] = useState(false);
  const [finalizeConfirm, setFinalizeConfirm] = useState(false);

  const [adult, setAdult] = useState<PersonRecord | null>(null);
  const [adults, setAdults] = useState<(PersonRecord & { isSelf?: boolean })[]>([]);
  const [children, setChildren] = useState<PersonRecord[]>([]);

  const [childModalOpen, setChildModalOpen] = useState(false);
  const [childEditing, setChildEditing] = useState(false);
  const [childExisting, setChildExisting] = useState<PersonRecord | null>(null);
  const [adultModalOpen, setAdultModalOpen] = useState(false);
  const [coAdultEditing, setCoAdultEditing] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const emptyChild = {
    documentID: '',
    name: '',
    gender: '',
    birthDate: '',
    relationship: 'father',
  };
  const [childForm, setChildForm] = useState(emptyChild);
  const [childHealth, setChildHealth] = useState<HealthValues>(EMPTY_HEALTH);
  const [childPhoto, setChildPhoto] = useState<File | null>(null);
  const [childIdDoc, setChildIdDoc] = useState<File | null>(null);
  const [childEpsCertificate, setChildEpsCertificate] = useState<File | null>(null);

  const emptyCoAdult = {
    documentID: '',
    name: '',
    phone: '',
    birthDate: '',
    email: '',
    gender: '',
    isTutor: false,
  };
  const [coAdultForm, setCoAdultForm] = useState(emptyCoAdult);
  const [editingSelf, setEditingSelf] = useState(false);
  const [coAdultHealth, setCoAdultHealth] = useState<HealthValues>(EMPTY_HEALTH);
  const [coAdultPhoto, setCoAdultPhoto] = useState<File | null>(null);
  const [coAdultIdDoc, setCoAdultIdDoc] = useState<File | null>(null);
  const [coAdultEpsCertificate, setCoAdultEpsCertificate] = useState<File | null>(null);
  const [coAdultExisting, setCoAdultExisting] = useState<PersonRecord | null>(null);

  useEffect(() => {
    fetch('/api/turnstile-config')
      .then((r) => r.json() as Promise<{ siteKey: string }>)
      .then((d) => setSiteKey(d.siteKey))
      .catch(() => setError('No se pudo cargar la verificación de seguridad'));
  }, []);

  useEffect(() => {
    if (!siteKey || widgetRendered.current) return;
    const render = () => {
      if (!turnstileRef.current || !window.turnstile) {
        setTimeout(render, 150);
        return;
      }
      window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
        appearance: 'always',
        theme: 'light',
        language: 'es',
      });
      widgetRendered.current = true;
    };
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      render();
    }
  }, [siteKey]);

  // Fallback for lost widget callbacks (transient error 600010): Turnstile
  // mirrors the token into a hidden input, so sync from it
  useEffect(() => {
    const interval = setInterval(() => {
      const value = turnstileRef.current?.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]'
      )?.value;
      if (value) setTurnstileToken((current) => (current === value ? current : value));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const loadGroup = async (doc: string) => {
    const res = await fetch(`/api/programs/${programId}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentID: doc, token: turnstileToken }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error || 'Error al consultar');
    }
    return (await res.json()) as {
      found: boolean;
      adult: PersonRecord | null;
      adults?: (PersonRecord & { isSelf?: boolean })[];
      children: PersonRecord[];
      member?: MemberPrefill | null;
    };
  };

  const refreshGroup = async () => {
    const group = await loadGroup(documentID.trim());
    setAdult(group.adult);
    setAdults(group.adults || []);
    setChildren(group.children);
    setDirty(false);
    setSavedMessage(
      'Información guardada. Puedes volver con tu documento para continuar o completar tu inscripción.'
    );
  };

  const handleIdentify = async () => {
    if (!documentID.trim() || !turnstileToken) return;
    setBusy(true);
    setError(null);
    try {
      const data = await loadGroup(documentID.trim());
      if (data.found && data.adult) {
        setAdult(data.adult);
        setAdults(data.adults || []);
        setChildren(data.children);
        setDirty(false);
        setStep('dashboard');
      } else {
        if (data.member) {
          setAdultForm({
            name: data.member.name || '',
            phone: data.member.phone || '',
            birthDate: data.member.birthDate ? data.member.birthDate.split('T')[0] : '',
            email: data.member.email || '',
            gender: data.member.gender || '',
            isTutor: false,
          });
        }
        setEmergency(EMPTY_EMERGENCY);
        setStep('adult');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('token', turnstileToken);
      form.append('documentID', documentID.trim());
      form.append('name', adultForm.name);
      form.append('phone', adultForm.phone);
      form.append('birthDate', adultForm.birthDate);
      form.append('gender', adultForm.gender);
      form.append('relationship', relationshipFrom(adultForm.gender, adultForm.isTutor));
      if (adultForm.email) form.append('email', adultForm.email);

      const res = await fetch(`/api/programs/${programId}/join`, { method: 'POST', body: form });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Error al inscribirse');

      await refreshGroup();
      setStep('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al inscribirse');
    } finally {
      setBusy(false);
    }
  };

  const prefillChild = async (doc: string) => {
    if (!doc.trim()) return;
    try {
      const res = await fetch('/api/children/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentID: doc.trim(), token: turnstileToken }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        found: boolean;
        child?: { name: string; gender?: string; birthDate?: string };
      };
      if (data.found && data.child) {
        setChildForm((prev) => ({
          ...prev,
          name: data.child!.name,
          gender: data.child!.gender || '',
          birthDate: data.child!.birthDate ? data.child!.birthDate.split('T')[0] : '',
        }));
      }
    } catch {
      // prefill is best-effort
    }
  };

  const prefillCoAdult = async (doc: string) => {
    if (!doc.trim()) return;
    try {
      const res = await fetch('/api/members/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentID: doc.trim(), token: turnstileToken }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        found: boolean;
        member?: { name: string; phone: string; birthDate?: string };
      };
      if (data.found && data.member) {
        setCoAdultForm((prev) => ({
          ...prev,
          name: data.member!.name,
          phone: data.member!.phone,
          birthDate: data.member!.birthDate ? data.member!.birthDate.split('T')[0] : '',
          gender: (data.member as { gender?: string }).gender || prev.gender,
        }));
      }
    } catch {
      // prefill is best-effort
    }
  };

  // Rewrites an admin-only file URL (from lookup) to the owner-scoped public
  // route so the responsible can view their own uploaded file while editing.
  const ownerFileUrl = (url?: string | null): string | null =>
    url ? url.replace('/api/admin/files/', `/api/programs/${programId}/file/`) : null;

  const openChildModal = () => {
    setChildForm(emptyChild);
    setChildHealth(EMPTY_HEALTH);
    setChildPhoto(null);
    setChildIdDoc(null);
    setChildEpsCertificate(null);
    setChildExisting(null);
    setChildEditing(false);
    setError(null);
    setDirty(false);
    setChildModalOpen(true);
  };

  const openEditChild = (child: PersonRecord) => {
    setChildForm({
      documentID: child.documentID,
      name: child.name || '',
      gender: child.gender || '',
      birthDate: child.birthDate ? child.birthDate.split('T')[0] : '',
      relationship: child.relationship || 'father',
    });
    setChildHealth(pickHealth(child));
    setChildPhoto(null);
    setChildIdDoc(null);
    setChildEpsCertificate(null);
    setChildExisting(child);
    setChildEditing(true);
    setError(null);
    setDirty(false);
    setChildModalOpen(true);
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('token', turnstileToken);
      form.append('tutorDocumentID', documentID.trim());
      form.append('documentID', childForm.documentID.trim());
      form.append('name', childForm.name);
      form.append('gender', childForm.gender);
      form.append('birthDate', childForm.birthDate);
      appendHealth(form, childHealth);
      if (childPhoto) form.append('photo', childPhoto);
      if (childIdDoc) form.append('idDocument', childIdDoc);
      if (childEpsCertificate) form.append('epsCertificate', childEpsCertificate);

      const res = await fetch(`/api/programs/${programId}/children`, {
        method: 'POST',
        body: form,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Error al inscribir al niño');

      await refreshGroup();
      setChildModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al inscribir al niño');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveChild = async (childDoc: string, childName: string) => {
    if (!window.confirm(`¿Retirar a ${childName} del programa?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/children`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorDocumentID: documentID.trim(),
          documentID: childDoc,
          token: turnstileToken,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Error al retirar al niño');
      await refreshGroup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al retirar al niño');
    } finally {
      setBusy(false);
    }
  };

  const openAdultModal = () => {
    setCoAdultForm(emptyCoAdult);
    setCoAdultHealth(EMPTY_HEALTH);
    setCoAdultPhoto(null);
    setCoAdultIdDoc(null);
    setCoAdultEpsCertificate(null);
    setCoAdultExisting(null);
    setCoAdultEditing(false);
    setEditingSelf(false);
    setError(null);
    setDirty(false);
    setAdultModalOpen(true);
  };

  // Edit any responsible (self or co-responsible) in the same modal. Self
  // saves through /join (preserving consents); co-responsibles through /adults.
  const openEditResponsible = (person: PersonRecord & { isSelf?: boolean }) => {
    setCoAdultForm({
      documentID: person.documentID,
      name: person.name || '',
      phone: person.phone || '',
      birthDate: person.birthDate ? person.birthDate.split('T')[0] : '',
      email: person.email || '',
      gender: person.gender || '',
      isTutor: person.relationship === 'tutor',
    });
    setCoAdultHealth(pickHealth(person));
    setCoAdultPhoto(null);
    setCoAdultIdDoc(null);
    setCoAdultEpsCertificate(null);
    setCoAdultExisting(person);
    setCoAdultEditing(true);
    setEditingSelf(Boolean(person.isSelf) || person.documentID === documentID.trim());
    setError(null);
    setDirty(false);
    setAdultModalOpen(true);
  };

  const handleSaveResponsible = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const relationship = relationshipFrom(coAdultForm.gender, coAdultForm.isTutor);
      const form = new FormData();
      form.append('token', turnstileToken);
      form.append('documentID', coAdultForm.documentID.trim());
      form.append('name', coAdultForm.name);
      form.append('phone', coAdultForm.phone);
      form.append('birthDate', coAdultForm.birthDate);
      form.append('gender', coAdultForm.gender);
      form.append('relationship', relationship);
      appendHealth(form, coAdultHealth);
      if (coAdultPhoto) form.append('photo', coAdultPhoto);
      if (coAdultIdDoc) form.append('idDocument', coAdultIdDoc);
      if (coAdultEpsCertificate) form.append('epsCertificate', coAdultEpsCertificate);

      let endpoint = `/api/programs/${programId}/adults`;
      if (coAdultForm.email) form.append('email', coAdultForm.email);
      if (editingSelf) {
        // Editing personal data must not grant consent.
        endpoint = `/api/programs/${programId}/join`;
      } else {
        form.append('tutorDocumentID', documentID.trim());
      }

      const res = await fetch(endpoint, { method: 'POST', body: form });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Error al guardar el responsable');

      await refreshGroup();
      setAdultModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el responsable');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveCoAdult = async (adultDoc: string, adultName: string) => {
    if (!window.confirm(`¿Quitar a ${adultName} del grupo familiar?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/adults`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorDocumentID: documentID.trim(),
          documentID: adultDoc,
          token: turnstileToken,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Error al quitar al responsable');
      await refreshGroup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al quitar al responsable');
    } finally {
      setBusy(false);
    }
  };

  const openEmergencyModal = () => {
    setEmergency({
      emergencyContactName: adult?.emergencyContactName || '',
      emergencyContactPhone: adult?.emergencyContactPhone || '',
      emergencyContactRelation: adult?.emergencyContactRelation || '',
    });
    setError(null);
    setDirty(false);
    setEmergencyModalOpen(true);
  };

  const handleSaveEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/emergency-contact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorDocumentID: documentID.trim(),
          token: turnstileToken,
          ...emergency,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Error al guardar el contacto');
      await refreshGroup();
      setEmergencyModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el contacto');
    } finally {
      setBusy(false);
    }
  };

  const finalized = Boolean(adult?.dataTreatmentAcceptedAt && adult?.participationConfirmedAt);

  const handleFinalize = async () => {
    if (!finalizeAccept || !finalizeConfirm) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentID: documentID.trim(),
          token: turnstileToken,
          acceptDataTreatment: finalizeAccept,
          confirmParticipation: finalizeConfirm,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la confirmación');
      await refreshGroup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setBusy(false);
    }
  };

  const primaryStyle = (disabled: boolean) => ({
    backgroundColor: disabled ? '#d1d5db' : FORM_COLOR,
  });

  return (
    <div
      onChangeCapture={() => {
        setDirty(true);
        setSavedMessage('');
      }}
      className="min-h-screen px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #f8f6f2 0%, #f0f0f0 100%)' }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <div
              className="rounded-lg border p-3 shadow-lg"
              style={{ backgroundColor: `${programColor}20`, borderColor: `${programColor}40` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={departmentImage}
                alt={`Logo ${departmentName}`}
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
          <h1 className="mb-3 text-4xl font-bold text-gray-900">{programTitle}</h1>
          <p className="mb-2 text-xl font-medium" style={{ color: programColor }}>
            {departmentName}
          </p>
          <p className="mb-6 text-lg text-gray-600">
            Inscripción familiar: como padre, madre, tutor o guía mayor registras y gestionas a tu
            grupo familiar.
          </p>

          {programContent && (
            <div className="mx-auto mb-8 max-w-2xl rounded-lg bg-white p-6 text-left shadow-sm">
              <h3 className="mb-3 text-center text-lg font-semibold text-gray-900">Detalles</h3>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {programContent}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {savedMessage && !dirty && (
          <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {savedMessage}
          </p>
        )}

        {/* Step 1: identify */}
        {step === 'identify' && (
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              Identifícate como responsable
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Ingresa tu documento. Si ya estás inscrito verás tu grupo familiar; si no, podrás
              registrarte. Los niños siempre se inscriben a través de un adulto responsable.
            </p>
            <label htmlFor="enrollment-field-8" className={LABEL_CLASS}>
              Documento del adulto responsable *
            </label>
            <input
              id="enrollment-field-8"
              value={documentID}
              onChange={(e) => setDocumentID(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Ej: 12345678"
              inputMode="numeric"
            />
            <div ref={turnstileRef} className="mt-4 flex justify-center" />
            {turnstileToken && (
              <p className="mt-2 text-center text-sm text-green-600">✓ Verificación completada</p>
            )}
            <button
              onClick={handleIdentify}
              disabled={busy || !documentID.trim() || !turnstileToken}
              className="mt-4 w-full rounded-lg py-3 font-semibold text-white shadow-sm transition-colors"
              style={primaryStyle(busy || !documentID.trim() || !turnstileToken)}
            >
              {busy ? 'Consultando...' : 'Continuar'}
            </button>
          </div>
        )}

        {/* Step 2: adult registration / edit */}
        {step === 'adult' && (
          <form onSubmit={handleJoin} className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-1 text-lg font-semibold text-gray-800">Datos del responsable</h2>
            <p className="mb-4 text-sm text-gray-600">
              Documento: <span className="font-mono font-semibold">{documentID}</span>
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-9" className={LABEL_CLASS}>
                  Nombre completo *
                </label>
                <input
                  id="enrollment-field-9"
                  value={adultForm.name}
                  onChange={(e) => setAdultForm({ ...adultForm, name: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label htmlFor="enrollment-field-10" className={LABEL_CLASS}>
                  Teléfono *
                </label>
                <input
                  id="enrollment-field-10"
                  value={adultForm.phone}
                  onChange={(e) => setAdultForm({ ...adultForm, phone: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label htmlFor="enrollment-field-11" className={LABEL_CLASS}>
                  Fecha de nacimiento *
                </label>
                <input
                  id="enrollment-field-11"
                  type="date"
                  value={adultForm.birthDate}
                  onChange={(e) => setAdultForm({ ...adultForm, birthDate: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label htmlFor="enrollment-field-12" className={LABEL_CLASS}>
                  Correo (opcional)
                </label>
                <input
                  id="enrollment-field-12"
                  type="email"
                  value={adultForm.email}
                  onChange={(e) => setAdultForm({ ...adultForm, email: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="adult-gender" className={LABEL_CLASS}>
                  Género {adultForm.isTutor ? '' : '*'}
                </label>
                <select
                  id="adult-gender"
                  value={adultForm.gender}
                  onChange={(e) => setAdultForm({ ...adultForm, gender: e.target.value })}
                  className={INPUT_CLASS}
                  required={!adultForm.isTutor}
                  disabled={adultForm.isTutor}
                >
                  <option value="">Selecciona...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={adultForm.isTutor}
                    onChange={(e) => setAdultForm({ ...adultForm, isTutor: e.target.checked })}
                  />
                  Soy el tutor / acudiente (no el padre ni la madre)
                </label>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Con estos datos básicos comenzamos tu inscripción. Después podrás completar tu
              información de salud, foto y documento, y agregar a tus niños desde tu grupo familiar.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(adult ? 'dashboard' : 'identify')}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700"
              >
                {adult ? 'Cancelar' : 'Volver'}
              </button>
              <button
                type="submit"
                disabled={busy || processingFiles > 0}
                className="flex-1 rounded-lg py-3 font-semibold text-white shadow-sm transition-colors"
                style={primaryStyle(busy)}
              >
                {busy ? 'Guardando...' : 'Guardar y continuar'}
              </button>
            </div>
          </form>
        )}

        {/* Dashboard: manage the whole family */}
        {step === 'dashboard' && adult && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Tu grupo familiar</h2>
              <p className="text-sm text-gray-600">
                Guarda cada formulario antes de cerrarlo. Los datos guardados se conservan: puedes
                volver con tu documento para continuar y completar tu inscripción.
              </p>
            </div>

            {/* Children (optional: only if the adult has a family group) */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Niños ({children.length})</h3>
                <button
                  onClick={openChildModal}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: FORM_COLOR }}
                >
                  + Agregar niño
                </button>
              </div>

              {children.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Aún no has registrado niños. Si solo asistes tú, no necesitas agregarlos.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {children.map((child) => (
                    <li
                      key={child.documentID}
                      className={`flex flex-wrap items-center gap-3 rounded-lg px-3 py-3 ${
                        isPersonComplete(child) ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800">{child.name}</p>
                        <p className="text-xs text-gray-500">
                          Documento {child.documentID}
                          {isPersonComplete(child) ? (
                            <span className="ml-2 text-green-700">· completo ✓</span>
                          ) : (
                            <span className="ml-2 text-amber-700">· datos pendientes</span>
                          )}
                        </p>
                        <div className="mt-1">
                          <ClassificationBadge birthDate={child.birthDate} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          onClick={() => openEditChild(child)}
                          title="Editar"
                          aria-label="Editar"
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveChild(child.documentID, child.name)}
                          disabled={busy || processingFiles > 0}
                          title="Quitar"
                          aria-label="Quitar"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Responsibles */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Responsables ({adults.length})
                </h3>
                <button
                  onClick={openAdultModal}
                  disabled={children.length === 0 || busy}
                  title={
                    children.length === 0
                      ? 'Agrega primero un niño para vincular otro responsable a la familia'
                      : undefined
                  }
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: FORM_COLOR }}
                >
                  + Agregar responsable
                </button>
              </div>
              {children.length === 0 && (
                <p className="mb-3 text-sm text-gray-600">
                  Para agregar al otro padre o tutor, guarda primero un niño. Después podrás
                  gestionar a toda la familia desde cualquiera de los responsables.
                </p>
              )}
              <ul className="divide-y divide-gray-100">
                {adults.map((a) => (
                  <li
                    key={a.documentID}
                    className={`flex flex-wrap items-center gap-3 rounded-lg px-3 py-3 ${
                      isPersonComplete(a) ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800">
                        {a.name}
                        {a.isSelf && <span className="ml-2 text-xs text-gray-400">(tú)</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        Documento {a.documentID} · {relationshipLabel(a.relationship)}
                        {isPersonComplete(a) ? (
                          <span className="ml-2 text-green-700">· completo ✓</span>
                        ) : (
                          <span className="ml-2 text-amber-700">· datos pendientes</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditResponsible(a)}
                        title="Editar"
                        aria-label="Editar"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!a.isSelf && (
                        <button
                          onClick={() => handleRemoveCoAdult(a.documentID, a.name)}
                          disabled={busy || processingFiles > 0}
                          title="Quitar"
                          aria-label="Quitar"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emergency contact (one per family) */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Contacto de emergencia de la familia
                </h3>
                <button
                  onClick={openEmergencyModal}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: FORM_COLOR, color: FORM_COLOR }}
                >
                  {adult.emergencyContactName ? 'Editar' : 'Agregar'}
                </button>
              </div>
              {adult.emergencyContactName ? (
                <p className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">{adult.emergencyContactName}</span> ·{' '}
                  {adult.emergencyContactPhone}
                </p>
              ) : (
                <p className="mt-2 text-sm text-amber-800">
                  Aún no has registrado a quién llamar en una emergencia.
                </p>
              )}
            </div>

            {/* Each responsible saves their own consent. Printing is handled by the directiva. */}
            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: `${FORM_COLOR}40`, backgroundColor: `${FORM_COLOR}10` }}
            >
              <h3 className="text-lg font-semibold text-gray-800">Finalizar la inscripción</h3>
              <p className="mt-1 text-sm text-gray-600">
                Completa los datos y adjuntos de tu grupo familiar y confirma las siguientes
                casillas. La directiva preparará e imprimirá la carpeta familiar para recoger las
                firmas. Cada responsable debe ingresar con su documento y guardar su propia
                aceptación.
              </p>

              <p className="mt-2 text-sm">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                  style={{ color: FORM_COLOR }}
                >
                  Consultar la política de tratamiento de datos personales
                </a>
              </p>

              {!finalized && (
                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={finalizeAccept}
                      onChange={(e) => setFinalizeAccept(e.target.checked)}
                      className="mt-0.5"
                    />
                    Autorizo el tratamiento de datos personales (incluidos datos de salud) para la
                    gestión del programa, según la Ley 1581 de 2012.
                  </label>
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={finalizeConfirm}
                      onChange={(e) => setFinalizeConfirm(e.target.checked)}
                      className="mt-0.5"
                    />
                    Confirmo la inscripción a {programTitle} y me comprometo a firmar las
                    autorizaciones que entregue la directiva.
                  </label>
                </div>
              )}

              {!finalized && (
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={busy || !finalizeAccept || !finalizeConfirm}
                  className="mt-4 rounded-lg px-4 py-3 text-sm font-semibold text-white"
                  style={primaryStyle(busy || !finalizeAccept || !finalizeConfirm)}
                >
                  {busy ? 'Guardando...' : 'Guardar aceptación y confirmar inscripción'}
                </button>
              )}
              {finalized && (
                <p className="mt-4 text-sm text-green-800">
                  Tu aceptación quedó guardada. La directiva imprimirá la carpeta familiar. Cada
                  adulto firmará su autorización y los padres o tutores firmarán por los menores.
                </p>
              )}
              {!finalized && (
                <p className="mt-4 text-sm text-gray-500">
                  Marca ambas casillas y guarda tu aceptación. No necesitas descargar ni imprimir
                  documentos.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {pendingClose && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Cambios sin guardar"
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 className="font-semibold">Tienes cambios sin guardar</h3>
            <p className="mt-2 text-sm text-gray-600">
              Vuelve al formulario y guarda la información para conservarla.
            </p>
            <button
              type="button"
              onClick={() => setPendingClose(null)}
              className="mt-4 w-full rounded-lg bg-[#4b207f] p-3 font-semibold text-white"
            >
              Seguir editando
            </button>
            <button
              type="button"
              onClick={() => {
                pendingClose();
                setPendingClose(null);
                setDirty(false);
              }}
              className="mt-2 w-full rounded-lg p-3 text-sm text-red-700"
            >
              Descartar cambios y cerrar
            </button>
          </div>
        </div>
      )}

      {/* Add child modal */}
      {childModalOpen && (
        <Modal
          title={childEditing ? 'Editar niño' : 'Agregar niño al grupo familiar'}
          onClose={() => closeEditor(() => setChildModalOpen(false))}
        >
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-700">
              {error}
            </p>
          )}
          <form onSubmit={handleAddChild} className="space-y-4">
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {dirty
                ? 'Tienes cambios sin guardar. Usa el botón Guardar al terminar.'
                : 'Completa los datos y guárdalos antes de cerrar este formulario.'}
            </p>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Datos personales del niño
            </h4>
            <FileCapture
              onProcessingChange={onFileProcessing}
              label="Foto del niño"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              file={childPhoto}
              existingUrl={childExisting?.photoUrl}
              viewUrl={ownerFileUrl(childExisting?.photoUrl)}
              onChange={(file) => {
                setChildPhoto(file);
                setDirty(true);
              }}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-13" className={LABEL_CLASS}>
                  Documento del niño *
                </label>
                <input
                  id="enrollment-field-13"
                  value={childForm.documentID}
                  onChange={(e) => setChildForm({ ...childForm, documentID: e.target.value })}
                  onBlur={(e) => !childEditing && prefillChild(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Número del registro civil de nacimiento"
                  required
                  readOnly={childEditing}
                />
                {!childEditing && (
                  <p className="mt-1 text-xs text-gray-500">
                    Si el niño ya está registrado, sus datos se completarán automáticamente.
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-14" className={LABEL_CLASS}>
                  Nombre completo *
                </label>
                <input
                  id="enrollment-field-14"
                  value={childForm.name}
                  onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label htmlFor="enrollment-field-15" className={LABEL_CLASS}>
                  Género
                </label>
                <select
                  id="enrollment-field-15"
                  value={childForm.gender}
                  onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}
                  className={INPUT_CLASS}
                >
                  <option value="">Selecciona...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div>
                <label htmlFor="enrollment-field-16" className={LABEL_CLASS}>
                  Fecha de nacimiento *
                </label>
                <input
                  id="enrollment-field-16"
                  type="date"
                  value={childForm.birthDate}
                  onChange={(e) => setChildForm({ ...childForm, birthDate: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                {childForm.birthDate && <ClassificationBadge birthDate={childForm.birthDate} />}
              </div>
            </div>

            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Información de salud del niño
            </h4>
            <HealthFields values={childHealth} onChange={setChildHealth}>
              <FileCapture
                onProcessingChange={onFileProcessing}
                label="Certificado de afiliación a la EPS"
                description="Adjunta el certificado de esta persona en PDF o imagen (máximo 10 MB). Puedes agregarlo ahora o más adelante."
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                file={childEpsCertificate}
                existingUrl={childExisting?.epsCertificateUrl}
                viewUrl={ownerFileUrl(childExisting?.epsCertificateUrl)}
                onChange={(file) => {
                  setChildEpsCertificate(file);
                  setDirty(true);
                }}
              />
            </HealthFields>

            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Documentos del niño
            </h4>
            <FileCapture
              onProcessingChange={onFileProcessing}
              label="Documento de identidad"
              description="Para el niño o niña, adjunta el registro civil de nacimiento."
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
              file={childIdDoc}
              existingUrl={childExisting?.idDocumentUrl}
              viewUrl={ownerFileUrl(childExisting?.idDocumentUrl)}
              onChange={(file) => {
                setChildIdDoc(file);
                setDirty(true);
              }}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => closeEditor(() => setChildModalOpen(false))}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy || processingFiles > 0}
                className="flex-1 rounded-lg py-3 font-semibold text-white shadow-sm"
                style={primaryStyle(busy)}
              >
                {busy ? 'Guardando...' : childEditing ? 'Guardar cambios' : 'Guardar niño'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add co-adult modal */}
      {adultModalOpen && (
        <Modal
          title={
            editingSelf
              ? 'Editar mis datos'
              : coAdultEditing
                ? 'Editar responsable'
                : 'Agregar responsable al grupo familiar'
          }
          onClose={() => closeEditor(() => setAdultModalOpen(false))}
        >
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-700">
              {error}
            </p>
          )}
          <form onSubmit={handleSaveResponsible} className="space-y-4">
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {dirty
                ? 'Tienes cambios sin guardar. Usa el botón Guardar al terminar.'
                : 'Completa los datos y guárdalos antes de cerrar este formulario.'}
            </p>
            {!coAdultEditing && (
              <p className="text-sm text-gray-600">
                Registra y guarda los datos del otro padre, madre o tutor. Ambos podrán consultar la
                familia con su propio documento.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-17" className={LABEL_CLASS}>
                  Documento *
                </label>
                <input
                  id="enrollment-field-17"
                  value={coAdultForm.documentID}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, documentID: e.target.value })}
                  onBlur={(e) => !coAdultEditing && prefillCoAdult(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Ej: 12345678"
                  required
                  readOnly={coAdultEditing}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Si ya está registrado como miembro, sus datos se completarán automáticamente.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-18" className={LABEL_CLASS}>
                  Nombre completo *
                </label>
                <input
                  id="enrollment-field-18"
                  value={coAdultForm.name}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, name: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-19" className={LABEL_CLASS}>
                  Correo electrónico
                </label>
                <input
                  id="enrollment-field-19"
                  type="email"
                  value={coAdultForm.email}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, email: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="enrollment-field-20" className={LABEL_CLASS}>
                  Teléfono *
                </label>
                <input
                  id="enrollment-field-20"
                  value={coAdultForm.phone}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, phone: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label htmlFor="enrollment-field-21" className={LABEL_CLASS}>
                  Fecha de nacimiento *
                </label>
                <input
                  id="enrollment-field-21"
                  type="date"
                  value={coAdultForm.birthDate}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, birthDate: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label htmlFor="co-adult-gender" className={LABEL_CLASS}>
                  Género {coAdultForm.isTutor ? '' : '*'}
                </label>
                <select
                  id="co-adult-gender"
                  value={coAdultForm.gender}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, gender: e.target.value })}
                  className={INPUT_CLASS}
                  required={!coAdultForm.isTutor}
                  disabled={coAdultForm.isTutor}
                >
                  <option value="">Selecciona...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={coAdultForm.isTutor}
                    onChange={(e) => setCoAdultForm({ ...coAdultForm, isTutor: e.target.checked })}
                  />
                  Es el tutor / acudiente (no el padre ni la madre)
                </label>
              </div>
            </div>

            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Información de salud
            </h4>
            <HealthFields values={coAdultHealth} onChange={setCoAdultHealth}>
              <FileCapture
                onProcessingChange={onFileProcessing}
                label="Certificado de afiliación a la EPS"
                description="Adjunta el certificado de esta persona en PDF o imagen (máximo 10 MB). Puedes agregarlo ahora o más adelante."
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                file={coAdultEpsCertificate}
                existingUrl={coAdultExisting?.epsCertificateUrl}
                viewUrl={ownerFileUrl(coAdultExisting?.epsCertificateUrl)}
                onChange={(file) => {
                  setCoAdultEpsCertificate(file);
                  setDirty(true);
                }}
              />
            </HealthFields>

            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Documentos
            </h4>
            <FileCapture
              onProcessingChange={onFileProcessing}
              label="Foto del responsable"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              file={coAdultPhoto}
              existingUrl={coAdultExisting?.photoUrl}
              viewUrl={ownerFileUrl(coAdultExisting?.photoUrl)}
              onChange={(file) => {
                setCoAdultPhoto(file);
                setDirty(true);
              }}
            />
            <FileCapture
              onProcessingChange={onFileProcessing}
              label="Documento de identidad"
              description="Para el padre, madre o acudiente, adjunta la cédula de ciudadanía por ambas caras en un solo PDF o imagen."
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
              file={coAdultIdDoc}
              existingUrl={coAdultExisting?.idDocumentUrl}
              viewUrl={ownerFileUrl(coAdultExisting?.idDocumentUrl)}
              onChange={(file) => {
                setCoAdultIdDoc(file);
                setDirty(true);
              }}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => closeEditor(() => setAdultModalOpen(false))}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy || processingFiles > 0}
                className="flex-1 rounded-lg py-3 font-semibold text-white shadow-sm"
                style={primaryStyle(busy)}
              >
                {busy ? 'Guardando...' : coAdultEditing ? 'Guardar cambios' : 'Guardar responsable'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Emergency contact modal */}
      {emergencyModalOpen && (
        <Modal
          title="Contacto de emergencia de la familia"
          onClose={() => closeEditor(() => setEmergencyModalOpen(false))}
        >
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-700">
              {error}
            </p>
          )}
          <form onSubmit={handleSaveEmergency} className="space-y-4">
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {dirty
                ? 'Tienes cambios sin guardar. Usa el botón Guardar al terminar.'
                : 'Completa los datos y guárdalos antes de cerrar este formulario.'}
            </p>
            <p className="text-sm text-gray-600">
              A quién llamar en caso de emergencia. Es el mismo para toda la familia.
            </p>
            <EmergencyFields values={emergency} onChange={setEmergency} />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => closeEditor(() => setEmergencyModalOpen(false))}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy || processingFiles > 0}
                className="flex-1 rounded-lg py-3 font-semibold text-white shadow-sm"
                style={primaryStyle(busy)}
              >
                {busy ? 'Guardando...' : 'Guardar contacto'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
