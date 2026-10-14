'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AlertCircle, CircleCheck } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';

const initialState = {
  name: '',
  phone: '',
  address: '',
  reason: '',
  note: '',
  privacyPolicy: false,
};

const REASONS = [
  ['oracion', 'Quiero que oren por mí'],
  ['visita', 'Quiero que me visiten'],
  ['informacion', 'Quiero más información'],
] as const;

const REQUIRED = <span className="text-[#b3261e]">*</span>;

export default function FriendForm() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Turnstile widget state
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [siteKey, setSiteKey] = useState<string>('');
  const [widgetRendered, setWidgetRendered] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

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
          const widgetId = window.turnstile.render(turnstileRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            'expired-callback': () => {
              console.log('Turnstile token expired');
              setTurnstileToken('');
            },
            'error-callback': () => {
              console.log('Turnstile error occurred');
              setTurnstileToken('');
            },
            appearance: 'always',
            theme: 'light',
            language: 'es',
          });

          setWidgetRendered(true);
        }
      };
    } else if (turnstileRef.current) {
      console.log('Turnstile script already loaded, rendering widget...');
      const widgetId = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setTurnstileToken(token);
        },
        'expired-callback': () => {
          console.log('Turnstile token expired');
          setTurnstileToken('');
        },
        'error-callback': () => {
          console.log('Turnstile error occurred');
          setTurnstileToken('');
        },
        appearance: 'always',
        theme: 'light',
        language: 'es',
      });

      setWidgetRendered(true);
    }
  }, [siteKey, widgetRendered]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value =
      e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.privacyPolicy) {
      setError('Debes aceptar la política de privacidad para continuar');
      return;
    }
    if (!turnstileToken) {
      setError('Por favor, completa la verificación de seguridad');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          token: turnstileToken,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error || 'Error al enviar la solicitud');
      } else {
        setSuccess(true);
        setForm(initialState);
        setTurnstileToken('');
      }
    } catch {
      setError('Error de red o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Si la solicitud fue exitosa, mostrar solo el mensaje de éxito y el botón de inicio
  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center lg:py-12">
        <div className="bg-warm-soft flex h-14 w-14 items-center justify-center rounded-2xl">
          <CircleCheck className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-[32px] leading-[1.15]">¡Solicitud enviada correctamente!</h2>
          <p className="text-ink-soft m-0">
            Hemos recibido tu solicitud. Nos pondremos en contacto contigo pronto.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/" className="no-underline">
            Volver al inicio
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Nombre completo {REQUIRED}</span>
        <Input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Tu nombre"
          required
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Teléfono {REQUIRED}</span>
        <Input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Tu teléfono"
          required
        />
      </label>
      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium">Dirección (opcional)</span>
        <Input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Tu dirección"
        />
      </label>
      <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0 md:col-span-2">
        <legend className="mb-2 p-0 text-sm font-medium">¿Cómo podemos ayudarte? {REQUIRED}</legend>
        {REASONS.map(([value, label]) => (
          <label
            key={value}
            className="has-checked:border-ink has-checked:border-[1.5px] has-checked:bg-warm-soft has-checked:font-medium flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base transition-colors hover:border-gray-400"
          >
            <input
              type="radio"
              name="reason"
              value={value}
              checked={form.reason === value}
              onChange={handleChange}
              className="accent-ink h-5 w-5 flex-none"
              required
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium">Nota adicional (opcional)</span>
        <Textarea
          name="note"
          value={form.note}
          onChange={handleChange}
          placeholder="Escribe cualquier información adicional que quieras compartir"
          rows={3}
        />
      </label>
      <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-normal md:col-span-2">
        <input
          type="checkbox"
          name="privacyPolicy"
          checked={form.privacyPolicy}
          onChange={handleChange}
          className="accent-ink mt-px h-5 w-5 flex-none"
          required
        />
        <span>
          Acepto el{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-denim hover:text-ink underline"
          >
            tratamiento de mis datos personales
          </a>
        </span>
      </label>

      <div className="border-line flex flex-col gap-5 border-t pt-6 md:col-span-2">
        {/* Turnstile Widget */}
        <div
          ref={turnstileRef}
          id="turnstile-widget-container"
          className="turnstile-widget"
          style={{ minHeight: '65px', display: 'flex', alignItems: 'center' }}
        ></div>

        <Button
          type="submit"
          size="lg"
          className="md:self-start"
          disabled={loading || !turnstileToken}
        >
          {loading ? 'Enviando...' : 'Enviar solicitud'}
        </Button>
        {error && (
          <div className="border-line flex items-center gap-3.5 rounded-xl border bg-white p-4 text-[15px] font-medium">
            <AlertCircle className="h-5 w-5 flex-none text-[#b3261e]" strokeWidth={1.5} />
            {error}
          </div>
        )}
      </div>
    </form>
  );
}
