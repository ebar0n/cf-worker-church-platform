'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VolunteerEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  services: string | null;
}

interface VolunteerRegistrationFormProps {
  event: VolunteerEvent;
}

export default function VolunteerRegistrationForm({ event }: VolunteerRegistrationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingDocument, setCheckingDocument] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(true);

  const [formData, setFormData] = useState({
    documentID: '',
    name: '',
    phone: '',
    birthDate: '',
    selectedService: '',
    hasTransport: false,
    transportSlots: '',
    dietType: 'normal',
  });
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [memberFound, setMemberFound] = useState<boolean | null>(null); // null = not searched, true = found, false = not found

  // Turnstile widget state
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [siteKey, setSiteKey] = useState<string>('');
  const [widgetRendered, setWidgetRendered] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const services = event.services ? JSON.parse(event.services) : [];

  // Fetch Turnstile site key
  useEffect(() => {
    const fetchSiteKey = async () => {
      try {
        const response = await fetch('/api/turnstile-config');
        const data = (await response.json()) as { siteKey: string };
        if (data.siteKey) {
          setSiteKey(data.siteKey);
        }
      } catch (error) {
        console.error('Error fetching Turnstile site key:', error);
      }
    };

    fetchSiteKey();
  }, []);

  // Render Turnstile widget
  useEffect(() => {
    if (!siteKey || widgetRendered) {
      return;
    }

    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        if (turnstileRef.current && window.turnstile) {
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
        }
      };
    } else if (turnstileRef.current && window.turnstile) {
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
    }
  }, [siteKey, widgetRendered]);

  // Hide floating button when registration form is visible
  useEffect(() => {
    const formElement = document.getElementById('registration-form');
    if (!formElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShowFloatingButton(!entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(formElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleDocumentBlur = async () => {
    if (!formData.documentID.trim()) {
      setMemberFound(null);
      return;
    }

    setCheckingDocument(true);
    setError('');
    setAlreadyRegistered(false);
    setMemberFound(null);

    try {
      // First check if already registered for this event
      const registrationResponse = await fetch(
        `/api/volunteer-events/${event.id}/check-registration?documentID=${formData.documentID}`
      );

      if (registrationResponse.ok) {
        const registration = await registrationResponse.json();
        setAlreadyRegistered(true);
        setMemberFound(true);
        setFormData((prev) => ({
          ...prev,
          name: registration.name || prev.name,
          phone: registration.phone || prev.phone,
          birthDate: registration.birthDate ? registration.birthDate.split('T')[0] : prev.birthDate,
          selectedService: registration.selectedService || '',
          hasTransport: registration.hasTransport || false,
          transportSlots: registration.transportSlots?.toString() || '',
          dietType: registration.dietType || 'normal',
        }));
        setCheckingDocument(false);
        return;
      }

      // If not registered, check if member exists
      const response = await fetch(`/api/members/search?documentID=${formData.documentID}`);

      if (response.ok) {
        const member = await response.json();
        setMemberFound(true);
        setFormData((prev) => ({
          ...prev,
          name: member.name || '',
          phone: member.phone || '',
          birthDate: member.birthDate ? member.birthDate.split('T')[0] : '',
        }));
      } else {
        // Member not found - reset personal fields
        setMemberFound(false);
        setFormData((prev) => ({
          ...prev,
          name: '',
          phone: '',
          birthDate: '',
        }));
      }
    } catch (err) {
      // If member not found, user can fill in manually - reset personal fields
      setMemberFound(false);
      setFormData((prev) => ({
        ...prev,
        name: '',
        phone: '',
        birthDate: '',
      }));
      console.log('Member not found, user can fill manually');
    } finally {
      setCheckingDocument(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate Turnstile token
      if (!turnstileToken) {
        setError('Por favor completa la verificación de seguridad');
        setIsSubmitting(false);
        return;
      }

      // Validate required fields
      if (!formData.documentID.trim()) {
        setError('El documento es obligatorio');
        setIsSubmitting(false);
        return;
      }
      if (!formData.name.trim()) {
        setError('El nombre es obligatorio');
        setIsSubmitting(false);
        return;
      }
      if (!formData.phone.trim()) {
        setError('El teléfono es obligatorio');
        setIsSubmitting(false);
        return;
      }
      if (!formData.birthDate.trim()) {
        setError('La fecha de nacimiento es obligatoria');
        setIsSubmitting(false);
        return;
      }

      // Validate age (must be 16 or older)
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (actualAge < 16) {
        setError('Debes tener al menos 16 años para participar como voluntario');
        setIsSubmitting(false);
        return;
      }

      if (!formData.selectedService) {
        setError('Debes seleccionar un servicio');
        setIsSubmitting(false);
        return;
      }
      if (formData.hasTransport && !formData.transportSlots) {
        setError('Indica cuántos cupos tienes disponibles');
        setIsSubmitting(false);
        return;
      }

      const method = alreadyRegistered ? 'PUT' : 'POST';
      const response = await fetch(`/api/volunteer-events/${event.id}/register`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberDocumentID: formData.documentID,
          memberName: formData.name,
          memberPhone: formData.phone,
          memberBirthDate: formData.birthDate || null,
          selectedService: formData.selectedService,
          hasTransport: formData.hasTransport,
          transportSlots: formData.hasTransport ? parseInt(formData.transportSlots) : null,
          dietType: formData.dietType,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar voluntario');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al registrar. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="relative overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl sm:p-12">
            {/* Animated success icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-30"></div>
                <div className="relative rounded-full bg-gradient-to-br from-green-500 to-emerald-600 p-6 shadow-lg">
                  <svg
                    className="h-12 w-12 text-white sm:h-16 sm:w-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              {alreadyRegistered ? '¡Actualización Exitosa!' : '¡Registro Completado!'}
            </h2>
            <p className="mb-2 text-base text-gray-700 sm:text-lg">
              {alreadyRegistered
                ? 'Tus datos se han actualizado correctamente.'
                : 'Te has registrado como voluntario para este evento.'}
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Nos pondremos en contacto contigo pronto para confirmar los detalles.
            </p>

            {/* WhatsApp Group Button */}
            <div className="mt-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-6">
              <div className="mb-3 flex items-center justify-center gap-2">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Únete al Grupo de WhatsApp</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Mantente informado y conecta con otros voluntarios
              </p>
              <a
                href={`https://chat.whatsapp.com/Hcd38KRSdaVI1TiWRk64hi?text=${encodeURIComponent(`Ya iré a: ${event.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl sm:w-auto"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Unirme al Grupo
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scrollToForm = () => {
    document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Event Hero Section - Full page */}
      <div className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-[#4b207f] via-[#5c2a96] to-[#6b3aa6] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
        {/* Animated background blobs */}
        <div className="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-white/5 blur-3xl" style={{ animationDelay: '1s' }}></div>

        <div className="relative mx-auto w-full max-w-4xl">
          {/* Tags */}
          <div className="mb-4 flex items-center justify-center gap-2 sm:mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Programa de Voluntariado
            </span>
            <span className="text-white/40">•</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Vida y Esperanza
            </span>
          </div>

          {/* Logo */}
          <div className="mb-6 flex justify-center sm:mb-8">
            <div className="transform transition-transform hover:scale-105">
              <img
                src="/logo-vida-y-esperanza.jpg"
                alt="Vida y Esperanza"
                className="h-28 w-auto drop-shadow-2xl sm:h-36 lg:h-44"
              />
            </div>
          </div>

          <div className="text-center">

            {/* Title */}
            <h1 className="mb-6 text-2xl font-bold leading-tight text-white sm:mb-8 sm:text-3xl lg:text-4xl">
              {event.title}
            </h1>

            {/* Description with gradient background */}
            <div className="mx-auto mb-6 max-w-3xl rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 backdrop-blur-sm sm:p-8 lg:p-10">
              <div className="prose prose-base prose-invert mx-auto max-w-none text-center sm:prose-lg">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        className="text-white underline decoration-white/30 transition-colors hover:text-green-300 hover:decoration-green-300"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong {...props} className="font-bold text-white" />
                    ),
                    em: ({ node, ...props }) => <em {...props} className="italic text-white/95" />,
                    p: ({ node, ...props }) => (
                      <p {...props} className="mb-3 text-base leading-relaxed text-white/95 sm:text-lg" />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul {...props} className="mb-3 ml-0 list-none space-y-2 text-white/95" />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol {...props} className="mb-3 ml-0 list-none space-y-2 text-white/95" />
                    ),
                    li: ({ node, ...props }) => (
                      <li {...props} className="text-white/95">
                        <span className="mr-2">•</span>
                        {props.children}
                      </li>
                    ),
                    h1: ({ node, ...props }) => (
                      <h1 {...props} className="mb-4 text-xl font-bold text-white sm:text-2xl" />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 {...props} className="mb-3 text-lg font-bold text-white sm:text-xl" />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 {...props} className="mb-2 text-base font-bold text-white sm:text-lg" />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        {...props}
                        className="my-4 border-l-4 border-green-400/50 bg-white/5 py-3 pl-4 pr-3 italic text-white/90"
                      />
                    ),
                    code: ({ node, inline, ...props }: any) => {
                      if (inline) {
                        return (
                          <code
                            {...props}
                            className="rounded bg-white/20 px-2 py-0.5 font-mono text-sm text-white"
                          />
                        );
                      }
                      return (
                        <code
                          {...props}
                          className="block overflow-x-auto rounded bg-white/20 p-4 font-mono text-sm text-white"
                        />
                      );
                    },
                  }}
                >
                  {event.description}
                </ReactMarkdown>
              </div>
            </div>

            {/* Date Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md sm:gap-3 sm:px-5 sm:py-2.5">
              <svg className="h-4 w-4 text-white sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-white sm:text-sm lg:text-base">
                {new Date(event.eventDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Services */}
            {services.length > 0 && (
              <div className="mb-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/70 sm:text-sm">
                  Áreas de servicio disponibles
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {services.map((service: string, index: number) => (
                    <span
                      key={index}
                      className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-white/25 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Biblical Quote */}
            <div className="mx-auto max-w-2xl rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md sm:p-6">
              <svg
                className="mb-2 h-6 w-6 text-white/60 sm:mb-3 sm:h-7 sm:w-7"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="mb-2 text-sm italic leading-relaxed text-white/95 sm:text-base">
                "Hijitos míos, no amemos de palabra ni de lengua, sino de hecho y en verdad."
              </p>
              <p className="text-xs font-semibold text-white/70 sm:text-sm">
                1 Juan 3:18
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Floating CTA Button - Liquid Glass */}
      <div className={`pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 ${showFloatingButton ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="pointer-events-auto absolute bottom-6 right-6 sm:bottom-8 sm:right-8">
          <button
            onClick={scrollToForm}
            className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-5 py-3 shadow-lg backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/30 hover:bg-white/15 hover:shadow-xl sm:px-6 sm:py-3.5"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50"></div>

            {/* Animated shimmer effect */}
            <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]"></div>

            {/* Button content */}
            <div className="relative flex items-center gap-2">
              <span className="text-sm font-semibold text-white sm:text-base">
                Quiero ser parte
              </span>
              <svg
                className="h-4 w-4 animate-bounce text-white transition-transform duration-300 group-hover:translate-y-1 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Registration Form */}
      <div id="registration-form" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 bg-gradient-to-r from-[#4b207f] to-[#5c2a96] px-6 py-6 sm:px-8 sm:py-8">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Formulario de Registro</h2>
            <p className="mt-2 text-sm text-white/90 sm:text-base">
              Únete al programa de voluntariado de Vida y Esperanza
            </p>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
        {alreadyRegistered && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-700">
            Ya estás registrado para este evento. Puedes actualizar tu información si lo deseas.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document ID */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Documento de Identidad <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.documentID}
                onChange={(e) => {
                  setFormData({ ...formData, documentID: e.target.value });
                  setMemberFound(null);
                }}
                onBlur={handleDocumentBlur}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                placeholder="Ingresa tu documento"
                disabled={checkingDocument}
              />
              {/* Status Icons */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {checkingDocument && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4b207f] border-t-transparent"></div>
                )}
                {!checkingDocument && memberFound === true && (
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {!checkingDocument && memberFound === false && (
                  <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {checkingDocument && (
              <p className="mt-2 flex items-center text-sm text-gray-600">
                <svg className="mr-1.5 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando información...
              </p>
            )}
            {!checkingDocument && memberFound === true && (
              <p className="mt-2 flex items-center text-sm text-green-600">
                <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ¡Miembro encontrado! Tus datos se han precargado
              </p>
            )}
            {!checkingDocument && memberFound === false && (
              <p className="mt-2 flex items-center text-sm text-yellow-600">
                <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Documento no encontrado. Se creará un nuevo registro con tus datos
              </p>
            )}
          </div>

          {/* Personal Info - Only show after document is entered */}
          {formData.documentID && (
            <div className="animate-fade-in space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Información Personal</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                      placeholder="Tu número"
                    />
                  </div>

                     {/* Birth Date */}
                     <div className="sm:col-span-2">
                       <label className="mb-1.5 block text-xs font-medium text-gray-600">
                         Fecha de Nacimiento <span className="text-red-500">*</span>
                       </label>
                       <input
                         type="date"
                         value={formData.birthDate}
                         onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                         className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                         max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                       />
                       <p className="mt-1 text-xs text-gray-500">Debes tener al menos 16 años</p>
                     </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ¿En qué servicio deseas participar? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.selectedService}
              onChange={(e) => setFormData({ ...formData, selectedService: e.target.value })}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25rem',
              }}
            >
              <option value="">Selecciona un servicio</option>
              {services.map((service: string) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          {/* Transport */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Transporte</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasTransport"
                checked={formData.hasTransport}
                onChange={(e) =>
                  setFormData({ ...formData, hasTransport: e.target.checked, transportSlots: '' })
                }
                className="h-4 w-4 rounded border-gray-300 text-[#4b207f] focus:ring-[#4b207f]"
              />
              <label htmlFor="hasTransport" className="ml-2 text-sm text-gray-700">
                ¿Cuentas con transporte propio para el evento?
              </label>
            </div>
          </div>

          {/* Transport Slots - Conditional */}
          {formData.hasTransport && (
            <div className="ml-6 rounded-lg bg-gray-50 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ¿Cuántos cupos tienes disponibles para llevar a otros voluntarios?{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.transportSlots}
                onChange={(e) => setFormData({ ...formData, transportSlots: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                placeholder="Número de cupos"
              />
            </div>
          )}

          {/* Diet Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tipo de Alimentación <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dietType"
                  value="normal"
                  checked={formData.dietType === 'normal'}
                  onChange={(e) => setFormData({ ...formData, dietType: e.target.value })}
                  className="h-4 w-4 border-gray-300 text-[#4b207f] focus:ring-[#4b207f]"
                />
                <span className="ml-2 text-sm text-gray-700">Normal</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dietType"
                  value="vegetariana"
                  checked={formData.dietType === 'vegetariana'}
                  onChange={(e) => setFormData({ ...formData, dietType: e.target.value })}
                  className="h-4 w-4 border-gray-300 text-[#4b207f] focus:ring-[#4b207f]"
                />
                <span className="ml-2 text-sm text-gray-700">Vegetariana</span>
              </label>
            </div>
          </div>

          {/* Turnstile Captcha */}
          <div className="flex justify-center">
            <div ref={turnstileRef} />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !turnstileToken}
              className="w-full rounded-lg bg-[#4b207f] px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#4b207f]/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {alreadyRegistered ? 'Actualizando...' : 'Registrando...'}
                </span>
              ) : alreadyRegistered ? (
                'Actualizar mi Registro'
              ) : (
                'Registrarme como Voluntario'
              )}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}
