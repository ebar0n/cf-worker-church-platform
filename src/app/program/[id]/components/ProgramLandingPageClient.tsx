'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronDown, X } from 'lucide-react';
import { Button, buttonVariants } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Program } from '@/app/types';
import { getDepartmentImage, getDepartmentName } from '@/lib/constants';

const STEP_LABELS = [
  'Documento del Niño',
  'Información del Niño',
  'Documentos de Responsables',
  'Información de Responsables',
  'Confirmación y Términos',
  'Inscripción Finalizada',
];

const LABEL_CLASS = 'mb-2 block text-sm font-medium text-ink';
const H2_CLASS = 'mb-6 text-[28px] leading-tight md:text-[32px]';
const H3_CLASS = 'mb-4 text-xl';
const SUBCARD_CLASS = 'rounded-2xl border border-line p-5';
// Kit "choice card": a radio row that turns warm-soft with an ink border when checked
const CHOICE_CLASS =
  'flex h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 text-base text-ink has-[:checked]:border-ink has-[:checked]:bg-warm-soft has-[:checked]:font-medium';

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="text-ink focus-visible:border-denim focus-visible:outline-denim/25 h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white pl-4 pr-11 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <ChevronDown
        className="text-ink-soft pointer-events-none absolute right-3.5 top-3.5 h-5 w-5"
        strokeWidth={1.5}
      />
    </div>
  );
}

interface Member {
  id: number;
  name: string;
  documentID: string;
  phone: string;
  email?: string;
  gender?: string;
  birthDate?: string;
  updatedAt: string;
}

interface Child {
  id: number;
  name: string;
  documentID: string;
  gender?: string;
  birthDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProgramLandingPageClient() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [searchingChild, setSearchingChild] = useState(false);
  const [captchaLoadTimeout, setCaptchaLoadTimeout] = useState(false);
  const [searchingGuardian, setSearchingGuardian] = useState(false);
  const [searchingFather, setSearchingFather] = useState(false);
  const [searchingMother, setSearchingMother] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childFound, setChildFound] = useState<Child | null>(null);
  const [guardianFound, setGuardianFound] = useState<Member | null>(null);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showGuardianForm, setShowGuardianForm] = useState(false);
  const [fatherFound, setFatherFound] = useState<Member | null>(null);
  const [motherFound, setMotherFound] = useState<Member | null>(null);

  // Turnstile widget state
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileRefFinal = useRef<HTMLDivElement>(null);
  const [siteKey, setSiteKey] = useState<string>('');
  const [widgetRendered, setWidgetRendered] = useState<boolean>(false);
  const [widgetRenderedFinal, setWidgetRenderedFinal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    // Child information
    childName: '',
    childDocumentID: '',
    childGender: '',
    childBirthDate: '',

    // Father information
    fatherName: '',
    fatherDocumentID: '',
    fatherPhone: '',
    fatherEmail: '',

    // Mother information
    motherName: '',
    motherDocumentID: '',
    motherPhone: '',
    motherEmail: '',

    // Guardian/Representative information (alternative to parents)
    guardianName: '',
    guardianDocumentID: '',
    guardianPhone: '',
    guardianEmail: '',
    relationship: 'guardian' as 'guardian' | 'representative',

    // Form type selection
    useGuardian: false, // false = use parents, true = use guardian

    // Privacy
    acceptPrivacy: false,
  });

  useEffect(() => {
    fetchProgram();
  }, [programId]);

  // Fetch Turnstile site key
  useEffect(() => {
    const fetchSiteKey = async () => {
      try {
        const response = await fetch('/api/turnstile-config');
        const data = (await response.json()) as { siteKey: string };
        if (data.siteKey) {
          setSiteKey(data.siteKey);
        } else {
          console.error('No site key received from API');
        }
      } catch (error) {
        console.error('Error fetching Turnstile site key:', error);
      }
    };

    fetchSiteKey();
  }, []);

  // Render Turnstile widget (only once)
  useEffect(() => {
    if (!siteKey || widgetRendered) {
      return;
    }

    // Set a timeout to detect if captcha doesn't load
    const timeoutId = setTimeout(() => {
      if (!widgetRendered) {
        console.log('Turnstile widget load timeout');
        setCaptchaLoadTimeout(true);
      }
    }, 10000); // 10 seconds timeout

    const renderWidget = () => {
      if (!turnstileRef.current || !window.turnstile) {
        console.log('Turnstile not ready, retrying...');
        setTimeout(renderWidget, 100);
        return;
      }

      try {
        console.log('Rendering Turnstile widget...');
        const widgetId = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            console.log('Turnstile verified successfully');
            handleTurnstileVerify(token);
          },
          'expired-callback': () => {
            console.log('Turnstile token expired');
            handleTurnstileExpire();
          },
          'error-callback': () => {
            console.log('Turnstile error occurred');
            handleTurnstileError();
          },
          appearance: 'always',
          theme: 'light',
          language: 'es',
        });

        console.log('Turnstile widget rendered with ID:', widgetId);
        setWidgetRendered(true);
        setCaptchaLoadTimeout(false); // Reset timeout when widget loads successfully
      } catch (error) {
        console.error('Error rendering Turnstile widget:', error);
        // Retry after a short delay
        setTimeout(renderWidget, 500);
      }
    };

    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      console.log('Loading Turnstile script...');
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('Turnstile script loaded successfully');
        renderWidget();
      };

      script.onerror = () => {
        console.error('Failed to load Turnstile script');
        // Retry loading the script
        setTimeout(() => {
          document.head.appendChild(script);
        }, 1000);
      };

      document.head.appendChild(script);
    } else {
      console.log('Turnstile script already loaded, rendering widget...');
      renderWidget();
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [siteKey, widgetRendered]);

  // Render Turnstile widget for final step
  useEffect(() => {
    if (!siteKey || widgetRenderedFinal || step !== 5) {
      return;
    }

    if (window.turnstile && turnstileRefFinal.current) {
      const widgetId = window.turnstile.render(turnstileRefFinal.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          handleTurnstileVerify(token);
        },
        'expired-callback': () => {
          console.log('Turnstile token expired');
          handleTurnstileExpire();
        },
        'error-callback': () => {
          console.log('Turnstile error occurred');
          handleTurnstileError();
        },
        appearance: 'always',
        theme: 'light',
        language: 'es',
      });
      setWidgetRenderedFinal(true);
    }
  }, [siteKey, widgetRenderedFinal, step]);

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/programs/${programId}`);
      if (!response.ok) {
        throw new Error('Program not found');
      }
      const programData = (await response.json()) as Program;
      setProgram(programData);
    } catch (error) {
      console.error('Error fetching program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const searchChild = async (documentID: string) => {
    if (!documentID.trim()) return;

    setSearchingChild(true);
    try {
      const response = await fetch('/api/children/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentID,
          token: turnstileToken,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string; code?: string };

        // Check if it's a Turnstile timeout or duplicate error
        if (handleTurnstileApiError(errorData)) {
          return;
        }

        throw new Error(errorData.error || 'Error al buscar niño/a');
      }

      const data = (await response.json()) as {
        found: boolean;
        child?: Child;
      };

      if (data.found && data.child) {
        setChildFound(data.child);
        setFormData((prev) => ({
          ...prev,
          childName: data.child!.name,
          childGender: data.child!.gender || '',
          childBirthDate: data.child!.birthDate
            ? new Date(data.child!.birthDate).toISOString().split('T')[0]
            : '',
        }));
      } else {
        // Child not found, will be registered automatically when form is submitted
        setChildFound(null);
        setFormData((prev) => ({
          ...prev,
          childName: '',
          childGender: '',
          childBirthDate: '',
        }));
      }
    } catch (error) {
      console.error('Error searching child:', error);
      setChildFound(null);
    } finally {
      setSearchingChild(false);
    }
  };

  const searchGuardian = async (documentID: string) => {
    if (!documentID.trim()) return;

    setSearchingGuardian(true);
    try {
      // Authorized by the form-pass cookie issued when the child search
      // verified the Turnstile token in step 1
      const response = await fetch('/api/members/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentID, token: turnstileToken }),
      });
      const data = (await response.json()) as {
        found: boolean;
        member?: Member;
      };

      if (response.ok && data.found && data.member) {
        setGuardianFound(data.member);
        setFormData((prev) => ({
          ...prev,
          guardianName: data.member!.name,
          guardianPhone: data.member!.phone,
          guardianEmail: data.member!.email || '',
        }));
        setShowGuardianForm(false);
      } else {
        setGuardianFound(null);
        setShowGuardianForm(true);
        setFormData((prev) => ({
          ...prev,
          guardianName: '',
          guardianPhone: '',
          guardianEmail: '',
        }));
      }
    } catch (error) {
      console.error('Error searching guardian:', error);
      setGuardianFound(null);
      setShowGuardianForm(true);
      setFormData((prev) => ({
        ...prev,
        guardianName: '',
        guardianPhone: '',
        guardianEmail: '',
      }));
    } finally {
      setSearchingGuardian(false);
    }
  };

  const searchFather = async (documentID: string) => {
    if (!documentID.trim()) return;

    setSearchingFather(true);
    try {
      const response = await fetch('/api/members/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentID, token: turnstileToken }),
      });
      const data = (await response.json()) as {
        found: boolean;
        member?: Member;
      };

      if (response.ok && data.found && data.member) {
        setFatherFound(data.member);
        setFormData((prev) => ({
          ...prev,
          fatherName: data.member!.name,
          fatherPhone: data.member!.phone,
          fatherEmail: data.member!.email || '',
        }));
      } else {
        setFatherFound(null);
        setFormData((prev) => ({
          ...prev,
          fatherName: '',
          fatherPhone: '',
          fatherEmail: '',
        }));
      }
    } catch (error) {
      console.error('Error searching father:', error);
      setFatherFound(null);
      setFormData((prev) => ({
        ...prev,
        fatherName: '',
        fatherPhone: '',
        fatherEmail: '',
      }));
    } finally {
      setSearchingFather(false);
    }
  };

  const searchMother = async (documentID: string) => {
    if (!documentID.trim()) return;

    setSearchingMother(true);
    try {
      const response = await fetch('/api/members/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentID, token: turnstileToken }),
      });
      const data = (await response.json()) as {
        found: boolean;
        member?: Member;
      };

      if (response.ok && data.found && data.member) {
        setMotherFound(data.member);
        setFormData((prev) => ({
          ...prev,
          motherName: data.member!.name,
          motherPhone: data.member!.phone,
          motherEmail: data.member!.email || '',
        }));
      } else {
        setMotherFound(null);
        setFormData((prev) => ({
          ...prev,
          motherName: '',
          motherPhone: '',
          motherEmail: '',
        }));
      }
    } catch (error) {
      console.error('Error searching mother:', error);
      setMotherFound(null);
      setFormData((prev) => ({
        ...prev,
        motherName: '',
        motherPhone: '',
        motherEmail: '',
      }));
    } finally {
      setSearchingMother(false);
    }
  };

  const handleChildDocumentChange = (documentID: string) => {
    handleInputChange('childDocumentID', documentID);
    // Reset child search state when document changes
    setChildFound(null);
  };

  const handleGuardianDocumentChange = (documentID: string) => {
    handleInputChange('guardianDocumentID', documentID);
    // Reset guardian search state when document changes
    setGuardianFound(null);
    setShowGuardianForm(false);
  };

  const handleFatherDocumentChange = (documentID: string) => {
    handleInputChange('fatherDocumentID', documentID);
    // Reset father search state when document changes
    setFatherFound(null);
  };

  const handleMotherDocumentChange = (documentID: string) => {
    handleInputChange('motherDocumentID', documentID);
    // Reset mother search state when document changes
    setMotherFound(null);
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
  };

  const handleTurnstileError = () => {
    setTurnstileToken('');
    alert('Error en la verificación. Por favor, intenta de nuevo.');
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken('');
  };

  // Function to reset Turnstile widget if needed
  const resetTurnstileWidget = () => {
    setWidgetRendered(false);
    setTurnstileToken('');

    // Clear the appropriate widget container based on current step
    const currentRef = step === 5 ? turnstileRefFinal.current : turnstileRef.current;
    if (currentRef) {
      currentRef.innerHTML = '';
    }

    // Force re-render after a short delay
    setTimeout(() => {
      if (siteKey && currentRef && window.turnstile) {
        try {
          const widgetId = window.turnstile.render(currentRef, {
            sitekey: siteKey,
            callback: (token: string) => {
              handleTurnstileVerify(token);
            },
            'expired-callback': () => {
              handleTurnstileExpire();
            },
            'error-callback': () => {
              handleTurnstileError();
            },
            appearance: 'always',
            theme: 'light',
            language: 'es',
          });
          setWidgetRendered(true);
        } catch (error) {
          console.error('Error re-rendering Turnstile widget:', error);
        }
      }
    }, 200);
  };

  // Helper function to show errors
  const showError = (message: string) => {
    setError(message);
    // Auto-clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  // Helper function to clear errors
  const clearError = () => {
    setError(null);
  };

  // Helper function to handle Turnstile errors consistently
  const handleTurnstileApiError = (errorData: { error?: string; code?: string }) => {
    if (errorData.code === 'TURNSTILE_TIMEOUT_OR_DUPLICATE') {
      resetTurnstileWidget();
      showError(
        'La verificación de seguridad ha expirado. Por favor, completa la verificación nuevamente.'
      );
      return true; // Indicates that the error was handled
    }

    // Also check if the error message contains the specific text
    if (errorData.error?.includes('timeout-or-duplicate')) {
      resetTurnstileWidget();
      showError(
        'La verificación de seguridad ha expirado. Por favor, completa la verificación nuevamente.'
      );
      return true; // Indicates that the error was handled
    }

    return false; // Indicates that the error was not handled
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 5) {
      setStep(step + 1);
      return;
    }

    if (!formData.acceptPrivacy) {
      showError('Debes aceptar la política de privacidad.');
      return;
    }

    if (!turnstileToken) {
      showError('Por favor, completa la verificación de seguridad antes de enviar.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update member data if they were found and modified
      const updatePromises = [];

      // Update father if found and data was modified
      if (
        fatherFound &&
        (formData.fatherName !== fatherFound.name || formData.fatherPhone !== fatherFound.phone)
      ) {
        updatePromises.push(
          fetch('/api/member', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentID: formData.fatherDocumentID,
              name: formData.fatherName,
              phone: formData.fatherPhone,
            }),
          })
        );
      }

      // Update mother if found and data was modified
      if (
        motherFound &&
        (formData.motherName !== motherFound.name || formData.motherPhone !== motherFound.phone)
      ) {
        updatePromises.push(
          fetch('/api/member', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentID: formData.motherDocumentID,
              name: formData.motherName,
              phone: formData.motherPhone,
            }),
          })
        );
      }

      // Update guardian if found and data was modified
      if (
        guardianFound &&
        (formData.guardianName !== guardianFound.name ||
          formData.guardianPhone !== guardianFound.phone)
      ) {
        updatePromises.push(
          fetch('/api/member', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentID: formData.guardianDocumentID,
              name: formData.guardianName,
              phone: formData.guardianPhone,
            }),
          })
        );
      }

      // Wait for all member updates to complete
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      // Create enrollment
      const response = await fetch('/api/enrollments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programId: parseInt(programId),
          token: turnstileToken,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string; code?: string };

        // Check if it's a Turnstile timeout or duplicate error
        if (handleTurnstileApiError(errorData)) {
          return;
        }

        throw new Error(errorData.error || 'Error al enviar la inscripción');
      }

      const result = await response.json();
      setEnrollmentSuccess(true);
      setStep(6); // Go to success step
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      showError(error instanceof Error ? error.message : 'Error al enviar la inscripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      // Validate Turnstile token before searching
      if (!turnstileToken) {
        showError('Por favor, completa la verificación de seguridad antes de continuar.');
        return;
      }

      // Search for child when moving from step 1 to step 2
      if (formData.childDocumentID.trim()) {
        await searchChild(formData.childDocumentID);
      }
    } else if (step === 2) {
      // Validate all child fields are required
      if (!formData.childName.trim()) {
        showError('Por favor, ingresa el nombre del niño(a).');
        return;
      }
      if (!formData.childGender) {
        showError('Por favor, selecciona el género del niño(a).');
        return;
      }
      if (!formData.childBirthDate) {
        showError('Por favor, ingresa la fecha de nacimiento del niño(a).');
        return;
      }
    } else if (step === 3) {
      if (formData.useGuardian) {
        // Search for guardian only if guardian mode is selected
        if (formData.guardianDocumentID.trim()) {
          await searchGuardian(formData.guardianDocumentID);
        }
      } else {
        // Search for both parents automatically
        if (formData.fatherDocumentID.trim()) {
          await searchFather(formData.fatherDocumentID);
        }
        if (formData.motherDocumentID.trim()) {
          await searchMother(formData.motherDocumentID);
        }
      }
    }

    if (step < 6) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (loading) {
    return (
      <div className="bg-paper flex min-h-screen items-center justify-center">
        <div className="text-ink-soft text-lg">Cargando programa...</div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="bg-paper flex min-h-screen items-center justify-center">
        <div className="text-lg text-[#b3261e]">Programa no encontrado</div>
      </div>
    );
  }

  if (!program.isActive) {
    return (
      <div className="bg-paper flex min-h-screen items-center justify-center px-5">
        <div className="text-center">
          <h1 className="mb-4 text-[40px] leading-[1.04]">Programa No Disponible</h1>
          <p className="text-ink-soft">
            Este programa no está disponible para inscripciones en este momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-screen">
      <div className="mx-auto w-full max-w-[880px] px-5 py-10 md:px-8 lg:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5">
          <span className="border-line inline-flex items-center gap-2 self-start rounded-full border bg-white px-3 py-1.5 text-[13px] font-medium">
            <img
              src={getDepartmentImage(program.department)}
              alt={`Logo ${getDepartmentName(program.department)}`}
              className="h-6 w-6 object-contain grayscale"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            {getDepartmentName(program.department)}
          </span>

          <h1 className="text-[40px] leading-[1.04] lg:text-[56px]">{program.title}</h1>
          <p className="text-ink-soft max-w-[640px] text-lg leading-relaxed">
            ¡Únete a esta increíble aventura! Completa el formulario para inscribir a tu hijo/a.
          </p>

          {/* Program Content */}
          {program.content && (
            <div className="border-line rounded-2xl border bg-white p-6 md:p-8">
              <h3 className="mb-3 text-2xl">Detalles</h3>
              <div className="whitespace-pre-wrap text-base leading-[1.7]">{program.content}</div>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex flex-col gap-2.5">
          <p className="text-ink-soft text-[13px] md:hidden">
            Paso {step} de 6: {STEP_LABELS[step - 1]}
          </p>
          <ol className="grid grid-cols-6 gap-1 md:gap-2">
            {STEP_LABELS.map((label, index) => {
              const stepNumber = index + 1;
              return (
                <li key={label} className="flex flex-col gap-2.5">
                  <div
                    className={`h-1 rounded-sm ${
                      stepNumber < step ? 'bg-ink' : stepNumber === step ? 'bg-warm' : 'bg-line'
                    }`}
                  />
                  <div
                    className={`hidden items-start gap-1.5 text-[13px] leading-snug md:flex ${
                      stepNumber === step
                        ? 'text-ink font-semibold'
                        : stepNumber < step
                          ? 'text-ink font-medium'
                          : 'text-ink-soft font-medium'
                    }`}
                  >
                    {stepNumber < step ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    ) : (
                      `${stepNumber} · `
                    )}
                    {label}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Form */}
        <div>
          <form
            onSubmit={handleSubmit}
            className="border-line rounded-2xl border bg-white p-6 md:p-10"
          >
            {/* Step 1: Child Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className={H2_CLASS}>Documento del Niño/a</h2>

                <div>
                  <label className={LABEL_CLASS}>
                    Número del Registro Civil <span className="text-[#b3261e]">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.childDocumentID}
                    onChange={(e) => handleChildDocumentChange(e.target.value)}
                    required
                    placeholder="Ej: 12345678"
                  />
                </div>

                {/* Turnstile Widget - Only shown in step 1 but valid for entire form */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div
                      ref={turnstileRef}
                      id="turnstile-widget-container"
                      className="turnstile-widget"
                      style={{
                        minHeight: '65px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    ></div>
                  </div>

                  {turnstileToken && (
                    <div className="text-center text-sm text-green-700">
                      ✓ Verificación completada
                    </div>
                  )}

                  {siteKey && (!widgetRendered || captchaLoadTimeout) && (
                    <div className="text-center">
                      <p className="text-ink-soft mb-2 text-sm">
                        {captchaLoadTimeout
                          ? "El captcha no se cargó. Haz clic en 'Reintentar' para solucionarlo."
                          : "Si el captcha no aparece, haz clic en 'Reintentar'"}
                      </p>
                      <button
                        type="button"
                        onClick={resetTurnstileWidget}
                        className="text-denim hover:text-ink text-sm underline"
                      >
                        Reintentar captcha
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Child Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className={H2_CLASS}>Información del Niño/a</h2>

                {childFound && (
                  <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                    <p className="text-sm text-green-800">
                      ✓ Niño(a) encontrado: <strong>{childFound.name}</strong>
                    </p>
                    <p className="mt-1 text-xs text-green-700">
                      Los datos se autocompletaron desde el registro. Puedes editarlos si es
                      necesario.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>
                      Nombre Completo <span className="text-[#b3261e]">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.childName}
                      onChange={(e) => handleInputChange('childName', e.target.value)}
                      required
                      placeholder="Ej: Juan Carlos Pérez"
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLASS}>Género *</label>
                    <Select
                      value={formData.childGender}
                      onChange={(e) => handleInputChange('childGender', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar género</option>
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Fecha de Nacimiento <span className="text-[#b3261e]">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.childBirthDate}
                    onChange={(e) => handleInputChange('childBirthDate', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 3: Documents of Parents or Guardian */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className={H2_CLASS}>Documentos de los Responsables</h2>

                {/* Form Type Selection */}
                <div className="space-y-4">
                  <label className="text-ink block text-sm font-medium">
                    Tipo de Responsable <span className="text-[#b3261e]">*</span>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={CHOICE_CLASS}>
                      <input
                        type="radio"
                        name="useGuardian"
                        value="false"
                        checked={!formData.useGuardian}
                        onChange={() => handleInputChange('useGuardian', false)}
                        className="accent-ink h-5 w-5 shrink-0"
                      />
                      <span>Padres (Padre y Madre)</span>
                    </label>
                    <label className={CHOICE_CLASS}>
                      <input
                        type="radio"
                        name="useGuardian"
                        value="true"
                        checked={formData.useGuardian}
                        onChange={() => handleInputChange('useGuardian', true)}
                        className="accent-ink h-5 w-5 shrink-0"
                      />
                      <span>Tutor/Representante</span>
                    </label>
                  </div>
                </div>

                {/* Parents Documents */}
                {!formData.useGuardian && (
                  <div className="space-y-6">
                    {/* Father Document */}
                    <div className={SUBCARD_CLASS}>
                      <h3 className={H3_CLASS}>Documento del Padre</h3>

                      <div>
                        <label className={LABEL_CLASS}>Número de Documento</label>
                        <Input
                          type="text"
                          value={formData.fatherDocumentID}
                          onChange={(e) => handleFatherDocumentChange(e.target.value)}
                          placeholder="Ej: 87654321"
                        />
                        {fatherFound && (
                          <div className="mt-2 rounded-xl border border-green-200 bg-green-50 p-3">
                            <p className="text-sm text-green-800">
                              ✓ Padre encontrado: <strong>{fatherFound.name}</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mother Document */}
                    <div className={SUBCARD_CLASS}>
                      <h3 className={H3_CLASS}>Documento de la Madre</h3>

                      <div>
                        <label className={LABEL_CLASS}>Número de Documento</label>
                        <Input
                          type="text"
                          value={formData.motherDocumentID}
                          onChange={(e) => handleMotherDocumentChange(e.target.value)}
                          placeholder="Ej: 12345678"
                        />
                        {motherFound && (
                          <div className="mt-2 rounded-xl border border-green-200 bg-green-50 p-3">
                            <p className="text-sm text-green-800">
                              ✓ Madre encontrada: <strong>{motherFound.name}</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Guardian Document */}
                {formData.useGuardian && (
                  <div className="space-y-6">
                    <div className={SUBCARD_CLASS}>
                      <h3 className={H3_CLASS}>Documento del Tutor/Representante</h3>

                      <div>
                        <label className={LABEL_CLASS}>
                          Número de Documento <span className="text-[#b3261e]">*</span>
                        </label>
                        <Input
                          type="text"
                          value={formData.guardianDocumentID}
                          onChange={(e) => handleGuardianDocumentChange(e.target.value)}
                          required
                          placeholder="Ej: 87654321"
                          disabled={searchingGuardian}
                        />
                        {searchingGuardian && (
                          <p className="text-ink-soft mt-1 text-sm">Buscando tutor...</p>
                        )}
                        {guardianFound && (
                          <div className="mt-2 rounded-xl border border-green-200 bg-green-50 p-3">
                            <p className="text-sm text-green-800">
                              ✓ Tutor encontrado: <strong>{guardianFound.name}</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Information of Parents or Guardian */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className={H2_CLASS}>Información de los Responsables</h2>

                {/* Form Type Selection */}
                <div className="space-y-4">
                  <label className="text-ink block text-sm font-medium">
                    Tipo de Responsable <span className="text-[#b3261e]">*</span>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={CHOICE_CLASS}>
                      <input
                        type="radio"
                        name="useGuardian"
                        value="false"
                        checked={!formData.useGuardian}
                        onChange={() => handleInputChange('useGuardian', false)}
                        className="accent-ink h-5 w-5 shrink-0"
                      />
                      <span>Padres (Padre y Madre)</span>
                    </label>
                    <label className={CHOICE_CLASS}>
                      <input
                        type="radio"
                        name="useGuardian"
                        value="true"
                        checked={formData.useGuardian}
                        onChange={() => handleInputChange('useGuardian', true)}
                        className="accent-ink h-5 w-5 shrink-0"
                      />
                      <span>Tutor/Representante</span>
                    </label>
                  </div>
                </div>

                {/* Parents Information */}
                {!formData.useGuardian && (
                  <div className="space-y-6">
                    {/* Father Information */}
                    <div className={SUBCARD_CLASS}>
                      <h3 className={H3_CLASS}>Información del Padre</h3>

                      {fatherFound && (
                        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                          <p className="text-sm text-green-800">
                            ✓ Padre encontrado: <strong>{fatherFound.name}</strong>
                          </p>
                          <p className="mt-1 text-xs text-green-700">
                            Los datos se autocompletaron desde el registro de miembros. Puedes
                            editarlos si es necesario.
                          </p>
                          <p className="text-ink-soft mt-1 text-xs">
                            Última actualización:{' '}
                            {new Date(fatherFound.updatedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Nombre Completo</label>
                          <Input
                            type="text"
                            value={formData.fatherName}
                            onChange={(e) => handleInputChange('fatherName', e.target.value)}
                            placeholder="Ej: Juan Pérez"
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Teléfono</label>
                          <Input
                            type="tel"
                            value={formData.fatherPhone}
                            onChange={(e) => handleInputChange('fatherPhone', e.target.value)}
                            placeholder="Ej: 3001234567"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mother Information */}
                    <div className={SUBCARD_CLASS}>
                      <h3 className={H3_CLASS}>Información de la Madre</h3>

                      {motherFound && (
                        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                          <p className="text-sm text-green-800">
                            ✓ Madre encontrada: <strong>{motherFound.name}</strong>
                          </p>
                          <p className="mt-1 text-xs text-green-700">
                            Los datos se autocompletaron desde el registro de miembros. Puedes
                            editarlos si es necesario.
                          </p>
                          <p className="text-ink-soft mt-1 text-xs">
                            Última actualización:{' '}
                            {new Date(motherFound.updatedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Nombre Completo</label>
                          <Input
                            type="text"
                            value={formData.motherName}
                            onChange={(e) => handleInputChange('motherName', e.target.value)}
                            placeholder="Ej: María González"
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Teléfono</label>
                          <Input
                            type="tel"
                            value={formData.motherPhone}
                            onChange={(e) => handleInputChange('motherPhone', e.target.value)}
                            placeholder="Ej: 3008765432"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Guardian/Representative Information */}
                {formData.useGuardian && (
                  <div className="space-y-6">
                    <div className={SUBCARD_CLASS}>
                      <h3 className={H3_CLASS}>Información del Tutor/Representante</h3>

                      {guardianFound && (
                        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                          <p className="text-sm text-green-800">
                            ✓ Tutor encontrado: <strong>{guardianFound.name}</strong>
                          </p>
                          <p className="mt-1 text-xs text-green-700">
                            Los datos se autocompletaron desde el registro de miembros. Puedes
                            editarlos si es necesario.
                          </p>
                          <p className="text-ink-soft mt-1 text-xs">
                            Última actualización:{' '}
                            {new Date(guardianFound.updatedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>
                            Nombre Completo <span className="text-[#b3261e]">*</span>
                          </label>
                          <Input
                            type="text"
                            value={formData.guardianName}
                            onChange={(e) => handleInputChange('guardianName', e.target.value)}
                            required
                            placeholder="Ej: Carlos Rodríguez"
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>
                            Teléfono <span className="text-[#b3261e]">*</span>
                          </label>
                          <Input
                            type="tel"
                            value={formData.guardianPhone}
                            onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                            required
                            placeholder="Ej: 3001234567"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className={LABEL_CLASS}>
                          Tipo de Relación <span className="text-[#b3261e]">*</span>
                        </label>
                        <Select
                          value={formData.relationship}
                          onChange={(e) => handleInputChange('relationship', e.target.value)}
                          required
                        >
                          <option value="guardian">Tutor Legal</option>
                          <option value="representative">Representante</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Confirmation and Terms */}
            {step === 5 && (
              <div className="space-y-6">
                <h2 className={H2_CLASS}>Confirmación y Términos</h2>

                {/* Summary */}
                <div className="border-line bg-paper space-y-4 rounded-2xl border p-6">
                  <h3 className="text-xl">Resumen de la Inscripción</h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-ink font-sans text-sm font-semibold">Niño/a:</h4>
                      <p className="text-ink-soft">{formData.childName}</p>
                      <p className="text-ink-soft">Doc: {formData.childDocumentID}</p>
                      {childFound && (
                        <p className="text-xs text-green-700">✓ Registrado en la base de datos</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-ink font-sans text-sm font-semibold">
                        {formData.useGuardian ? 'Tutor/Representante:' : 'Responsables:'}
                      </h4>
                      {formData.useGuardian ? (
                        <>
                          <p className="text-ink-soft">{formData.guardianName}</p>
                          <p className="text-ink-soft">Tel: {formData.guardianPhone}</p>
                          {guardianFound && (
                            <p className="text-xs text-green-700">✓ Miembro registrado</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-ink-soft">Padre: {formData.fatherName}</p>
                          {fatherFound && (
                            <p className="text-xs text-green-700">✓ Miembro registrado</p>
                          )}
                          <p className="text-ink-soft">Madre: {formData.motherName}</p>
                          {motherFound && (
                            <p className="text-xs text-green-700">✓ Miembro registrada</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-line border-t pt-4">
                    <h4 className="text-ink mb-3 font-sans text-sm font-semibold">Programa:</h4>
                    <div className="flex items-center space-x-3">
                      <img
                        src={getDepartmentImage(program.department)}
                        alt={`Logo ${getDepartmentName(program.department)}`}
                        className="h-12 w-12 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div>
                        <p className="text-ink font-medium">{program.title}</p>
                        <p className="text-ink-soft text-sm">
                          {getDepartmentName(program.department)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onCheckedChange={(checked) =>
                        handleInputChange('acceptPrivacy', checked as boolean)
                      }
                      required
                    />
                    <label htmlFor="acceptPrivacy" className="text-ink text-[15px]">
                      Acepto el{' '}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-denim hover:text-ink underline"
                      >
                        tratamiento de mis datos personales según la política de privacidad
                      </a>{' '}
                      <span className="text-[#b3261e]">*</span>
                    </label>
                  </div>
                </div>

                {/* Final Turnstile Verification */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div
                      ref={turnstileRefFinal}
                      id="turnstile-widget-container-final"
                      className="turnstile-widget"
                      style={{
                        minHeight: '65px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    ></div>
                  </div>
                  {turnstileToken && (
                    <div className="text-center text-sm text-green-700">
                      ✓ Verificación completada
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Enrollment Success */}
            {step === 6 && enrollmentSuccess && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="bg-warm-soft flex h-16 w-16 items-center justify-center rounded-full">
                      <Check className="text-ink h-8 w-8" strokeWidth={1.5} />
                    </div>
                  </div>

                  <h2 className="mb-4 text-[32px] leading-tight md:text-[40px]">
                    ¡Inscripción Completada!
                  </h2>

                  <p className="text-ink-soft mb-8 text-lg">
                    La inscripción de <strong className="text-ink">{formData.childName}</strong> al
                    programa <strong className="text-ink">{program.title}</strong> ha sido
                    registrada exitosamente.
                  </p>

                  <div className="bg-warm-soft rounded-2xl p-6 md:p-8">
                    <h3 className="mb-3 text-2xl">¿Eres miembro de la iglesia?</h3>
                    <p className="text-ink-soft mb-6">
                      Te invitamos a actualizar tu información en nuestro registro de miembros para
                      mantenernos conectados y poder servirte mejor.
                    </p>
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                      <a href="/member" className={buttonVariants({ variant: 'dark', size: 'lg' })}>
                        Actualizar mis datos
                      </a>
                      <a href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                        Volver al inicio
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 6 && (
              <div className="border-line mt-8 flex gap-3 border-t pt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={prevStep}
                    disabled={isSubmitting}
                    className="max-sm:px-4"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                    <span className="max-sm:sr-only">Anterior</span>
                  </Button>
                )}

                <div className="ml-auto max-sm:flex-1">
                  {step < 5 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={
                        isSubmitting ||
                        (step === 1 && (!formData.childDocumentID || !turnstileToken)) ||
                        (step === 2 && !formData.childName) ||
                        (step === 3 && formData.useGuardian && !formData.guardianDocumentID) ||
                        (step === 3 &&
                          !formData.useGuardian &&
                          (!formData.fatherDocumentID || !formData.motherDocumentID)) ||
                        (step === 4 &&
                          formData.useGuardian &&
                          (!formData.guardianName || !formData.guardianPhone)) ||
                        (step === 4 &&
                          !formData.useGuardian &&
                          (!formData.fatherName ||
                            !formData.fatherPhone ||
                            !formData.motherName ||
                            !formData.motherPhone))
                      }
                      size="lg"
                      className="max-sm:w-full"
                    >
                      {(step === 1 && searchingChild) ||
                      (step === 3 && (searchingFather || searchingMother || searchingGuardian))
                        ? 'Buscando...'
                        : step === 4
                          ? 'Revisar'
                          : 'Siguiente'}
                      <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || !turnstileToken || !formData.acceptPrivacy}
                      size="lg"
                      className="max-sm:w-full"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Inscripción'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="border-line mt-4 flex items-start gap-3 rounded-xl border bg-white p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#b3261e]" strokeWidth={1.5} />
                <p className="flex-1 text-[15px] text-[#b3261e]">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  aria-label="Cerrar mensaje"
                  className="text-ink-soft hover:text-ink"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
