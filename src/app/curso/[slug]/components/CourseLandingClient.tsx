'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Course } from '@/app/types';
import { calculateAge as calculateAgeAt, parseDateOnly } from '@/lib/age-classification';
import ReactMarkdown from 'react-markdown';

interface CourseWithMeta extends Course {
  enrollmentCount: number;
  memberCount: number;
  nonMemberCount: number;
  memberQuota: number | null;
  nonMemberQuota: number | null;
  memberSpotsLeft: number | null;
  nonMemberSpotsLeft: number | null;
  isFull: boolean;
}

interface ExistingEnrollment {
  id: number;
  fullName: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}

// Bank account data - update with real values
const BANK_ACCOUNT = {
  bank: 'Bancolombia',
  accountType: 'Cuenta de Ahorros',
  accountNumber: '872-321924-35',
  accountHolder: 'Iglesia Adventista El Jordán',
  nit: '900.067.540',
  contactPhone: '3153455511', // WhatsApp contact number
  contactName: 'Tesorería',
};

export default function CourseLandingClient() {
  const params = useParams();
  const slug = params.slug as string;

  const [course, setCourse] = useState<CourseWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'initial' | 'status' | 'form'>('initial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState<ExistingEnrollment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Turnstile
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [siteKey, setSiteKey] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [widgetRendered, setWidgetRendered] = useState(false);

  // Payment proof state (file is uploaded together with the form on submit)
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofIsPdf, setProofIsPdf] = useState(false);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    documentNumber: '',
    fullName: '',
    phone: '',
    birthDate: '',
    isMember: false,
    acceptPrivacy: false,
  });

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${slug}`);
        if (!response.ok) throw new Error('Course not found');
        const data = (await response.json()) as CourseWithMeta;
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadSiteKey = async () => {
      try {
        const response = await fetch('/api/turnstile-config');
        const data = (await response.json()) as { siteKey: string };
        if (data.siteKey) setSiteKey(data.siteKey);
      } catch (error) {
        console.error('Error fetching Turnstile site key:', error);
      }
    };

    loadCourse();
    loadSiteKey();
  }, [slug]);

  // Render Turnstile widget when form is shown
  useEffect(() => {
    if (!siteKey || step !== 'form' || widgetRendered) return;

    const renderWidget = () => {
      if (!turnstileRef.current || !window.turnstile) {
        setTimeout(renderWidget, 100);
        return;
      }

      try {
        window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'expired-callback': () => {
            setTurnstileToken('');
          },
          'error-callback': () => {
            setTurnstileToken('');
          },
          appearance: 'always',
          theme: 'light',
          language: 'es',
        });
        setWidgetRendered(true);
      } catch (error) {
        console.error('Error rendering Turnstile:', error);
        setTimeout(renderWidget, 500);
      }
    };

    // Load script if not loaded
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }
  }, [siteKey, step, widgetRendered]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const checkEnrollmentAndProceed = async () => {
    if (!formData.documentNumber.trim()) {
      setError('Por favor, ingresa tu número de documento');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${slug}/check-enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentNumber: formData.documentNumber }),
      });

      const data = (await response.json()) as {
        error?: string;
        found?: boolean;
        enrollment?: ExistingEnrollment;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar');
      }

      if (data.found && data.enrollment) {
        setExistingEnrollment(data.enrollment);
        setStep('status');
      } else {
        setStep('form');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al verificar');
    } finally {
      setIsChecking(false);
    }
  };

  const MAX_PROOF_SIZE = 10 * 1024 * 1024; // 10MB, matches server-side limit

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_PROOF_SIZE) {
        setProofError('El archivo es demasiado grande. El tamaño máximo es 10MB.');
        setProofFile(null);
        setProofPreview(null);
        setProofIsPdf(false);
        setProofFileName(null);
        return;
      }
      const isPdf = file.type === 'application/pdf';
      const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');
      setProofIsPdf(isPdf || isHeic); // Treat HEIC like PDF (no browser preview support)
      setProofFileName(file.name);
      setProofError(null);

      if (isPdf || isHeic) {
        // For PDF and HEIC, just set a placeholder - browsers can't preview these
        setProofPreview('pdf');
      } else {
        // For images, create preview
        const reader = new FileReader();
        reader.onloadend = () => setProofPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
      setProofFile(file);
    }
  };

  const resetTurnstile = () => {
    setWidgetRendered(false);
    setTurnstileToken('');
    if (turnstileRef.current) {
      turnstileRef.current.innerHTML = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.acceptPrivacy) {
      setError('Debes aceptar la política de privacidad');
      return;
    }

    if (!turnstileToken) {
      setError('Por favor, completa la verificación de seguridad');
      return;
    }

    if (course && course.cost > 0 && !proofFile) {
      setError('Por favor, sube el comprobante de pago');
      return;
    }

    // Validate age (must be 18+)
    if (formData.birthDate) {
      const age = calculateAge(formData.birthDate);
      if (age < 18) {
        setError('Debes ser mayor de 18 años para inscribirte en este curso');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Multipart: the payment proof travels with the form so a single
      // Turnstile verification covers both
      const submitData = new FormData();
      submitData.append('token', turnstileToken);
      submitData.append('documentNumber', formData.documentNumber);
      submitData.append('fullName', formData.fullName);
      submitData.append('phone', formData.phone);
      submitData.append('birthDate', formData.birthDate);
      submitData.append('isMember', String(formData.isMember));
      if (proofFile) {
        submitData.append('paymentProof', proofFile);
      }

      const response = await fetch(`/api/courses/${slug}/enroll`, {
        method: 'POST',
        body: submitData,
      });

      const data = (await response.json()) as { error?: string; code?: string };

      if (!response.ok) {
        if (data.code === 'TURNSTILE_TIMEOUT_OR_DUPLICATE') {
          resetTurnstile();
        }
        throw new Error(data.error || 'Error al procesar la inscripción');
      }

      setEnrollmentSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al enviar la inscripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (birthDate: string): number =>
    calculateAgeAt(parseDateOnly(birthDate), new Date());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return null;
    return parseDateOnly(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusInfo = (status: 'pending' | 'confirmed' | 'rejected') => {
    const statusMap = {
      pending: {
        label: 'Pendiente',
        tone: 'bg-warm-soft text-ink',
        icon: <Clock className="h-7 w-7" strokeWidth={1.5} />,
        message: 'Tu inscripción está siendo revisada. Te contactaremos pronto por WhatsApp.',
      },
      confirmed: {
        label: 'Confirmado',
        tone: 'bg-green-50 text-green-800',
        icon: <CircleCheck className="h-7 w-7" strokeWidth={1.5} />,
        message: '¡Tu inscripción ha sido confirmada! Nos vemos en el curso.',
      },
      rejected: {
        label: 'No aprobado',
        tone: 'bg-red-50 text-[#b3261e]',
        icon: <CircleX className="h-7 w-7" strokeWidth={1.5} />,
        message: 'Tu inscripción no fue aprobada. Por favor, contáctanos para más información.',
      },
    };
    return statusMap[status];
  };

  const resetForm = () => {
    setStep('initial');
    setExistingEnrollment(null);
    setFormData({
      documentNumber: '',
      fullName: '',
      phone: '',
      birthDate: '',
      isMember: false,
      acceptPrivacy: false,
    });
    setProofFile(null);
    setProofPreview(null);
    setProofIsPdf(false);
    setProofFileName(null);
    setWidgetRendered(false);
    setTurnstileToken('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5">
        <div className="text-center">
          <div className="border-line border-t-ink mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4"></div>
          <p className="text-ink-soft">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-14">
        <div className="text-center">
          <h1 className="mb-3 text-[40px] leading-[1.04]">Curso No Encontrado</h1>
          <p className="text-ink-soft mb-6">El curso que buscas no está disponible.</p>
          <a href="/" className={buttonVariants({ size: 'lg' })}>
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  if (!course.isActive) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-14">
        <div className="text-center">
          <h1 className="mb-3 text-[40px] leading-[1.04]">Curso No Disponible</h1>
          <p className="text-ink-soft">Este curso no está disponible para inscripciones.</p>
        </div>
      </div>
    );
  }

  // Success screen
  if (enrollmentSuccess) {
    return (
      <div className="mx-auto w-full max-w-lg px-5 py-14 lg:py-24">
        <div className="border-line rounded-2xl border bg-white p-6 text-center sm:p-8">
          <div className="mb-6 flex justify-center">
            {/* course.color is admin content: only the icon tint, never UI chrome */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${course.color}20` }}
            >
              <Check className="h-8 w-8" style={{ color: course.color }} strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="mb-2 text-[32px] leading-[1.1] md:text-[40px]">
            ¡Inscripción Registrada!
          </h1>

          <p className="text-ink-soft mb-6">
            Tu inscripción al curso <strong className="text-ink">{course.title}</strong> ha sido
            recibida.
          </p>

          {course.cost > 0 && (
            <div className="bg-warm-soft mb-6 rounded-xl p-4 text-left">
              <h3 className="mb-1 text-xl">Pendiente de confirmación</h3>
              <p className="text-ink-soft text-sm">
                Tu inscripción será revisada y te contactaremos por WhatsApp para confirmar el pago.
              </p>
            </div>
          )}

          {/* WhatsApp Group */}
          <div className="border-line mb-6 rounded-xl border p-5">
            <div className="mb-1 flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <h3 className="text-xl">Únete al Grupo de WhatsApp</h3>
            </div>
            <p className="text-ink-soft mb-4 text-sm">Mantente informado sobre el curso</p>
            <a
              href={
                course.whatsappGroupUrl ||
                `https://wa.me/573153455511?text=${encodeURIComponent(`Hola, me inscribí al curso: ${course.title}`)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Unirme al Grupo
            </a>
          </div>

          <a
            href="/"
            className={buttonVariants({
              variant: 'outline',
              size: 'lg',
              className: 'w-full sm:w-auto sm:px-8',
            })}
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // Existing enrollment status screen
  if (step === 'status' && existingEnrollment) {
    const statusInfo = getStatusInfo(existingEnrollment.status);

    return (
      <div className="mx-auto w-full max-w-lg px-5 py-14 lg:py-24">
        <div className="border-line rounded-2xl border bg-white p-6 text-center sm:p-8">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${statusInfo.tone}`}
          >
            {statusInfo.icon}
          </div>

          <h1 className="mb-3 text-[32px] leading-[1.1]">Ya estás inscrito</h1>

          <div className="mb-4">
            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-[13px] font-medium ${statusInfo.tone}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <p className="text-ink-soft mb-6">{statusInfo.message}</p>

          <div className="border-line bg-paper mb-6 rounded-xl border p-4 text-left">
            <h3 className="mb-3 text-xl">Tu inscripción</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-ink-soft">Curso:</span> {course.title}
              </p>
              <p>
                <span className="text-ink-soft">Nombre:</span> {existingEnrollment.fullName}
              </p>
              <p>
                <span className="text-ink-soft">Teléfono:</span> {existingEnrollment.phone}
              </p>
              <p>
                <span className="text-ink-soft">Fecha:</span>{' '}
                {formatDate(existingEnrollment.createdAt)}
              </p>
            </div>
          </div>

          {/* WhatsApp Contact */}
          <div className="mb-6">
            <p className="text-ink-soft mb-2 text-sm">¿Tienes alguna duda o problema?</p>
            <a
              href={`https://wa.me/57${BANK_ACCOUNT.contactPhone}?text=Hola, tengo una consulta sobre mi inscripción al curso ${course.title}. Mi documento es ${formData.documentNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
            </a>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={resetForm}
            className="w-full sm:w-auto sm:px-8"
          >
            Consultar otro documento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[75rem] px-5 pb-14 pt-6 md:px-8 lg:pb-28 lg:pt-10 xl:px-0">
      <a
        href="/"
        className="text-denim hover:text-ink inline-flex min-h-11 items-center gap-2 text-[15px] font-medium"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Volver
      </a>

      {/* Two column layout on desktop */}
      <div className="mt-4 grid gap-10 lg:mt-6 lg:grid-cols-12 lg:gap-12">
        {/* Left column - Course Info */}
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-7">
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Accent stripe in the admin-chosen course color */}
            <span className="h-1 w-10 rounded-full" style={{ backgroundColor: course.color }} />
            <h1 className="text-[40px] leading-[1.04] lg:text-[56px]">{course.title}</h1>
            <p className="text-ink-soft text-lg leading-relaxed lg:text-xl">{course.description}</p>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-3">
              {course.cost > 0 ? (
                <span className="border-line inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm font-semibold">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: course.color }}
                  />
                  {formatCurrency(course.cost)}
                </span>
              ) : (
                <span className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-800">
                  Gratis
                </span>
              )}

              {course.startDate && (
                <span className="text-ink-soft flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" strokeWidth={1.5} />
                  Inicia: {formatDate(course.startDate)}
                </span>
              )}
            </div>
          </div>

          {/* Image */}
          {course.imageUrl && (
            <div className="overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.imageUrl}
                alt={course.title}
                className="max-h-[400px] w-full object-cover"
              />
            </div>
          )}

          {/* Course Details - Markdown */}
          {course.content && (
            <div className="border-line rounded-2xl border bg-white p-6 md:p-8">
              <h2 className="mb-5 text-[28px] leading-tight md:text-[32px]">Detalles del Curso</h2>
              <div className="course-content space-y-4 text-base leading-relaxed lg:text-[17px]">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h3 className="mb-3 mt-6 text-2xl">{children}</h3>,
                    h2: ({ children }) => <h4 className="mb-3 mt-5 text-xl">{children}</h4>,
                    h3: ({ children }) => (
                      <h5 className="mb-2 mt-4 text-base font-semibold">{children}</h5>
                    ),
                    p: ({ children }) => <p className="mb-4">{children}</p>,
                    ul: ({ children }) => <ul className="mb-4 ml-1 space-y-2">{children}</ul>,
                    ol: ({ children }) => (
                      <ol className="mb-4 ml-1 list-decimal space-y-2 pl-4">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-2.5">
                        <span
                          className="mt-[0.6em] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: course.color }}
                        ></span>
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="text-ink-soft italic">{children}</em>,
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-denim hover:text-ink font-medium underline underline-offset-2 transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote
                        className="text-ink-soft my-4 border-l-2 py-1 pl-4 italic"
                        style={{ borderColor: course.color }}
                      >
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="border-line my-6" />,
                    code: ({ children }) => (
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {course.content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Enrollment Form */}
        <div className="min-w-0 lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <div className="border-line overflow-hidden rounded-2xl border bg-white">
            <div className="h-1" style={{ backgroundColor: course.color }} />
            <div className="p-6 md:p-8">
              {course.isFull ? (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                    <AlertTriangle className="h-6 w-6 text-[#b3261e]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl">Cupos Agotados</h3>
                  <p className="text-ink-soft">Este curso ha alcanzado su capacidad máxima.</p>
                </div>
              ) : step === 'initial' ? (
                /* Initial - Document input */
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-1 text-[32px] leading-tight">¡Inscríbete!</h2>
                    <p className="text-ink-soft">Ingresa tu documento para comenzar</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Número de Documento</label>
                    <Input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                      placeholder="Ej: 1234567890"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          checkEnrollmentAndProceed();
                        }
                      }}
                    />
                  </div>

                  {error && (
                    <div className="border-line flex items-start gap-2 rounded-xl border p-3 text-sm text-[#b3261e]">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.5} />
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={checkEnrollmentAndProceed}
                    disabled={isChecking || !formData.documentNumber.trim()}
                    size="lg"
                    className="w-full"
                  >
                    {isChecking ? 'Verificando...' : 'Continuar'}
                  </Button>
                </div>
              ) : (
                /* Form - Full enrollment form */
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-[32px] leading-tight">Completa tu inscripción</h2>

                  {/* Document - Read only */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Documento</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={formData.documentNumber}
                        readOnly
                        className="text-ink-soft flex-1 bg-gray-100"
                      />
                      <CircleCheck className="h-5 w-5 text-green-700" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Nombre completo <span className="text-[#b3261e]">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                      placeholder="Ej: Juan Carlos Pérez García"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      WhatsApp <span className="text-[#b3261e]">*</span>
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      placeholder="Ej: 3001234567"
                    />
                    <p className="text-ink-soft mt-1.5 text-[13px]">
                      Te contactaremos por WhatsApp
                    </p>
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Fecha de nacimiento <span className="text-[#b3261e]">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      required
                    />
                  </div>

                  {/* Church Member - Optional */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="isMember"
                      checked={formData.isMember}
                      onCheckedChange={(checked) =>
                        handleInputChange('isMember', checked as boolean)
                      }
                    />
                    <label htmlFor="isMember" className="cursor-pointer text-[15px]">
                      ¿Perteneces a la Iglesia Adventista del Séptimo Día?
                    </label>
                  </div>

                  {/* Payment Section (if cost > 0) */}
                  {course.cost > 0 && (
                    <div className="border-line space-y-4 rounded-xl border p-4">
                      <h3 className="text-xl">Información de Pago</h3>

                      {/* Bank Account Info */}
                      <div className="bg-paper rounded-xl p-4">
                        <p className="mb-3 text-sm">
                          Realiza el pago de <strong>{formatCurrency(course.cost)}</strong> a:
                        </p>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-ink-soft">Banco:</span> {BANK_ACCOUNT.bank}
                          </p>
                          <p>
                            <span className="text-ink-soft">Tipo:</span> {BANK_ACCOUNT.accountType}
                          </p>
                          <p>
                            <span className="text-ink-soft">Número:</span>{' '}
                            <span className="font-mono">{BANK_ACCOUNT.accountNumber}</span>
                          </p>
                          <p>
                            <span className="text-ink-soft">Titular:</span>{' '}
                            {BANK_ACCOUNT.accountHolder}
                          </p>
                          <p>
                            <span className="text-ink-soft">NIT:</span> {BANK_ACCOUNT.nit}
                          </p>
                        </div>

                        {/* WhatsApp Contact */}
                        <div className="border-line mt-3 border-t pt-3">
                          <p className="text-ink-soft mb-2 text-sm">¿Tienes dudas sobre el pago?</p>
                          <a
                            href={`https://wa.me/57${BANK_ACCOUNT.contactPhone}?text=Hola, tengo una consulta sobre el pago del curso ${course.title}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({ variant: 'outline' })}
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Contactar a {BANK_ACCOUNT.contactName}
                          </a>
                        </div>
                      </div>

                      {/* Upload Proof */}
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Comprobante de pago <span className="text-[#b3261e]">*</span>
                        </label>

                        {proofPreview ? (
                          <div className="relative inline-block max-w-full">
                            {proofIsPdf ? (
                              /* PDF/HEIC Preview (no browser preview support) */
                              <div className="border-line bg-paper flex items-center gap-3 rounded-xl border p-4">
                                <FileText
                                  className="text-ink-soft h-8 w-8 flex-none"
                                  strokeWidth={1.5}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {proofFileName || 'documento'}
                                  </p>
                                  <p className="text-ink-soft text-[13px]">
                                    Archivo cargado correctamente
                                  </p>
                                </div>
                              </div>
                            ) : (
                              /* Image Preview */
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={proofPreview}
                                alt="Comprobante"
                                className="border-line max-h-40 rounded-xl border object-contain"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setProofFile(null);
                                setProofPreview(null);
                                setProofIsPdf(false);
                                setProofFileName(null);
                                setProofError(null);
                              }}
                              className="border-line text-ink absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border bg-white transition-colors hover:bg-gray-100"
                            >
                              <X className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        ) : proofError ? (
                          /* Error state - shows in place of upload button */
                          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#b3261e] bg-white p-5 text-center">
                            <AlertCircle
                              className="mb-2 h-6 w-6 text-[#b3261e]"
                              strokeWidth={1.5}
                            />
                            <p className="text-sm font-medium text-[#b3261e]">{proofError}</p>
                            <label
                              className={buttonVariants({
                                variant: 'outline',
                                className: 'mt-3 cursor-pointer',
                              })}
                            >
                              Intentar de nuevo
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf"
                                onChange={(e) => {
                                  setProofError(null);
                                  handleProofFileChange(e);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center transition-colors hover:border-gray-400 hover:bg-gray-50">
                            <span className="bg-warm-soft mb-3 flex h-11 w-11 items-center justify-center rounded-xl">
                              <Upload className="h-5 w-5" strokeWidth={1.5} />
                            </span>
                            <span className="text-[15px] font-semibold">Subir comprobante</span>
                            <span className="text-ink-soft mt-1 text-[13px]">
                              PNG, JPG, HEIC o PDF
                            </span>
                            <span className="text-ink-soft text-[13px]">Tamaño máximo 10MB</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf"
                              onChange={handleProofFileChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Privacy Policy */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onCheckedChange={(checked) =>
                        handleInputChange('acceptPrivacy', checked as boolean)
                      }
                      className="mt-0.5"
                    />
                    <label htmlFor="acceptPrivacy" className="text-[15px]">
                      Acepto el{' '}
                      <a
                        href="/privacy"
                        target="_blank"
                        className="text-denim hover:text-ink underline"
                      >
                        tratamiento de mis datos
                      </a>
                    </label>
                  </div>

                  {/* Turnstile */}
                  <div className="flex justify-center">
                    <div ref={turnstileRef} style={{ minHeight: '65px' }}></div>
                  </div>
                  {turnstileToken && (
                    <p className="flex items-center justify-center gap-1.5 text-sm text-green-700">
                      <CircleCheck className="h-4 w-4" strokeWidth={1.5} />
                      Verificación completada
                    </p>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="border-line flex items-start gap-2 rounded-xl border p-3 text-sm text-[#b3261e]">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.5} />
                      {error}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Volver
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={
                        isSubmitting ||
                        !turnstileToken ||
                        !formData.acceptPrivacy ||
                        (course.cost > 0 && !proofFile)
                      }
                      className="flex-1"
                    >
                      {isSubmitting ? 'Enviando...' : 'Inscribirme'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
