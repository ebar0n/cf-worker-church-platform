'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  ChevronDown,
  CircleCheck,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { classify } from '@/lib/age-classification';
import PdfFilePreview from '@/app/components/PdfFilePreview';
import ProgramEventInfo from '@/app/program/[id]/components/ProgramEventInfo';
import { printableImage } from '@/lib/printable-image';

interface Props {
  programId: number;
  programTitle: string;
  programContent: string | null;
  programColor: string;
  departmentName: string;
  departmentImage: string;
  imageUrl?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
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

function consentDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'America/Bogota',
  }).format(date);
}

const safeCategory = (birthDate: string | null): string => {
  if (!birthDate) return 'Niño';
  try {
    return classify(birthDate).category;
  } catch {
    return 'Niño';
  }
};

const INPUT_CLASS =
  'h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-ink placeholder:text-gray-500 focus-visible:border-denim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-denim/25 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500';
const LABEL_CLASS = 'mb-2 block text-sm font-medium text-ink';
const HELP_CLASS = 'mt-2 text-[13px] text-ink-soft';
const ERROR_CLASS = 'flex items-start gap-1.5 text-sm text-[#b3261e]';
const CARD_CLASS = 'rounded-2xl border border-line bg-white p-6 md:p-8';
const SECTION_CLASS =
  'border-t border-line pt-5 font-sans text-[13px] font-semibold uppercase tracking-[.06em] text-ink-soft';
// Kit "choice card": a checkbox row that turns warm-soft with an ink border when checked
const CHOICE_CLASS =
  'flex cursor-pointer items-start gap-3 rounded-xl border border-gray-300 bg-white p-4 text-[15px] text-ink has-[:checked]:border-ink has-[:checked]:bg-warm-soft has-[[aria-invalid=true]]:border-[#b3261e]';
const CHECKBOX_CLASS = 'mt-0.5 h-5 w-5 shrink-0 accent-ink';
const ICON_BUTTON_CLASS =
  'inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-gray-100 hover:text-ink';

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${INPUT_CLASS} appearance-none pr-11`} />
      <ChevronDown
        className="text-ink-soft pointer-events-none absolute right-3.5 top-3.5 h-5 w-5"
        strokeWidth={1.5}
      />
    </div>
  );
}

function ClassificationBadge({ birthDate }: { birthDate: string | null }) {
  if (!birthDate) return null;
  let result;
  try {
    result = classify(birthDate);
  } catch {
    return null;
  }
  return (
    <span className="border-line text-ink inline-block rounded-full border bg-white px-2.5 py-1 text-xs font-medium">
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
    <div className="bg-ink/70 fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="border-line w-full max-w-md rounded-2xl border bg-white p-4">
        {cameraError ? (
          <p className="text-ink-soft py-8 text-center text-[15px]">{cameraError}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="bg-ink aspect-video w-full rounded-xl object-cover"
          />
        )}
        <div className="mt-4 flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          {!cameraError && (
            <Button type="button" onClick={capture} className="flex-1">
              <Camera className="h-[18px] w-[18px]" strokeWidth={1.5} />
              Capturar
            </Button>
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
        <p id={`${fileId}-help`} className="text-ink-soft -mt-1 mb-3 text-[13px]">
          {description}
        </p>
      )}
      <div className="bg-paper flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3">
        {source && isImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={source}
            alt={`Vista previa: ${label}`}
            className="h-14 w-14 rounded-xl bg-white object-contain"
          />
        ) : (
          <div className="bg-warm-soft text-ink flex h-14 w-14 items-center justify-center rounded-xl">
            {file || existingUrl ? (
              <FileText className="h-6 w-6" strokeWidth={1.5} />
            ) : (
              <Plus className="h-6 w-6" strokeWidth={1.5} />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-ink-soft truncate text-sm">{status}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCameraOpen(true)}
              className="h-11"
            >
              <Camera className="h-4 w-4" strokeWidth={1.5} />
              Tomar foto
            </Button>
            <label className="border-ink text-ink has-[:focus-visible]:outline-denim inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 text-sm font-medium transition-colors hover:bg-[#f0ece5] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
              <Paperclip className="h-4 w-4" strokeWidth={1.5} />
              Subir archivo
              <input
                id={fileId}
                aria-label={label}
                aria-describedby={description ? `${fileId}-help` : undefined}
                type="file"
                disabled={preparingFile}
                accept={accept}
                className="sr-only"
                onChange={(e) => {
                  selectFile(e.target.files?.[0] || null);
                  e.target.value = '';
                }}
              />
            </label>
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(null);
                  setFileError(null);
                }}
                className="h-11 text-[#b3261e] hover:bg-red-50"
              >
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>
      {preparingFile && (
        <p role="status" className="text-ink-soft mt-2 text-sm">
          Preparando imagen para impresión...
        </p>
      )}
      {fileError && (
        <p role="alert" className={`mt-2 ${ERROR_CLASS}`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
          {fileError}
        </p>
      )}
      {source && (isImage || isPdf) && (
        <details
          key={source}
          className="border-line mt-2 rounded-xl border bg-white p-3"
          onToggle={(event) => setShowPdf(event.currentTarget.open)}
        >
          <summary className="text-denim hover:text-ink cursor-pointer text-sm font-medium">
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
        <p className={HELP_CLASS}>
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
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      <div>
        <label htmlFor="enrollment-field-1" className={LABEL_CLASS}>
          Tipo de sangre <span className="text-[#b3261e]">*</span>
        </label>
        <Select
          id="enrollment-field-1"
          value={values.bloodType}
          onChange={set('bloodType')}
          required
        >
          <option value="">Selecciona...</option>
          {BLOOD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
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
          EPS <span className="text-[#b3261e]">*</span>
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
        <p id={`${epsSuggestionsId}-help`} className={HELP_CLASS}>
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
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      <div>
        <label htmlFor="enrollment-field-6" className={LABEL_CLASS}>
          Nombre del contacto <span className="text-[#b3261e]">*</span>
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
          Teléfono <span className="text-[#b3261e]">*</span>
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
    <div className="bg-ink/50 fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="border-line my-8 w-full max-w-xl rounded-2xl border bg-white"
      >
        <div className="border-line flex items-center justify-between gap-4 border-b py-3 pl-5 pr-3 md:pl-8">
          <h3 className="text-2xl leading-tight md:text-[28px]">{title}</h3>
          <button type="button" onClick={onClose} className={ICON_BUTTON_CLASS} aria-label="Cerrar">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-6 md:px-8">{children}</div>
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
  departmentName,
  departmentImage,
  imageUrl,
  eventDate,
  eventTime,
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
  const [finalizeAccept, setFinalizeAccept] = useState<boolean | null>(null);
  const [finalizeConfirm, setFinalizeConfirm] = useState<boolean | null>(null);

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
      setFinalizeAccept(null);
      setFinalizeConfirm(null);
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
  const dataTreatmentAccepted = finalizeAccept ?? Boolean(adult?.dataTreatmentAcceptedAt);
  const participationConfirmed = finalizeConfirm ?? Boolean(adult?.participationConfirmedAt);
  const consentChanged =
    dataTreatmentAccepted !== Boolean(adult?.dataTreatmentAcceptedAt) ||
    participationConfirmed !== Boolean(adult?.participationConfirmedAt);
  const consentError =
    (finalizeAccept !== null || finalizeConfirm !== null) &&
    (!dataTreatmentAccepted || !participationConfirmed);

  const handleFinalize = async () => {
    if (finalized || !dataTreatmentAccepted || !participationConfirmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentID: documentID.trim(),
          token: turnstileToken,
          acceptDataTreatment: dataTreatmentAccepted,
          confirmParticipation: participationConfirmed,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la confirmación');
      await refreshGroup();
      setFinalizeAccept(null);
      setFinalizeConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onChangeCapture={() => {
        setDirty(true);
        setSavedMessage('');
      }}
      className="bg-paper min-h-screen"
    >
      <div className="mx-auto w-full max-w-[880px] px-5 py-10 md:px-8 lg:py-16">
        {/* Hero */}
        <div className="mb-10 flex flex-col gap-5">
          <span className="border-line inline-flex items-center gap-2 self-start rounded-full border bg-white px-3 py-1.5 text-[13px] font-medium">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={departmentImage}
              alt={`Logo ${departmentName}`}
              className="h-6 w-6 object-contain grayscale"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {departmentName}
          </span>
          <h1 className="text-[40px] leading-[1.04] lg:text-[56px]">{programTitle}</h1>
          <p className="text-ink-soft max-w-[640px] text-lg leading-relaxed">
            Inscripción familiar: como padre, madre, tutor o guía mayor registras y gestionas a tu
            grupo familiar.
          </p>
          <ProgramEventInfo
            title={programTitle}
            imageUrl={imageUrl}
            eventDate={eventDate}
            eventTime={eventTime}
          />

          {programContent && (
            <div className={CARD_CLASS}>
              <h3 className="mb-3 text-2xl">Detalles</h3>
              <div className="whitespace-pre-wrap text-base leading-[1.7]">{programContent}</div>
            </div>
          )}
        </div>

        {error && (
          <div className="border-line mb-6 flex items-start gap-3 rounded-xl border bg-white p-4 text-[15px] text-[#b3261e]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
            {error}
          </div>
        )}

        {savedMessage && !dirty && (
          <p
            role="status"
            className="border-line text-ink mb-6 flex items-start gap-3 rounded-xl border bg-white p-4 text-[15px]"
          >
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" strokeWidth={1.5} />
            {savedMessage}
          </p>
        )}

        {/* Step 1: identify */}
        {step === 'identify' && (
          <div className={CARD_CLASS}>
            <h2 className="text-[28px] leading-tight md:text-[32px]">
              Identifícate como responsable
            </h2>
            <p className="text-ink-soft mb-6 mt-2">
              Ingresa tu documento. Si ya estás inscrito verás tu grupo familiar; si no, podrás
              registrarte. Los niños siempre se inscriben a través de un adulto responsable.
            </p>
            <label htmlFor="enrollment-field-8" className={LABEL_CLASS}>
              Documento del adulto responsable <span className="text-[#b3261e]">*</span>
            </label>
            <input
              id="enrollment-field-8"
              value={documentID}
              onChange={(e) => setDocumentID(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Ej: 12345678"
              inputMode="numeric"
            />
            <div ref={turnstileRef} className="mt-6 flex" />
            {turnstileToken && (
              <p className="mt-2 text-sm text-green-700">✓ Verificación completada</p>
            )}
            <Button
              onClick={handleIdentify}
              disabled={busy || !documentID.trim() || !turnstileToken}
              size="lg"
              className="mt-6 w-full"
            >
              {busy ? 'Consultando...' : 'Continuar'}
            </Button>
          </div>
        )}

        {/* Step 2: adult registration / edit */}
        {step === 'adult' && (
          <form onSubmit={handleJoin} className={CARD_CLASS}>
            <h2 className="text-[28px] leading-tight md:text-[32px]">Datos del responsable</h2>
            <p className="text-ink-soft mb-6 mt-2">
              Documento: <span className="text-ink font-semibold">{documentID}</span>
            </p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-9" className={LABEL_CLASS}>
                  Nombre completo <span className="text-[#b3261e]">*</span>
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
                  Teléfono <span className="text-[#b3261e]">*</span>
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
                  Fecha de nacimiento <span className="text-[#b3261e]">*</span>
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
                  Género {!adultForm.isTutor && <span className="text-[#b3261e]">*</span>}
                </label>
                <Select
                  id="adult-gender"
                  value={adultForm.gender}
                  onChange={(e) => setAdultForm({ ...adultForm, gender: e.target.value })}
                  required={!adultForm.isTutor}
                  disabled={adultForm.isTutor}
                >
                  <option value="">Selecciona...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className={CHOICE_CLASS}>
                  <input
                    type="checkbox"
                    checked={adultForm.isTutor}
                    onChange={(e) => setAdultForm({ ...adultForm, isTutor: e.target.checked })}
                    className={CHECKBOX_CLASS}
                  />
                  Soy el tutor / acudiente (no el padre ni la madre)
                </label>
              </div>
            </div>

            <p className="text-ink-soft mt-6 text-sm">
              Con estos datos básicos comenzamos tu inscripción. Después podrás completar tu
              información de salud, foto y documento, y agregar a tus niños desde tu grupo familiar.
            </p>

            <div className="border-line mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(adult ? 'dashboard' : 'identify')}
              >
                {adult ? 'Cancelar' : 'Volver'}
              </Button>
              <Button type="submit" size="lg" disabled={busy || processingFiles > 0}>
                {busy ? 'Guardando...' : 'Guardar y continuar'}
              </Button>
            </div>
          </form>
        )}

        {/* Dashboard: manage the whole family */}
        {step === 'dashboard' && adult && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[32px] leading-tight lg:text-[40px]">Tu grupo familiar</h2>
              <p className="text-ink-soft mt-2">
                Guarda cada formulario antes de cerrarlo. Los datos guardados se conservan: puedes
                volver con tu documento para continuar y completar tu inscripción.
              </p>
            </div>

            {/* Children (optional: only if the adult has a family group) */}
            <div className={CARD_CLASS}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl">Niños ({children.length})</h3>
                <Button variant="outline" onClick={openChildModal}>
                  + Agregar niño
                </Button>
              </div>

              {children.length === 0 ? (
                <p className="text-ink-soft text-[15px]">
                  Aún no has registrado niños. Si solo asistes tú, no necesitas agregarlos.
                </p>
              ) : (
                <ul className="divide-line divide-y">
                  {children.map((child) => (
                    <li
                      key={child.documentID}
                      className={`flex flex-wrap items-center gap-3 rounded-xl px-3 py-3 ${
                        isPersonComplete(child) ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-ink font-medium">{child.name}</p>
                        <p className="text-ink-soft text-[13px]">
                          Documento {child.documentID}
                          {isPersonComplete(child) ? (
                            <span className="ml-2 text-green-700">· completo ✓</span>
                          ) : (
                            <span className="text-ink ml-2 font-medium">· datos pendientes</span>
                          )}
                        </p>
                        <div className="mt-1">
                          <ClassificationBadge birthDate={child.birthDate} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditChild(child)}
                          title="Editar"
                          aria-label="Editar"
                          className={ICON_BUTTON_CLASS}
                        >
                          <Pencil className="h-[18px] w-[18px]" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleRemoveChild(child.documentID, child.name)}
                          disabled={busy || processingFiles > 0}
                          title="Quitar"
                          aria-label="Quitar"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#b3261e] hover:bg-red-50"
                        >
                          <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Responsibles */}
            <div className={CARD_CLASS}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl">Responsables ({adults.length})</h3>
                <Button variant="outline" onClick={openAdultModal} disabled={busy}>
                  + Agregar responsable
                </Button>
              </div>
              {children.length === 0 && (
                <p className="text-ink-soft mb-3 text-[15px]">
                  Para agregar al otro padre o tutor, guarda primero un niño. Después podrás
                  gestionar a toda la familia desde cualquiera de los responsables.
                </p>
              )}
              <ul className="divide-line divide-y">
                {adults.map((a) => (
                  <li
                    key={a.documentID}
                    className={`flex flex-wrap items-center gap-3 rounded-xl px-3 py-3 ${
                      isPersonComplete(a) ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-ink font-medium">
                        {a.name}
                        {a.isSelf && (
                          <span className="text-ink-soft ml-2 text-xs font-normal">(tú)</span>
                        )}
                      </p>
                      <p className="text-ink-soft text-[13px]">
                        Documento {a.documentID} · {relationshipLabel(a.relationship)}
                        {isPersonComplete(a) ? (
                          <span className="ml-2 text-green-700">· completo ✓</span>
                        ) : (
                          <span className="text-ink ml-2 font-medium">· datos pendientes</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditResponsible(a)}
                        title="Editar"
                        aria-label="Editar"
                        className={ICON_BUTTON_CLASS}
                      >
                        <Pencil className="h-[18px] w-[18px]" strokeWidth={1.5} />
                      </button>
                      {!a.isSelf && (
                        <button
                          onClick={() => handleRemoveCoAdult(a.documentID, a.name)}
                          disabled={busy || processingFiles > 0}
                          title="Quitar"
                          aria-label="Quitar"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#b3261e] hover:bg-red-50"
                        >
                          <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emergency contact (one per family) */}
            <div className={CARD_CLASS}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl">Contacto de emergencia de la familia</h3>
                <Button variant="outline" onClick={openEmergencyModal}>
                  {adult.emergencyContactName ? 'Editar' : 'Agregar'}
                </Button>
              </div>
              {adult.emergencyContactName ? (
                <p className="text-ink mt-3 text-[15px]">
                  <span className="font-medium">{adult.emergencyContactName}</span> ·{' '}
                  {adult.emergencyContactPhone}
                </p>
              ) : (
                <p className="text-ink-soft mt-3 text-[15px]">
                  Aún no has registrado a quién llamar en una emergencia.
                </p>
              )}
            </div>

            {/* Each responsible saves their own consent. Printing is handled by the directiva. */}
            <div className="border-line bg-warm-soft rounded-2xl border p-6 md:p-8">
              <h3 className="text-2xl">
                {finalized ? 'Inscripción confirmada' : 'Finalizar la inscripción'}
              </h3>
              <p className="text-ink-soft mt-2 text-[15px] leading-relaxed">
                {finalized
                  ? 'Estas son las aceptaciones que guardaste para tu inscripción. Puedes seguir consultándolas aquí.'
                  : 'Completa los datos y adjuntos de tu grupo familiar y confirma las siguientes casillas.'}{' '}
                La directiva preparará e imprimirá la carpeta familiar para recoger las firmas. Cada
                responsable debe ingresar con su documento y guardar su propia aceptación.
              </p>

              <p className="mt-3 text-[15px]">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-denim hover:text-ink font-medium underline"
                >
                  Consultar la política de tratamiento de datos personales
                </a>
              </p>

              <div className="mt-5 space-y-3">
                <label className={CHOICE_CLASS}>
                  <input
                    type="checkbox"
                    checked={dataTreatmentAccepted}
                    disabled={busy}
                    aria-invalid={consentError && !dataTreatmentAccepted}
                    aria-describedby={consentError ? 'enrollment-consent-warning' : undefined}
                    onChange={(e) => setFinalizeAccept(e.target.checked)}
                    className={CHECKBOX_CLASS}
                  />
                  <span>
                    Autorizo el tratamiento de datos personales (incluidos datos de salud) para la
                    gestión del programa, según la Ley 1581 de 2012.
                    {adult.dataTreatmentAcceptedAt && (
                      <span className="mt-1 block text-[13px] text-green-800">
                        Aceptado el{' '}
                        <time dateTime={adult.dataTreatmentAcceptedAt}>
                          {consentDate(adult.dataTreatmentAcceptedAt)}
                        </time>
                      </span>
                    )}
                  </span>
                </label>
                <label className={CHOICE_CLASS}>
                  <input
                    type="checkbox"
                    checked={participationConfirmed}
                    disabled={busy}
                    aria-invalid={consentError && !participationConfirmed}
                    aria-describedby={consentError ? 'enrollment-consent-warning' : undefined}
                    onChange={(e) => setFinalizeConfirm(e.target.checked)}
                    className={CHECKBOX_CLASS}
                  />
                  <span>
                    Confirmo la inscripción a {programTitle} y me comprometo a firmar las
                    autorizaciones que entregue la directiva.
                    {adult.participationConfirmedAt && (
                      <span className="mt-1 block text-[13px] text-green-800">
                        Confirmado el{' '}
                        <time dateTime={adult.participationConfirmedAt}>
                          {consentDate(adult.participationConfirmedAt)}
                        </time>
                      </span>
                    )}
                  </span>
                </label>
              </div>

              {consentChanged && (
                <p role="status" className="text-ink mt-3 text-sm font-medium">
                  Cambio sin guardar.
                  {(adult.dataTreatmentAcceptedAt || adult.participationConfirmedAt) &&
                    ' La aceptación registrada no se ha modificado.'}
                </p>
              )}
              {consentError && (
                <p id="enrollment-consent-warning" role="alert" className={`mt-2 ${ERROR_CLASS}`}>
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
                  Debes marcar ambas casillas para confirmar la inscripción.
                </p>
              )}

              {(!finalized || consentChanged) && (
                <Button
                  type="button"
                  variant="dark"
                  size="lg"
                  onClick={handleFinalize}
                  disabled={busy || !dataTreatmentAccepted || !participationConfirmed}
                  className="mt-5 h-auto min-h-[52px] whitespace-normal py-3"
                >
                  {busy ? 'Guardando...' : 'Guardar aceptación y confirmar inscripción'}
                </Button>
              )}
              {finalized && !consentChanged && (
                <p className="text-ink mt-5 flex items-start gap-2 text-[15px]">
                  <CircleCheck
                    className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
                    strokeWidth={1.5}
                  />
                  Tu aceptación quedó guardada. La directiva imprimirá la carpeta familiar. Cada
                  adulto firmará su autorización y los padres o tutores firmarán por los menores.
                </p>
              )}
              {!finalized && (
                <p className="text-ink-soft mt-4 text-sm">
                  Marca ambas casillas y guarda tu aceptación. No necesitas descargar ni imprimir
                  documentos.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {pendingClose && (
        <div className="bg-ink/60 fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Cambios sin guardar"
            className="border-line w-full max-w-sm rounded-2xl border bg-white p-6"
          >
            <h3 className="text-2xl leading-tight">Tienes cambios sin guardar</h3>
            <p className="text-ink-soft mt-2 text-[15px]">
              Vuelve al formulario y guarda la información para conservarla.
            </p>
            <Button
              type="button"
              size="lg"
              onClick={() => setPendingClose(null)}
              className="mt-5 w-full"
            >
              Seguir editando
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                pendingClose();
                setPendingClose(null);
                setDirty(false);
              }}
              className="mt-2 w-full text-[#b3261e] hover:bg-red-50"
            >
              Descartar cambios y cerrar
            </Button>
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
            <p role="alert" className={`mb-4 ${ERROR_CLASS}`}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              {error}
            </p>
          )}
          <form onSubmit={handleAddChild} className="space-y-5">
            <p role="status" className="bg-warm-soft text-ink rounded-xl p-3 text-sm">
              {dirty
                ? 'Tienes cambios sin guardar. Usa el botón Guardar al terminar.'
                : 'Completa los datos y guárdalos antes de cerrar este formulario.'}
            </p>
            <h4 className={SECTION_CLASS}>Datos personales del niño</h4>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-13" className={LABEL_CLASS}>
                  Documento del niño <span className="text-[#b3261e]">*</span>
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
                  <p className={HELP_CLASS}>
                    Si el niño ya está registrado, sus datos se completarán automáticamente.
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-14" className={LABEL_CLASS}>
                  Nombre completo <span className="text-[#b3261e]">*</span>
                </label>
                <input
                  id="enrollment-field-14"
                  value={childForm.name}
                  onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div className="sm:col-span-2">
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
              </div>
              <div>
                <label htmlFor="enrollment-field-15" className={LABEL_CLASS}>
                  Género
                </label>
                <Select
                  id="enrollment-field-15"
                  value={childForm.gender}
                  onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}
                >
                  <option value="">Selecciona...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </Select>
              </div>
              <div>
                <label htmlFor="enrollment-field-16" className={LABEL_CLASS}>
                  Fecha de nacimiento <span className="text-[#b3261e]">*</span>
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

            <h4 className={SECTION_CLASS}>Información de salud del niño</h4>
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

            <h4 className={SECTION_CLASS}>Documentos del niño</h4>
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

            <div className="border-line flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => closeEditor(() => setChildModalOpen(false))}
                className="sm:flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={busy || processingFiles > 0}
                className="sm:flex-1"
              >
                {busy ? 'Guardando...' : childEditing ? 'Guardar cambios' : 'Guardar niño'}
              </Button>
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
            <p role="alert" className={`mb-4 ${ERROR_CLASS}`}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              {error}
            </p>
          )}
          <form onSubmit={handleSaveResponsible} className="space-y-5">
            <p role="status" className="bg-warm-soft text-ink rounded-xl p-3 text-sm">
              {dirty
                ? 'Tienes cambios sin guardar. Usa el botón Guardar al terminar.'
                : 'Completa los datos y guárdalos antes de cerrar este formulario.'}
            </p>
            {!coAdultEditing && (
              <p className="text-ink-soft text-[15px]">
                Registra y guarda los datos del otro padre, madre o tutor. Ambos podrán consultar la
                familia con su propio documento.
              </p>
            )}
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-17" className={LABEL_CLASS}>
                  Documento <span className="text-[#b3261e]">*</span>
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
                <p className={HELP_CLASS}>
                  Si ya está registrado como miembro, sus datos se completarán automáticamente.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="enrollment-field-18" className={LABEL_CLASS}>
                  Nombre completo <span className="text-[#b3261e]">*</span>
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
                  Teléfono <span className="text-[#b3261e]">*</span>
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
                  Fecha de nacimiento <span className="text-[#b3261e]">*</span>
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
                  Género {!coAdultForm.isTutor && <span className="text-[#b3261e]">*</span>}
                </label>
                <Select
                  id="co-adult-gender"
                  value={coAdultForm.gender}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, gender: e.target.value })}
                  required={!coAdultForm.isTutor}
                  disabled={coAdultForm.isTutor}
                >
                  <option value="">Selecciona...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className={CHOICE_CLASS}>
                  <input
                    type="checkbox"
                    checked={coAdultForm.isTutor}
                    onChange={(e) => setCoAdultForm({ ...coAdultForm, isTutor: e.target.checked })}
                    className={CHECKBOX_CLASS}
                  />
                  Es el tutor / acudiente (no el padre ni la madre)
                </label>
              </div>
            </div>

            <h4 className={SECTION_CLASS}>Información de salud</h4>
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

            <h4 className={SECTION_CLASS}>Documentos</h4>
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

            <div className="border-line flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => closeEditor(() => setAdultModalOpen(false))}
                className="sm:flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={busy || processingFiles > 0}
                className="sm:flex-1"
              >
                {busy ? 'Guardando...' : coAdultEditing ? 'Guardar cambios' : 'Guardar responsable'}
              </Button>
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
            <p role="alert" className={`mb-4 ${ERROR_CLASS}`}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              {error}
            </p>
          )}
          <form onSubmit={handleSaveEmergency} className="space-y-5">
            <p role="status" className="bg-warm-soft text-ink rounded-xl p-3 text-sm">
              {dirty
                ? 'Tienes cambios sin guardar. Usa el botón Guardar al terminar.'
                : 'Completa los datos y guárdalos antes de cerrar este formulario.'}
            </p>
            <p className="text-ink-soft text-[15px]">
              A quién llamar en caso de emergencia. Es el mismo para toda la familia.
            </p>
            <EmergencyFields values={emergency} onChange={setEmergency} />
            <div className="border-line flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => closeEditor(() => setEmergencyModalOpen(false))}
                className="sm:flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={busy || processingFiles > 0}
                className="sm:flex-1"
              >
                {busy ? 'Guardando...' : 'Guardar contacto'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
