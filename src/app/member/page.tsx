'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import IdentificationStep from './components/IdentificationStep';
import PersonalInfoStep from './components/PersonalInfoStep';
import MembershipInfoStep from './components/MembershipInfoStep';
import ChurchInfoStep from './components/ChurchInfoStep';
import ProfessionalInfoStep from './components/ProfessionalInfoStep';
import SkillsStep from './components/SkillsStep';
import HealthStep from './components/HealthStep';
import OtherInfoStep from './components/OtherInfoStep';

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

const steps = [
  'Identification',
  'Personal Information',
  'Membership Information',
  'Church Information',
  'Professional & Education',
  'Skills & Abilities',
  'Health & Special Needs',
  'Other Information',
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

export default function MemberFormPage() {
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
          body: JSON.stringify(initialData),
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
        body: JSON.stringify(formData),
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
        `/api/member?documentID=${formData.documentID}&cf-turnstile-response=${turnstileToken}`
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
                  return [k, new Date(v).toISOString().split('T')[0]];
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

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const method = isExisting ? 'PUT' : 'POST';
      const res = await fetch('/api/member', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = (await res.json()) as MemberResponse;
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
          <MembershipInfoStep
            formData={formData}
            onChange={handleChange}
            onNext={nextStep}
            onPrev={prevStep}
            onBlur={handleBlur}
          />
        );
      case 3:
        return (
          <ChurchInfoStep
            formData={formData}
            onChange={handleChange}
            onNext={nextStep}
            onPrev={prevStep}
            onBlur={handleBlur}
          />
        );
      case 4:
        return (
          <ProfessionalInfoStep
            formData={formData}
            onChange={handleChange}
            onNext={nextStep}
            onPrev={prevStep}
            onBlur={handleBlur}
          />
        );
      case 5:
        return (
          <SkillsStep
            formData={formData}
            onChange={handleChange}
            onNext={nextStep}
            onPrev={prevStep}
            onBlur={handleBlur}
          />
        );
      case 6:
        return (
          <HealthStep
            formData={formData}
            onChange={handleChange}
            onNext={nextStep}
            onPrev={prevStep}
            onBlur={handleBlur}
          />
        );
      case 7:
        return (
          <OtherInfoStep
            formData={formData}
            onChange={handleChange}
            onSubmit={async (e) => {
              await handleSubmit(e);
              setStep(8);
            }}
            onPrev={prevStep}
            submitting={submitting}
            isExisting={isExisting}
            success={success}
            error={error}
            onBlur={handleBlur}
          />
        );
      case 8:
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <h2 className="text-2xl font-bold text-[#4b207f]">
              ¡Gracias por actualizar tu información!
            </h2>
            <p className="max-w-xl text-center text-lg text-[#5e3929]">
              Tu registro ha sido guardado exitosamente.
              <br />
              Si tienes dudas o deseas actualizar algún dato, puedes volver a este formulario en
              cualquier momento.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <Header />
      <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-8 rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-[#4b207f] md:text-4xl">
            {isExisting ? 'Actualiza tus datos' : 'Regístrate como miembro'}
          </h1>
          <p className="text-lg text-[#5e3929]">
            &ldquo;Cada uno ponga al servicio de los demás el don que haya recibido, administrando
            fielmente la gracia de Dios en sus diversas formas.&rdquo; - 1 Pedro 4:10
          </p>
          <p className="mt-4 text-lg text-[#5e3929]">
            ¡Ayúdanos a conocerte mejor para servir juntos en la obra de Dios!
          </p>
          {registerInfo && (
            <div className="mt-2 flex flex-col items-center">
              <div className="flex w-fit flex-col gap-1 rounded-lg bg-[#f3f0fa] px-4 py-2 text-sm text-[#4b207f] shadow-sm">
                <div className="whitespace-nowrap">
                  Fecha de creación: {formatDateVerbose(registerInfo.createdAt)}
                </div>
                <div className="whitespace-nowrap">
                  Última actualización: {formatDateVerbose(registerInfo.updatedAt)}
                </div>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {renderStep()}
        </form>
        {step < steps.length - 1 && (
          <div className="flex flex-col items-center justify-between">
            <div className="mt-4 flex justify-center gap-2">
              {steps.map((label, idx) => (
                <div
                  key={label}
                  className={`h-2 w-2 rounded-full ${step === idx ? 'bg-[#4b207f]' : 'bg-[#ede9f6]'}`}
                />
              ))}
            </div>
            {formData.documentID && formData.termsAccepted && (
              <div className="text-sm text-[#5e3929]">
                {autoSaveStatus === 'saving' && 'Guardando...'}
                {autoSaveStatus === 'saved' && 'Cambios guardados'}
                {autoSaveStatus === 'error' && 'Error al guardar'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
