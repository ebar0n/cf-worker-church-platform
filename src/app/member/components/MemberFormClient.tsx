'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, CircleCheck } from 'lucide-react';
import { buttonVariants } from '@/app/components/ui/button';
import IdentificationStep from './IdentificationStep';
import PersonalInfoStep from './PersonalInfoStep';
import MembershipInfoStep from './MembershipInfoStep';
import ProfessionalInfoStep from './ProfessionalInfoStep';
import SkillsAndHealthStep from './SkillsAndHealthStep';
import ChurchAndOtherInfoStep from './ChurchAndOtherInfoStep';

type MemberFormData = {
  documentID: string;
  name: string;
  gender: string;
  birthDate: string;
  maritalStatus: string;
  address: string;
  phone: string;
  email: string;
  preferredContactMethod: string;
  baptismYear: number | null;
  currentAcceptanceYear: number | null;
  currentAcceptanceMethod: string;
  currentMembershipChurch: string;
  transferAuthorization: boolean;
  otherChurch: string;
  ministry: string;
  areasToServe: string;
  willingToLead: boolean;
  suggestions: string;
  pastoralNotes: string;
  currentOccupation: string;
  workOrStudyPlace: string;
  professionalArea: string;
  educationLevel: string;
  profession: string;
  workExperience: string;
  technicalSkills: string;
  softSkills: string;
  languages: string;
  medicalConditions: string;
  specialNeeds: string;
  interestsHobbies: string;
  volunteeringAvailability: string;
  termsAccepted: boolean;
};

const initialFormData: MemberFormData = {
  documentID: '',
  name: '',
  gender: '',
  birthDate: '',
  maritalStatus: '',
  address: '',
  phone: '',
  email: '',
  preferredContactMethod: '',
  baptismYear: null,
  currentAcceptanceYear: null,
  currentAcceptanceMethod: '',
  currentMembershipChurch: '',
  transferAuthorization: false,
  otherChurch: '',
  ministry: '',
  areasToServe: '',
  willingToLead: false,
  suggestions: '',
  pastoralNotes: '',
  currentOccupation: '',
  workOrStudyPlace: '',
  professionalArea: '',
  educationLevel: '',
  profession: '',
  workExperience: '',
  technicalSkills: '',
  softSkills: '',
  languages: '',
  medicalConditions: '',
  specialNeeds: '',
  interestsHobbies: '',
  volunteeringAvailability: '',
  termsAccepted: false,
};

// Stepper labels; the last entry is the thank-you screen (no segment)
const steps = [
  'Identificación',
  'Información personal',
  'Profesión y estudios',
  'Habilidades y salud',
  'Membresía',
  'Iglesia y otros',
  'Gracias',
];

interface MemberResponse {
  documentID: string;
  name: string;
  gender?: string;
  birthDate: string;
  maritalStatus?: string;
  address: string;
  phone: string;
  email?: string;
  preferredContactMethod?: string;
  baptismYear?: number;
  currentAcceptanceYear?: number;
  currentAcceptanceMethod?: string;
  currentMembershipChurch?: string;
  transferAuthorization?: boolean;
  ministry?: string;
  areasToServe?: string;
  willingToLead?: boolean;
  suggestions?: string;
  pastoralNotes?: string;
  currentOccupation?: string;
  workOrStudyPlace?: string;
  professionalArea?: string;
  educationLevel?: string;
  profession?: string;
  workExperience?: string;
  technicalSkills?: string;
  softSkills?: string;
  languages?: string;
  medicalConditions?: string;
  specialNeeds?: string;
  interestsHobbies?: string;
  volunteeringAvailability?: string;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

interface DocumentCheckResponse {
  documentID: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Utilidad para formatear fecha de forma local y verbosa
function formatDateVerbose(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MemberFormClient() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<MemberFormData>(initialFormData);
  const [isExisting, setIsExisting] = useState(false);
  const [registerInfo, setRegisterInfo] = useState<{ createdAt: string; updatedAt: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  // Input change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // Manejar campos especiales que pueden ser null o number
    if (name === 'baptismYear' || name === 'currentAcceptanceYear') {
      const numValue = value === '' ? null : parseInt(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  // Guardar al salir de un campo (onBlur)
  const handleBlur = async () => {
    if (step > 0 && formData.documentID && formData.termsAccepted) {
      await autoSave();
    }
  };

  // Navigation
  const nextStep = async () => {
    // Validar que el nombre esté lleno en el paso de información personal
    if (step === 1 && !formData.name.trim()) {
      setError('Por favor, ingresa el nombre antes de continuar');
      return;
    }

    // Crear el registro inicial cuando se avanza del paso de información personal
    if (step === 1 && !isExisting && formData.name.trim()) {
      try {
        // Solo enviar los campos requeridos según el schema
        const initialData = {
          documentID: formData.documentID,
          name: formData.name,
          birthDate: formData.birthDate,
          address: formData.address,
          phone: formData.phone,
          termsAccepted: true,
        };

        const createRes = await fetch('/api/member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...initialData, token: turnstileToken }),
        });

        if (createRes.ok) {
          const newMember = (await createRes.json()) as MemberResponse;
          setRegisterInfo({
            createdAt: newMember.createdAt,
            updatedAt: newMember.updatedAt,
          });
          setIsExisting(true);
        } else {
          const errorData = (await createRes.json()) as ErrorResponse;
          setError(errorData.error || 'Error al crear el registro. Intenta de nuevo.');
          return;
        }
      } catch (error) {
        setError('Error al crear el registro. Intenta de nuevo.');
        return;
      }
    }

    if (step > 1 && formData.documentID && formData.termsAccepted) {
      await autoSave();
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = async () => {
    if (step > 0 && formData.documentID && formData.termsAccepted) {
      await autoSave();
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  // Auto-save function
  const autoSave = async () => {
    if (!formData.documentID || !formData.termsAccepted || step === 0) return;
    try {
      setAutoSaveStatus('saving');
      let method: 'POST' | 'PUT' = isExisting ? 'PUT' : 'POST';
      if (!isExisting && step === 1) {
        method = 'POST';
      } else if (!isExisting) {
        setAutoSaveStatus('idle');
        return;
      }

      const res = await fetch('/api/member', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, token: turnstileToken }),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as ErrorResponse;
        console.error('Error auto-guardando:', errorData.error);
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      } else {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
        if (!isExisting) setIsExisting(true);
        const data: MemberResponse = await res.json();
        if (data.createdAt && data.updatedAt) {
          setRegisterInfo({
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      }
    } catch (error) {
      console.error('Error auto-guardando:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };

  // DocumentID check and prefill
  const handleDocumentIDCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/member?documentID=${formData.documentID}&token=${turnstileToken}`
      );
      if (res.ok) {
        const data = (await res.json()) as MemberResponse | { documentID: null };
        if (data && data.documentID) {
          // Si existe, cargar los datos
          setIsExisting(true);
          setRegisterInfo({
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
          setFormData({
            ...initialFormData,
            ...Object.fromEntries(
              Object.entries(data).map(([k, v]) => {
                if (k === 'birthDate') {
                  // Date part only: '' or null birthDates must stay empty
                  // (new Date('') throws, new Date(null) is 1970-01-01).
                  return [k, v ? String(v).slice(0, 10) : ''];
                }
                if (k === 'willingToLead') {
                  return [k, Boolean(v)];
                }
                if (k === 'baptismYear' || k === 'currentAcceptanceYear') {
                  return [k, v === null ? null : Number(v)];
                }
                if (k === 'transferAuthorization') {
                  return [k, Boolean(v)];
                }
                return [k, v === null ? '' : v];
              })
            ),
            documentID: formData.documentID,
            termsAccepted: true,
          });
        } else {
          // Si no existe, solo avanzar al siguiente paso
          setIsExisting(false);
          setFormData((prev) => ({
            ...prev,
            termsAccepted: true,
          }));
        }
        setStep(1);
      } else {
        const errorData = (await res.json()) as ErrorResponse;
        setError(errorData.error || 'Error en el servidor. Intenta de nuevo.');
      }
    } catch {
      setError('Error de red. Intenta de nuevo.');
    }
    setLoading(false);
  };

  // Submit; resolves to whether the data was saved
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    let saved = false;
    try {
      const method = isExisting ? 'PUT' : 'POST';
      const res = await fetch('/api/member', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, token: turnstileToken }),
      });

      if (res.ok) {
        const data = (await res.json()) as MemberResponse;
        saved = true;
        setSuccess(isExisting ? '¡Información actualizada!' : '¡Registro completo!');
        // Actualizar la información de registro
        if (data.createdAt && data.updatedAt) {
          setRegisterInfo({
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      } else {
        const errorData = (await res.json()) as ErrorResponse;
        setError(errorData.error || 'Error guardando los datos. Intenta de nuevo.');
      }
    } catch {
      setError('Error de red. Intenta de nuevo.');
    }
    setSubmitting(false);
    return saved;
  };

  // Step renderers
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <IdentificationStep
            documentID={formData.documentID}
            onChange={handleChange}
            onCheck={handleDocumentIDCheck}
            loading={loading}
            isExisting={isExisting}
            registerInfo={registerInfo}
            error={error}
            termsAccepted={formData.termsAccepted}
            turnstileToken={turnstileToken}
            onTurnstileChange={setTurnstileToken}
          />
        );
      case 1:
        return (
          <PersonalInfoStep
            formData={formData}
            onChange={handleChange}
            onNext={nextStep}
            onPrev={prevStep}
            onBlur={handleBlur}
          />
        );
      case 2:
        return (
          <ProfessionalInfoStep
            formData={formData}
            onChange={handleChange}
            onNext={nextStep}
            onPrev={prevStep}
            onBlur={handleBlur}
          />
        );
      case 3:
        return (
          <SkillsAndHealthStep
            formData={formData}
            onChange={handleChange}
            onNext={nextStep}
            onPrev={prevStep}
            onBlur={handleBlur}
          />
        );
      case 4:
        return (
          <MembershipInfoStep
            formData={formData}
            onChange={handleChange}
            onNext={nextStep}
            onPrev={prevStep}
            onBlur={handleBlur}
          />
        );
      case 5:
        return (
          <ChurchAndOtherInfoStep
            formData={formData}
            onChange={handleChange}
            onSubmit={async (e: React.FormEvent) => {
              // Stay on this step (which shows the error) unless the save worked
              if (await handleSubmit(e)) setStep(6);
            }}
            onPrev={prevStep}
            onBlur={handleBlur}
            submitting={submitting}
            isExisting={isExisting}
            success={success}
            error={error}
          />
        );
      case 6:
        return (
          <div className="flex flex-col items-center gap-5 py-6 text-center md:py-10">
            <span className="bg-warm-soft flex h-14 w-14 items-center justify-center rounded-full">
              <CircleCheck className="h-7 w-7" strokeWidth={1.5} />
            </span>
            <h2 className="text-[28px] leading-[1.15] md:text-[32px]">
              ¡Gracias por actualizar tu información!
            </h2>
            <p className="text-ink-soft max-w-xl text-base leading-relaxed md:text-lg">
              Tu registro ha sido guardado exitosamente.
              <br />
              Si tienes dudas o deseas actualizar algún dato, puedes volver a este formulario en
              cualquier momento.
            </p>
            <Link href="/" className={buttonVariants({ size: 'lg' })}>
              Volver al inicio
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  const showAutoSave = step < steps.length - 1 && formData.documentID && formData.termsAccepted;

  return (
    <main className="mx-auto flex w-full max-w-[880px] flex-col gap-8 px-5 pb-14 pt-8 md:px-8 md:pb-28 md:pt-14 lg:gap-10 xl:px-0">
      <div className="flex flex-col gap-3">
        <h1 className="text-[40px] leading-[1.04] lg:text-[48px] lg:leading-[1.1]">
          {isExisting ? 'Actualiza tus datos' : 'Regístrate como miembro'}
        </h1>
        <p className="text-ink-soft max-w-[640px] text-base leading-relaxed">
          &ldquo;Cada uno ponga al servicio de los demás el don que haya recibido, administrando
          fielmente la gracia de Dios en sus diversas formas.&rdquo; — 1 Pedro 4:10
        </p>
        <p className="text-ink-soft text-base">
          ¡Ayúdanos a conocerte mejor para servir juntos en la obra de Dios!
        </p>
        {(registerInfo || showAutoSave) && (
          <div className="text-ink-soft flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            {registerInfo && (
              <>
                <span>Fecha de creación: {formatDateVerbose(registerInfo.createdAt)}</span>
                <span>Última actualización: {formatDateVerbose(registerInfo.updatedAt)}</span>
              </>
            )}
            {showAutoSave && (
              <span aria-live="polite" className="flex items-center gap-2 md:ml-auto">
                {autoSaveStatus === 'saving' && 'Guardando...'}
                {autoSaveStatus === 'saved' && (
                  <>
                    <Check className="h-4 w-4" strokeWidth={1.5} />
                    Cambios guardados
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="flex items-center gap-1.5 text-[#b3261e]">
                    <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
                    Error al guardar
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {step < steps.length - 1 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-ink-soft flex justify-between gap-4 text-[13px] md:hidden">
            <span>
              Paso {step + 1} de {steps.length - 1}
            </span>
            {step < steps.length - 2 && <span>Sigue: {steps[step + 1]}</span>}
          </p>
          <ol className="grid grid-cols-6 gap-1 md:gap-2">
            {steps.slice(0, -1).map((label, idx) => (
              <li
                key={label}
                aria-current={idx === step ? 'step' : undefined}
                className="flex flex-col gap-2.5"
              >
                <div
                  className={`h-1 rounded-sm ${idx < step ? 'bg-ink' : idx === step ? 'bg-warm' : 'bg-line'}`}
                />
                <span
                  className={`sr-only items-center gap-1.5 text-[13px] leading-[1.3] md:not-sr-only md:flex ${idx === step ? 'font-semibold' : 'font-medium'} ${idx > step ? 'text-ink-soft' : ''}`}
                >
                  {idx < step ? (
                    <Check className="h-3.5 w-3.5 flex-none" strokeWidth={2} />
                  ) : (
                    `${idx + 1} · `
                  )}
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-line flex flex-col gap-8 rounded-2xl border bg-white p-5 md:p-10"
      >
        {renderStep()}
      </form>
    </main>
  );
}
