'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Course } from '@/app/types';
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
  contactPhone: '3144158745', // WhatsApp contact number
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

  // Upload state
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofIsPdf, setProofIsPdf] = useState(false);
  const [proofFileName, setProofFileName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    documentNumber: '',
    fullName: '',
    phone: '',
    birthDate: '',
    paymentProofUrl: '',
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

  const handleProofUpload = async (file: File) => {
    setUploadingProof(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'payment-proof');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const data = (await response.json()) as { url: string };
        setFormData((prev) => ({ ...prev, paymentProofUrl: data.url }));
        setProofPreview(data.url);
      } else {
        const errorData = (await response.json()) as { error?: string };
        setError(errorData.error || 'Error al subir el comprobante');
      }
    } catch (error) {
      console.error('Error uploading proof:', error);
      setError('Error al subir el comprobante');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf';
      setProofIsPdf(isPdf);
      setProofFileName(file.name);

      if (isPdf) {
        // For PDF, just set a placeholder - can't preview
        setProofPreview('pdf');
      } else {
        // For images, create preview
        const reader = new FileReader();
        reader.onloadend = () => setProofPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
      handleProofUpload(file);
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

    if (course && course.cost > 0 && !formData.paymentProofUrl) {
      setError('Por favor, sube el comprobante de pago');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/courses/${slug}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: turnstileToken,
          ...formData,
        }),
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusInfo = (status: 'pending' | 'confirmed' | 'rejected') => {
    const statusMap = {
      pending: {
        label: 'Pendiente',
        bgLight: 'bg-yellow-50',
        icon: (
          <svg className="h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        message: 'Tu inscripción está siendo revisada. Te contactaremos pronto por WhatsApp.',
      },
      confirmed: {
        label: 'Confirmado',
        bgLight: 'bg-green-50',
        icon: (
          <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        message: '¡Tu inscripción ha sido confirmada! Nos vemos en el curso.',
      },
      rejected: {
        label: 'No aprobado',
        bgLight: 'bg-red-50',
        icon: (
          <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
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
      paymentProofUrl: '',
      isMember: false,
      acceptPrivacy: false,
    });
    setProofPreview(null);
    setProofIsPdf(false);
    setProofFileName(null);
    setWidgetRendered(false);
    setTurnstileToken('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"></div>
          <p className="text-gray-600">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Curso No Encontrado</h1>
          <p className="mb-4 text-gray-600">El curso que buscas no está disponible.</p>
          <a href="/" className="inline-block rounded-lg bg-gray-800 px-6 py-3 text-white hover:bg-gray-700">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  if (!course.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Curso No Disponible</h1>
          <p className="text-gray-600">Este curso no está disponible para inscripciones.</p>
        </div>
      </div>
    );
  }

  // Success screen
  if (enrollmentSuccess) {
    return (
      <div className="min-h-screen bg-white py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full p-4" style={{ backgroundColor: `${course.color}20` }}>
                  <svg className="h-12 w-12" style={{ color: course.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">¡Inscripción Registrada!</h1>

              <p className="mb-6 text-gray-600">
                Tu inscripción al curso <strong>{course.title}</strong> ha sido recibida.
              </p>

              {course.cost > 0 && (
                <div className="mb-6 rounded-xl bg-yellow-50 p-4 text-left">
                  <h3 className="mb-2 font-semibold text-yellow-800">Pendiente de confirmación</h3>
                  <p className="text-sm text-yellow-700">
                    Tu inscripción será revisada y te contactaremos por WhatsApp para confirmar el pago.
                  </p>
                </div>
              )}

              <a
                href="/"
                className="inline-block w-full rounded-xl py-3 text-center font-medium text-white transition-colors sm:w-auto sm:px-8"
                style={{ backgroundColor: course.color }}
              >
                Volver al inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Existing enrollment status screen
  if (step === 'status' && existingEnrollment) {
    const statusInfo = getStatusInfo(existingEnrollment.status);

    return (
      <div className="min-h-screen bg-white py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="mb-4 flex justify-center">{statusInfo.icon}</div>

              <h1 className="mb-2 text-2xl font-bold text-gray-900">Ya estás inscrito</h1>

              <div className="mb-4">
                <span
                  className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: course.color }}
                >
                  {statusInfo.label}
                </span>
              </div>

              <p className="mb-6 text-gray-600">{statusInfo.message}</p>

              <div className={`mb-6 rounded-xl p-4 text-left ${statusInfo.bgLight}`}>
                <h3 className="mb-3 font-semibold text-gray-800">Tu inscripción</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Curso:</span> {course.title}</p>
                  <p><span className="font-medium">Nombre:</span> {existingEnrollment.fullName}</p>
                  <p><span className="font-medium">Teléfono:</span> {existingEnrollment.phone}</p>
                  <p><span className="font-medium">Fecha:</span> {formatDate(existingEnrollment.createdAt)}</p>
                </div>
              </div>

              {/* WhatsApp Contact */}
              <div className="mb-6">
                <p className="mb-2 text-sm text-gray-600">¿Tienes alguna duda o problema?</p>
                <a
                  href={`https://wa.me/57${BANK_ACCOUNT.contactPhone}?text=Hola, tengo una consulta sobre mi inscripción al curso ${course.title}. Mi documento es ${formData.documentNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Contactar por WhatsApp
                </a>
              </div>

              <button
                onClick={resetForm}
                className="w-full rounded-xl border-2 py-3 font-medium transition-colors hover:bg-gray-50 sm:w-auto sm:px-8"
                style={{ borderColor: course.color, color: course.color }}
              >
                Consultar otro documento
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with course color */}
      <div className="py-4" style={{ backgroundColor: course.color }}>
        <div className="container mx-auto px-4">
          <a href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-5xl">
          {/* Two column layout on desktop */}
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left column - Course Info */}
            <div>
              {/* Image */}
              {course.imageUrl && (
                <div className="mb-6 overflow-hidden rounded-2xl shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full object-cover"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              )}

              {/* Title & Description */}
              <h1 className="mb-3 text-3xl font-bold text-gray-900 lg:text-4xl">{course.title}</h1>
              <p className="mb-6 text-lg text-gray-600">{course.description}</p>

              {/* Meta badges */}
              <div className="mb-6 flex flex-wrap gap-3">
                {course.cost > 0 ? (
                  <span
                    className="rounded-full px-4 py-2 text-sm font-bold text-white"
                    style={{ backgroundColor: course.color }}
                  >
                    {formatCurrency(course.cost)}
                  </span>
                ) : (
                  <span className="rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-white">Gratis</span>
                )}

                {course.startDate && (
                  <span className="rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-700">
                    Inicia: {formatDate(course.startDate)}
                  </span>
                )}

                {course.capacity && (
                  <span className="rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-700">
                    {course.enrollmentCount} / {course.capacity} cupos
                  </span>
                )}
              </div>


              {/* Course Details - Markdown */}
              {course.content && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">Detalles del Curso</h2>
                  <div className="prose prose-gray max-w-none">
                    <ReactMarkdown>{course.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Right column - Enrollment Form */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
                {course.isFull ? (
                  <div className="text-center">
                    <svg
                      className="mx-auto mb-4 h-16 w-16 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <h3 className="mb-2 text-xl font-semibold text-red-800">Cupos Agotados</h3>
                    <p className="text-red-600">Este curso ha alcanzado su capacidad máxima.</p>
                  </div>
                ) : step === 'initial' ? (
                  /* Initial - Document input */
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="mb-2 text-2xl font-bold text-gray-900">¡Inscríbete!</h2>
                      <p className="text-gray-600">Ingresa tu documento para comenzar</p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Número de Documento</label>
                      <Input
                        type="text"
                        value={formData.documentNumber}
                        onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                        placeholder="Ej: 1234567890"
                        className="text-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            checkEnrollmentAndProceed();
                          }
                        }}
                      />
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>
                    )}

                    <Button
                      onClick={checkEnrollmentAndProceed}
                      disabled={isChecking || !formData.documentNumber.trim()}
                      className="w-full py-6 text-lg font-semibold text-white"
                      style={{ backgroundColor: course.color }}
                    >
                      {isChecking ? 'Verificando...' : 'Continuar'}
                    </Button>
                  </div>
                ) : (
                  /* Form - Full enrollment form */
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="text-center">
                      <h2 className="mb-1 text-xl font-bold text-gray-900">Completa tu inscripción</h2>
                    </div>

                    {/* Document - Read only */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Documento</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={formData.documentNumber}
                          readOnly
                          className="flex-1 bg-gray-50 text-gray-600"
                        />
                        <span className="text-green-600">✓</span>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo *</label>
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
                      <label className="mb-1 block text-sm font-medium text-gray-700">WhatsApp *</label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        placeholder="Ej: 3001234567"
                      />
                      <p className="mt-1 text-xs text-gray-500">Te contactaremos por WhatsApp</p>
                    </div>

                    {/* Birth Date */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Fecha de nacimiento *</label>
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
                        onCheckedChange={(checked) => handleInputChange('isMember', checked as boolean)}
                      />
                      <label htmlFor="isMember" className="cursor-pointer text-sm text-gray-700">
                        ¿Perteneces a la Iglesia Adventista del Séptimo Día?
                      </label>
                    </div>

                    {/* Payment Section (if cost > 0) */}
                    {course.cost > 0 && (
                      <div className="space-y-4 rounded-xl border-2 p-4" style={{ borderColor: course.color }}>
                        <h3 className="font-semibold text-gray-900">Información de Pago</h3>

                        {/* Bank Account Info */}
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="mb-3 text-sm font-medium text-gray-700">
                            Realiza el pago de <strong>{formatCurrency(course.cost)}</strong> a:
                          </p>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Banco:</span> {BANK_ACCOUNT.bank}</p>
                            <p><span className="font-medium">Tipo:</span> {BANK_ACCOUNT.accountType}</p>
                            <p><span className="font-medium">Número:</span> <span className="font-mono">{BANK_ACCOUNT.accountNumber}</span></p>
                            <p><span className="font-medium">Titular:</span> {BANK_ACCOUNT.accountHolder}</p>
                            <p><span className="font-medium">NIT:</span> {BANK_ACCOUNT.nit}</p>
                          </div>

                          {/* WhatsApp Contact */}
                          <div className="mt-3 border-t border-gray-200 pt-3">
                            <p className="mb-2 text-sm text-gray-600">¿Tienes dudas sobre el pago?</p>
                            <a
                              href={`https://wa.me/57${BANK_ACCOUNT.contactPhone}?text=Hola, tengo una consulta sobre el pago del curso ${course.title}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                            >
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              Contactar a {BANK_ACCOUNT.contactName}
                            </a>
                          </div>
                        </div>

                        {/* Upload Proof */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Comprobante de pago *</label>

                          {proofPreview ? (
                            <div className="relative inline-block">
                              {proofIsPdf ? (
                                /* PDF Preview */
                                <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
                                  <svg className="h-10 w-10 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9.5c0 .28-.22.5-.5.5H8v2h1.5c.28 0 .5.22.5.5s-.22.5-.5.5H7.5a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5H10c.28 0 .5.22.5.5s-.22.5-.5.5H8v1h1.5c.28 0 .5.22.5.5zm4-.5a1.5 1.5 0 0 1 0 3h-1v1.5a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 .5-.5H14zm0 2a.5.5 0 0 0 0-1h-1v1h1zm4.5-1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 1 0z"/>
                                  </svg>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {proofFileName || 'documento.pdf'}
                                    </p>
                                    <p className="text-xs text-gray-500">PDF cargado</p>
                                  </div>
                                </div>
                              ) : (
                                /* Image Preview */
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={proofPreview} alt="Comprobante" className="max-h-40 rounded-lg object-contain" />
                              )}
                              {uploadingProof && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setProofPreview(null);
                                  setProofIsPdf(false);
                                  setProofFileName(null);
                                  setFormData((prev) => ({ ...prev, paymentProofUrl: '' }));
                                }}
                                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-colors hover:border-gray-400 hover:bg-gray-100">
                              <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="text-sm font-medium text-gray-600">
                                {uploadingProof ? 'Subiendo...' : 'Subir comprobante'}
                              </span>
                              <span className="mt-1 text-xs text-gray-500">PNG, JPG o PDF</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={handleProofFileChange}
                                disabled={uploadingProof}
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
                        onCheckedChange={(checked) => handleInputChange('acceptPrivacy', checked as boolean)}
                        className="mt-0.5"
                      />
                      <label htmlFor="acceptPrivacy" className="text-sm text-gray-700">
                        Acepto el{' '}
                        <a href="/privacy" target="_blank" className="underline" style={{ color: course.color }}>
                          tratamiento de mis datos
                        </a>
                      </label>
                    </div>

                    {/* Turnstile */}
                    <div className="flex justify-center">
                      <div ref={turnstileRef} style={{ minHeight: '65px' }}></div>
                    </div>
                    {turnstileToken && (
                      <p className="text-center text-sm text-green-600">✓ Verificación completada</p>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        Volver
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !turnstileToken ||
                          !formData.acceptPrivacy ||
                          (course.cost > 0 && !formData.paymentProofUrl)
                        }
                        className="flex-1 text-white"
                        style={{ backgroundColor: course.color }}
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
    </div>
  );
}
