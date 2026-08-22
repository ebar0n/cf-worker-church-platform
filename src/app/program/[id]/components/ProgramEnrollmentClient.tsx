'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, FileDown } from 'lucide-react';
import { classify } from '@/lib/age-classification';

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
  physicalFormReceivedAt?: string | null;
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
// both documents are present. Tutors don't need a gender (relationship is set
// by the checkbox). Used to tint the card a subtle green.
const isPersonComplete = (p: PersonRecord): boolean =>
  Boolean(
    p.birthDate &&
      (p.gender || p.relationship === 'tutor') &&
      p.bloodType &&
      p.eps &&
      p.photoUrl &&
      p.idDocumentUrl
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
function FileCapture({
  label,
  accept,
  file,
  existingUrl,
  viewUrl,
  onChange,
}: {
  label: string;
  accept: string;
  file: File | null;
  existingUrl?: string | null;
  viewUrl?: string | null;
  onChange: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
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

  // Existing image files (photo, or an image ID copy) preview inline; PDFs
  // fall back to a "Ver documento" link.
  const isImageOnly = !accept.includes('pdf');
  const existingThumb = !file && viewUrl && isImageOnly ? viewUrl : null;

  return (
    <div>
      <p className={LABEL_CLASS}>{label}</p>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-3">
        {preview || existingThumb ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview || existingThumb || ''}
            alt="Vista previa"
            className="h-14 w-14 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-200 text-gray-400">
            {file || existingUrl ? '📄' : '＋'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-gray-600">{status}</p>
          {!file && viewUrl && (
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-block text-xs font-semibold text-[#4b207f] underline"
            >
              Ver documento cargado ↗
            </a>
          )}
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
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-red-600"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>
      {cameraOpen && (
        <CameraModal
          onCapture={(f) => {
            onChange(f);
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
}: {
  values: HealthValues;
  onChange: (values: HealthValues) => void;
}) {
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
        <label className={LABEL_CLASS}>Tipo de sangre *</label>
        <select
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
        <label className={LABEL_CLASS}>EPS *</label>
        <input value={values.eps} onChange={set('eps')} className={INPUT_CLASS} required />
      </div>
      <div>
        <label className={LABEL_CLASS}>Alergias</label>
        <input
          value={values.allergies}
          onChange={set('allergies')}
          onBlur={fillNa('allergies')}
          className={INPUT_CLASS}
          placeholder="n/a"
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Enfermedades o condiciones</label>
        <input
          value={values.conditions}
          onChange={set('conditions')}
          onBlur={fillNa('conditions')}
          className={INPUT_CLASS}
          placeholder="n/a"
        />
      </div>
      <div className="sm:col-span-2">
        <label className={LABEL_CLASS}>Medicamentos (si utiliza)</label>
        <input
          value={values.medications}
          onChange={set('medications')}
          onBlur={fillNa('medications')}
          className={INPUT_CLASS}
          placeholder="n/a"
        />
      </div>
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
        <label className={LABEL_CLASS}>Nombre del contacto *</label>
        <input
          value={values.emergencyContactName}
          onChange={set('emergencyContactName')}
          className={INPUT_CLASS}
          placeholder="Nombre completo"
          required
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Teléfono *</label>
        <input
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
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl">
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
    setChildExisting(null);
    setChildEditing(false);
    setError(null);
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
    setChildExisting(child);
    setChildEditing(true);
    setError(null);
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
    setCoAdultExisting(null);
    setCoAdultEditing(false);
    setEditingSelf(false);
    setError(null);
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
    setCoAdultExisting(person);
    setCoAdultEditing(true);
    setEditingSelf(Boolean(person.isSelf) || person.documentID === documentID.trim());
    setError(null);
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

      let endpoint = `/api/programs/${programId}/adults`;
      if (editingSelf) {
        // The primary responsible saves through /join; consents were already
        // accepted at first registration.
        endpoint = `/api/programs/${programId}/join`;
        if (coAdultForm.email) form.append('email', coAdultForm.email);
        form.append('acceptDataTreatment', 'true');
        form.append('confirmParticipation', 'true');
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

  const pdfUrl = (doc: string) =>
    `/api/programs/${programId}/pdf/${doc}${turnstileToken ? `?token=${turnstileToken}` : ''}`;

  const primaryStyle = (disabled: boolean) => ({
    backgroundColor: disabled ? '#d1d5db' : FORM_COLOR,
  });

  return (
    <div
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
            <label className={LABEL_CLASS}>Documento del adulto responsable *</label>
            <input
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
                <label className={LABEL_CLASS}>Nombre completo *</label>
                <input
                  value={adultForm.name}
                  onChange={(e) => setAdultForm({ ...adultForm, name: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Teléfono *</label>
                <input
                  value={adultForm.phone}
                  onChange={(e) => setAdultForm({ ...adultForm, phone: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Fecha de nacimiento *</label>
                <input
                  type="date"
                  value={adultForm.birthDate}
                  onChange={(e) => setAdultForm({ ...adultForm, birthDate: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
                {adultForm.birthDate && (
                  <div className="mt-1">
                    <ClassificationBadge birthDate={adultForm.birthDate} />
                  </div>
                )}
              </div>
              <div>
                <label className={LABEL_CLASS}>Correo (opcional)</label>
                <input
                  type="email"
                  value={adultForm.email}
                  onChange={(e) => setAdultForm({ ...adultForm, email: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Género {adultForm.isTutor ? '' : '*'}</label>
                <select
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
                disabled={busy}
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
                Gestiona a los responsables y los niños. Vuelve cuando quieras con tu documento.
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
                          disabled={busy}
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
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: FORM_COLOR }}
                >
                  + Agregar responsable
                </button>
              </div>
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
                          disabled={busy}
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

            {/* Finalize: the primary responsible re-affirms consent, which
                reveals the printable forms for the whole family group. */}
            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: `${FORM_COLOR}40`, backgroundColor: `${FORM_COLOR}10` }}
            >
              <h3 className="text-lg font-semibold text-gray-800">Finalizar la inscripción</h3>
              <p className="mt-1 text-sm text-gray-600">
                Como responsable, confirma las siguientes casillas para habilitar la descarga de los
                formatos de cada integrante. Imprímelos, fírmalos y entrégalos a la directiva del
                programa: ese documento firmado es la confirmación física de la inscripción.
              </p>

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
                  Confirmo la inscripción a {programTitle} y me comprometo a entregar el formato
                  impreso y firmado.
                </label>
              </div>

              {finalizeAccept && finalizeConfirm ? (
                <div className="mt-5 space-y-2">
                  {[...adults, ...children].map((person) => (
                    <a
                      key={`pdf-${person.documentID}`}
                      href={pdfUrl(person.documentID)}
                      className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm hover:shadow"
                      style={{ borderColor: `${FORM_COLOR}30` }}
                    >
                      <span>
                        {person.name}
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          {'isSelf' in person
                            ? relationshipLabel(person.relationship)
                            : safeCategory(person.birthDate)}
                        </span>
                      </span>
                      <span
                        className="inline-flex items-center gap-1 font-semibold"
                        style={{ color: FORM_COLOR }}
                      >
                        <FileDown className="h-4 w-4" /> Descargar
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Marca ambas casillas para ver y descargar los formatos.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add child modal */}
      {childModalOpen && (
        <Modal
          title={childEditing ? 'Editar niño' : 'Agregar niño al grupo familiar'}
          onClose={() => setChildModalOpen(false)}
        >
          <form onSubmit={handleAddChild} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Documento del niño *</label>
                <input
                  value={childForm.documentID}
                  onChange={(e) => setChildForm({ ...childForm, documentID: e.target.value })}
                  onBlur={(e) => !childEditing && prefillChild(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Registro civil o tarjeta de identidad"
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
                <label className={LABEL_CLASS}>Nombre completo *</label>
                <input
                  value={childForm.name}
                  onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Género</label>
                <select
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
                <label className={LABEL_CLASS}>Fecha de nacimiento *</label>
                <input
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
            <HealthFields values={childHealth} onChange={setChildHealth} />

            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Documentos del niño
            </h4>
            <FileCapture
              label="Foto del niño"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              file={childPhoto}
              existingUrl={childExisting?.photoUrl}
              viewUrl={ownerFileUrl(childExisting?.photoUrl)}
              onChange={setChildPhoto}
            />
            <FileCapture
              label="Copia del documento"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
              file={childIdDoc}
              existingUrl={childExisting?.idDocumentUrl}
              viewUrl={ownerFileUrl(childExisting?.idDocumentUrl)}
              onChange={setChildIdDoc}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setChildModalOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg py-3 font-semibold text-white shadow-sm"
                style={primaryStyle(busy)}
              >
                {busy ? 'Guardando...' : childEditing ? 'Guardar cambios' : 'Inscribir niño'}
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
          onClose={() => setAdultModalOpen(false)}
        >
          <form onSubmit={handleSaveResponsible} className="space-y-4">
            {!coAdultEditing && (
              <p className="text-sm text-gray-600">
                Registra a otro padre, madre o tutor. Completará su información de salud ingresando
                luego con su propio documento.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Documento *</label>
                <input
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
                <label className={LABEL_CLASS}>Nombre completo *</label>
                <input
                  value={coAdultForm.name}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, name: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              {editingSelf && (
                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>Correo electrónico</label>
                  <input
                    type="email"
                    value={coAdultForm.email}
                    onChange={(e) => setCoAdultForm({ ...coAdultForm, email: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              )}
              <div>
                <label className={LABEL_CLASS}>Teléfono *</label>
                <input
                  value={coAdultForm.phone}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, phone: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Fecha de nacimiento *</label>
                <input
                  type="date"
                  value={coAdultForm.birthDate}
                  onChange={(e) => setCoAdultForm({ ...coAdultForm, birthDate: e.target.value })}
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Género {coAdultForm.isTutor ? '' : '*'}</label>
                <select
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
            <HealthFields values={coAdultHealth} onChange={setCoAdultHealth} />

            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Documentos
            </h4>
            <FileCapture
              label="Foto del responsable"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              file={coAdultPhoto}
              existingUrl={coAdultExisting?.photoUrl}
              viewUrl={ownerFileUrl(coAdultExisting?.photoUrl)}
              onChange={setCoAdultPhoto}
            />
            <FileCapture
              label="Copia del documento"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
              file={coAdultIdDoc}
              existingUrl={coAdultExisting?.idDocumentUrl}
              viewUrl={ownerFileUrl(coAdultExisting?.idDocumentUrl)}
              onChange={setCoAdultIdDoc}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdultModalOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg py-3 font-semibold text-white shadow-sm"
                style={primaryStyle(busy)}
              >
                {busy
                  ? 'Guardando...'
                  : coAdultEditing
                    ? 'Guardar cambios'
                    : 'Registrar responsable'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Emergency contact modal */}
      {emergencyModalOpen && (
        <Modal
          title="Contacto de emergencia de la familia"
          onClose={() => setEmergencyModalOpen(false)}
        >
          <form onSubmit={handleSaveEmergency} className="space-y-4">
            <p className="text-sm text-gray-600">
              A quién llamar en caso de emergencia. Es el mismo para toda la familia.
            </p>
            <EmergencyFields values={emergency} onChange={setEmergency} />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
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
