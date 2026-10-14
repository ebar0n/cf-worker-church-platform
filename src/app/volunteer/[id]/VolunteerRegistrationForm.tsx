'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertCircle,
  ArrowDown,
  Calendar,
  ChevronDown,
  CircleCheck,
  Info,
  Loader2,
  Quote,
} from 'lucide-react';
import { Button, buttonVariants } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { calculateAge, parseDateOnly } from '@/lib/age-classification';

interface VolunteerEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  services: string | null;
  maxCapacities: string | null;
  whatsappGroupUrl: string | null;
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
    transportSlots: '0',
    dietType: 'normal',
  });
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [memberFound, setMemberFound] = useState<boolean | null>(null); // null = not searched, true = found, false = not found
  const [serviceCapacities, setServiceCapacities] = useState<{
    [key: string]: { current: number; max: number };
  }>({});
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  // Turnstile widget state
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [siteKey, setSiteKey] = useState<string>('');
  const [widgetRendered, setWidgetRendered] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const services = event.services ? JSON.parse(event.services) : [];
  const maxCapacities = event.maxCapacities ? JSON.parse(event.maxCapacities) : [];

  // Fetch service capacities
  const fetchServiceCapacities = async () => {
    try {
      const response = await fetch(`/api/volunteer-events/${event.id}/capacities`);
      if (response.ok) {
        const data = (await response.json()) as { [key: string]: { current: number; max: number } };
        setServiceCapacities(data);
      }
    } catch (error) {
      console.error('Error fetching service capacities:', error);
    }
  };

  // Fetch service capacities on component mount and when services change
  useEffect(() => {
    fetchServiceCapacities();
  }, [event.id]);

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

    // Lookups require the Turnstile verification; without a token the user
    // simply fills the fields manually
    if (!turnstileToken) {
      return;
    }

    setCheckingDocument(true);
    setError('');
    setAlreadyRegistered(false);
    setMemberFound(null);

    try {
      // First check if already registered for this event.
      // This verifies the Turnstile token and issues a form-pass cookie
      // that authorizes the follow-up member search.
      const registrationResponse = await fetch(
        `/api/volunteer-events/${event.id}/check-registration`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentID: formData.documentID, token: turnstileToken }),
        }
      );

      if (registrationResponse.ok) {
        const registration = (await registrationResponse.json()) as {
          name?: string;
          phone?: string;
          birthDate?: string;
          selectedService?: string;
          hasTransport?: boolean;
          transportSlots?: number;
          dietType?: string;
        };
        setAlreadyRegistered(true);
        setMemberFound(true);
        setFormData((prev) => ({
          ...prev,
          name: registration.name || prev.name,
          phone: registration.phone || prev.phone,
          birthDate: registration.birthDate ? registration.birthDate.split('T')[0] : prev.birthDate,
          selectedService: registration.selectedService || '',
          hasTransport: registration.hasTransport || false,
          transportSlots: registration.transportSlots?.toString() || '0',
          dietType: registration.dietType || 'normal',
        }));
        setCheckingDocument(false);
        return;
      }

      // If not registered, check if member exists (rides the form-pass cookie)
      const response = await fetch('/api/members/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentID: formData.documentID, token: turnstileToken }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          found: boolean;
          member?: {
            name?: string;
            phone?: string;
            birthDate?: string;
          };
        };
        if (data.found && data.member) {
          setMemberFound(true);
          setFormData((prev) => ({
            ...prev,
            name: data.member?.name || '',
            phone: data.member?.phone || '',
            birthDate: data.member?.birthDate ? data.member.birthDate.split('T')[0] : '',
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
      // The lookups consumed the Turnstile token; reset the widget so the
      // final submission gets a fresh one (auto-resolves for legit users)
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.reset(turnstileRef.current);
        setTurnstileToken('');
      }
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
      if (calculateAge(parseDateOnly(formData.birthDate), new Date()) < 16) {
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
          dietType: 'vegetariana', // formData.dietType,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Error al registrar voluntario');
      }

      setSuccess(true);
      // Refresh capacities after successful registration
      await fetchServiceCapacities();
    } catch (err: any) {
      setError(err.message || 'Error al registrar. Por favor intenta de nuevo.');
      // Refresh capacities after error to show current state
      await fetchServiceCapacities();
      // Reset Turnstile widget after error
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.reset(turnstileRef.current);
        setTurnstileToken('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto w-full max-w-lg px-5 py-14 lg:py-24">
        <div className="border-line rounded-2xl border bg-white p-6 text-center sm:p-10">
          {/* Logo Vida y Esperanza */}
          <div className="mb-6 flex justify-center">
            <img
              src="/logo-vida-y-esperanza.jpg"
              alt="Vida y Esperanza"
              className="h-32 w-auto sm:h-40"
            />
          </div>
          <h2 className="mb-3 text-[32px] leading-[1.1] sm:text-[40px]">
            {alreadyRegistered ? '¡Actualización Exitosa!' : '¡Registro Completado!'}
          </h2>
          <p className="mb-2 text-base sm:text-lg">
            {alreadyRegistered
              ? 'Tus datos se han actualizado correctamente.'
              : 'Te has registrado como voluntario para este evento.'}
          </p>
          <p className="text-ink-soft mb-6 text-sm">
            Nos pondremos en contacto contigo pronto para confirmar los detalles.
          </p>

          {/* WhatsApp Group Button */}
          <div className="bg-warm-soft rounded-xl p-6">
            <div className="mb-2 flex items-center justify-center gap-2">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <h3 className="text-xl">Únete al Grupo de WhatsApp</h3>
            </div>
            <p className="text-ink-soft mb-4 text-sm">
              Mantente informado y conecta con otros voluntarios
            </p>
            <a
              href={
                event.whatsappGroupUrl ||
                `https://wa.me/573153455511?text=${encodeURIComponent(`Hola, me registré como voluntario para: ${event.title}`)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: 'dark',
                size: 'lg',
                className: 'w-full sm:w-auto',
              })}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Unirme al Grupo
            </a>
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
      {/* Event Hero Section */}
      <section className="mx-auto grid w-full max-w-[75rem] gap-8 px-5 pb-12 pt-10 md:px-8 lg:grid-cols-12 lg:gap-6 lg:pb-20 lg:pt-16 xl:px-0">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-7">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-ink-soft m-0 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[.06em]">
              <span className="bg-warm h-0.5 w-6" />
              Programa de Voluntariado
            </p>
            <span className="border-line inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[13px] font-medium">
              <span className="bg-warm h-1.5 w-1.5 rounded-full" />
              Vida y Esperanza
            </span>
          </div>

          {/* Title */}
          <h1 className="text-[40px] leading-[1.04] lg:text-[64px]">{event.title}</h1>

          {/* Date */}
          <p className="text-ink-soft flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 flex-none" strokeWidth={1.5} />
            {new Date(
              new Date(event.eventDate).getTime() + new Date().getTimezoneOffset() * 60000
            ).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          {/* Description */}
          <div className="text-ink-soft text-lg leading-relaxed lg:text-xl">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    className="text-denim hover:text-ink underline underline-offset-2 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong {...props} className="text-ink font-semibold" />
                ),
                em: ({ node, ...props }) => <em {...props} className="italic" />,
                p: ({ node, ...props }) => <p {...props} className="mb-3" />,
                ul: ({ node, ...props }) => <ul {...props} className="mb-3 space-y-2" />,
                ol: ({ node, ...props }) => <ol {...props} className="mb-3 space-y-2" />,
                li: ({ node, ...props }) => (
                  <li {...props}>
                    <span className="bg-warm mr-3 inline-block h-1.5 w-1.5 rounded-full align-middle" />
                    {props.children}
                  </li>
                ),
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-ink mb-3 text-[28px] leading-tight" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-ink mb-3 text-2xl leading-tight" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-ink mb-2 text-xl leading-tight" />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote {...props} className="border-warm my-4 border-l-2 py-1 pl-4 italic" />
                ),
                code: ({ node, inline, ...props }: any) => {
                  if (inline) {
                    return (
                      <code
                        {...props}
                        className="text-ink rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm"
                      />
                    );
                  }
                  return (
                    <code
                      {...props}
                      className="text-ink block overflow-x-auto rounded-xl bg-gray-100 p-4 font-mono text-sm"
                    />
                  );
                },
              }}
            >
              {event.description}
            </ReactMarkdown>
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div>
              <p className="text-ink-soft mb-3 text-[13px] font-semibold uppercase tracking-[.06em]">
                Áreas de servicio disponibles
              </p>
              <div className="flex flex-wrap gap-2">
                {services.map((service: string, index: number) => (
                  <span
                    key={index}
                    className="border-line rounded-full border bg-white px-3 py-1.5 text-[13px] font-medium"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
          {/* Logo */}
          {/* The JPG carries its own white margin, so the card barely pads it */}
          <div className="border-line flex justify-center overflow-hidden rounded-2xl border bg-white p-2">
            <img
              src="/logo-vida-y-esperanza.jpg"
              alt="Vida y Esperanza"
              className="h-auto w-full max-w-[340px]"
            />
          </div>

          {/* Biblical Quote */}
          <div className="bg-warm-soft rounded-2xl p-6">
            <Quote className="mb-3 h-6 w-6" strokeWidth={1.5} />
            <p className="mb-2 text-base italic leading-relaxed">
              &quot;Hijitos míos, no amemos de palabra ni de lengua, sino de hecho y en
              verdad.&quot;
            </p>
            <p className="text-ink-soft text-sm font-semibold">1 Juan 3:18</p>
          </div>
        </aside>
      </section>

      {/* Floating CTA Button */}
      <div
        className={`pointer-events-none fixed inset-0 z-[9999] transition-[opacity,visibility] duration-500 ${showFloatingButton ? 'opacity-100' : 'invisible opacity-0'}`}
      >
        <div className="pointer-events-auto absolute bottom-6 right-5 sm:bottom-8 sm:right-8">
          <Button
            onClick={scrollToForm}
            size="lg"
            className="group shadow-[0_8px_24px_rgb(28_27_25/0.12)]"
          >
            Quiero ser parte
            <ArrowDown
              className="h-5 w-5 transition-transform duration-300 group-hover:translate-y-0.5"
              strokeWidth={1.5}
            />
          </Button>
        </div>
      </div>

      {/* Registration Form */}
      <div
        id="registration-form"
        className="mx-auto w-full max-w-[880px] scroll-mt-20 px-5 pb-14 md:px-8 lg:scroll-mt-24 lg:pb-28 xl:px-0"
      >
        <div className="border-line overflow-hidden rounded-2xl border bg-white">
          <div className="px-6 pt-6 sm:px-10 sm:pt-10">
            <h2 className="text-[32px] leading-[1.15] sm:text-[40px]">Formulario de Registro</h2>
            <p className="text-ink-soft mt-1.5 text-base">
              Únete al programa de voluntariado de Vida y Esperanza
            </p>
          </div>

          <div className="p-6 sm:p-10">
            {alreadyRegistered && (
              <div className="bg-warm-soft mb-6 flex items-start gap-3 rounded-xl p-4 text-[15px]">
                <Info className="mt-0.5 h-5 w-5 flex-none" strokeWidth={1.5} />
                Ya estás registrado para este evento. Puedes actualizar tu información si lo deseas.
              </div>
            )}

            {error && (
              <div className="border-line mb-6 flex items-start gap-3 rounded-xl border bg-white p-4 text-[15px] text-[#b3261e]">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" strokeWidth={1.5} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document ID */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Documento de Identidad <span className="text-[#b3261e]">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={formData.documentID}
                    onChange={(e) => {
                      setFormData({ ...formData, documentID: e.target.value });
                      setMemberFound(null);
                      // A new document is not known to be registered: without
                      // this, a corrected document would be sent as an update
                      setAlreadyRegistered(false);
                    }}
                    onBlur={handleDocumentBlur}
                    className="pr-12"
                    placeholder="Ingresa tu documento"
                    disabled={checkingDocument}
                  />
                  {/* Status Icons */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
                    {checkingDocument && (
                      <Loader2 className="text-ink h-5 w-5 animate-spin" strokeWidth={1.5} />
                    )}
                    {!checkingDocument && memberFound === true && (
                      <CircleCheck className="h-5 w-5 text-green-700" strokeWidth={1.5} />
                    )}
                    {!checkingDocument && memberFound === false && (
                      <Info className="text-ink-soft h-5 w-5" strokeWidth={1.5} />
                    )}
                  </div>
                </div>

                {/* Status Messages */}
                {checkingDocument && (
                  <p className="text-ink-soft mt-2 flex items-center gap-1.5 text-[13px]">
                    <Loader2 className="h-4 w-4 flex-none animate-spin" strokeWidth={1.5} />
                    Buscando información...
                  </p>
                )}
                {!checkingDocument && memberFound === true && (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] text-green-700">
                    <CircleCheck className="h-4 w-4 flex-none" strokeWidth={1.5} />
                    ¡Miembro encontrado! Tus datos se han precargado
                  </p>
                )}
                {!checkingDocument && memberFound === false && (
                  <p className="text-ink-soft mt-2 flex items-center gap-1.5 text-[13px]">
                    <Info className="h-4 w-4 flex-none" strokeWidth={1.5} />
                    Documento no encontrado. Se creará un nuevo registro con tus datos
                  </p>
                )}
              </div>

              {/* Personal Info - Only show after document is entered */}
              {formData.documentID && (
                <div className="animate-fade-in space-y-4">
                  <div className="border-line bg-paper rounded-xl border p-4 sm:p-5">
                    <h3 className="mb-4 text-xl">Información Personal</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Name */}
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Nombre Completo <span className="text-[#b3261e]">*</span>
                        </label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Tu nombre completo"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Teléfono <span className="text-[#b3261e]">*</span>
                        </label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Tu número"
                        />
                      </div>

                      {/* Birth Date */}
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-medium">
                          Fecha de Nacimiento <span className="text-[#b3261e]">*</span>
                        </label>
                        <Input
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                          max={(() => {
                            // Local date parts: toISOString() is UTC, a day
                            // ahead from 7 p.m. in Bogotá
                            const d = new Date();
                            return `${d.getFullYear() - 16}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          })()}
                        />
                        <p className="text-ink-soft mt-1.5 text-[13px]">
                          Debes tener al menos 16 años
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Selection */}
              <div className="relative">
                <label className="mb-2 block text-sm font-medium">
                  ¿En qué servicio deseas participar? <span className="text-[#b3261e]">*</span>
                </label>

                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                    className="focus-visible:border-denim h-12 w-full rounded-xl border border-gray-300 bg-white pl-4 pr-11 text-left text-base transition-colors"
                  >
                    <span className={formData.selectedService ? 'text-ink' : 'text-gray-500'}>
                      {formData.selectedService || 'Selecciona un servicio'}
                    </span>
                    <ChevronDown
                      className={`text-ink-soft absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 transition-transform ${
                        showServiceDropdown ? 'rotate-180' : ''
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>

                  {/* Dropdown Options */}
                  {showServiceDropdown && (
                    <div className="border-line absolute z-10 mt-1.5 w-full rounded-xl border bg-white shadow-[0_8px_24px_rgb(28_27_25/0.12)]">
                      <div className="max-h-60 overflow-auto rounded-xl py-1">
                        {services
                          .slice()
                          .sort((a: string, b: string) => {
                            const capacityA = serviceCapacities[a];
                            const capacityB = serviceCapacities[b];

                            // Calculate available spots for each service
                            const availableA =
                              capacityA && capacityA.max
                                ? capacityA.max - capacityA.current
                                : Number.MAX_SAFE_INTEGER; // Unlimited services go first
                            const availableB =
                              capacityB && capacityB.max
                                ? capacityB.max - capacityB.current
                                : Number.MAX_SAFE_INTEGER;

                            // Sort by available spots (descending)
                            return availableB - availableA;
                          })
                          .map((service: string, index: number) => {
                            const capacity = serviceCapacities[service];
                            const isFull = Boolean(
                              capacity && capacity.max && capacity.current >= capacity.max
                            );
                            const isLimited = capacity && capacity.max;
                            const available = isLimited ? capacity.max - capacity.current : null;

                            let displayText = service;
                            let statusText = '';
                            let colorClasses = '';
                            let statusDot = '';

                            if (isFull) {
                              statusText = 'COMPLETADO';
                              colorClasses = 'bg-gray-100 text-gray-500 cursor-not-allowed';
                              statusDot = 'bg-gray-400';
                            } else if (isLimited && available !== null && available <= 3) {
                              statusText = `¡Últimos cupos! (${available})`;
                              colorClasses = 'hover:bg-gray-50 text-ink';
                              statusDot = 'bg-green-600';
                            } else {
                              colorClasses = 'hover:bg-gray-50 text-ink';
                              statusDot = 'bg-green-600';
                            }

                            return (
                              <button
                                key={service}
                                type="button"
                                disabled={isFull}
                                onClick={() => {
                                  if (!isFull) {
                                    setFormData({ ...formData, selectedService: service });
                                    setShowServiceDropdown(false);
                                  }
                                }}
                                className={`w-full px-4 py-3 text-left transition-colors ${colorClasses} ${
                                  formData.selectedService === service ? 'bg-warm-soft' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Status dot */}
                                  <div
                                    className={`h-2 w-2 flex-none rounded-full ${statusDot}`}
                                  ></div>
                                  <div className="flex-1">
                                    <div className="font-medium">{displayText}</div>
                                    {statusText && (
                                      <div
                                        className={`mt-0.5 text-xs ${
                                          isFull ? '' : 'font-semibold text-green-700'
                                        }`}
                                      >
                                        {statusText}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Click outside to close dropdown */}
                {showServiceDropdown && (
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowServiceDropdown(false)}
                  ></div>
                )}
              </div>

              {/* Transport */}
              <div>
                <label className="mb-2 block text-sm font-medium">Transporte</label>
                <div className="has-checked:border-ink has-checked:bg-warm-soft flex min-h-[52px] items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 transition-colors">
                  <input
                    type="checkbox"
                    id="hasTransport"
                    checked={formData.hasTransport}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hasTransport: e.target.checked,
                        transportSlots: '',
                      })
                    }
                    className="accent-ink h-5 w-5 flex-none cursor-pointer"
                  />
                  <label htmlFor="hasTransport" className="flex-1 cursor-pointer py-3 text-base">
                    ¿Cuentas con transporte propio para el evento?
                  </label>
                </div>
              </div>

              {/* Transport Slots - Conditional */}
              {formData.hasTransport && (
                <div className="border-line bg-paper rounded-xl border p-4 sm:ml-8">
                  <label className="mb-2 block text-sm font-medium">
                    ¿Cuántos cupos tienes disponibles para llevar a otros voluntarios?{' '}
                    <span className="text-[#b3261e]">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.transportSlots}
                    onChange={(e) => setFormData({ ...formData, transportSlots: e.target.value })}
                    placeholder="Número de cupos"
                  />
                </div>
              )}

              {/* Diet Type */}
              {/* <div>
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
              </div> */}

              {/* Turnstile Captcha */}
              <div className="flex justify-center">
                <div ref={turnstileRef} />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || !turnstileToken}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
                      {alreadyRegistered ? 'Actualizando...' : 'Registrando...'}
                    </span>
                  ) : alreadyRegistered ? (
                    'Actualizar mi Registro'
                  ) : (
                    'Registrarme como Voluntario'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
