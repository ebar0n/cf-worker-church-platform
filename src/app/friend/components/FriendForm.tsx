'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const initialState = {
  name: '',
  phone: '',
  address: '',
  reason: '',
  note: '',
  privacyPolicy: false,
};

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
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="text-center">
          <div className="mb-4 text-6xl">✅</div>
          <h2 className="mb-2 text-2xl font-bold text-[#4b207f]">
            ¡Solicitud enviada correctamente!
          </h2>
          <p className="text-gray-600">
            Hemos recibido tu solicitud. Nos pondremos en contacto contigo pronto.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full bg-[#4b207f] px-8 py-3 font-medium text-white shadow-md transition-colors hover:bg-[#2f557f]"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block font-semibold text-[#4b207f]">Nombre completo</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
          placeholder="Tu nombre"
          required
        />
      </div>
      <div>
        <label className="mb-1 block font-semibold text-[#4b207f]">Teléfono</label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
          placeholder="Tu teléfono"
          required
        />
      </div>
      <div>
        <label className="mb-1 block font-semibold text-[#4b207f]">Dirección (opcional)</label>
        <input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
          placeholder="Tu dirección"
        />
      </div>
      <div>
        <label className="mb-1 block font-semibold text-[#4b207f]">¿Cómo podemos ayudarte?</label>
        <select
          name="reason"
          value={form.reason}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
          required
        >
          <option value="">Selecciona una opción</option>
          <option value="oracion">Quiero que oren por mí</option>
          <option value="visita">Quiero que me visiten</option>
          <option value="informacion">Quiero más información</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block font-semibold text-[#4b207f]">Nota adicional (opcional)</label>
        <textarea
          name="note"
          value={form.note}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
          placeholder="Escribe cualquier información adicional que quieras compartir"
          rows={3}
        />
      </div>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          name="privacyPolicy"
          checked={form.privacyPolicy}
          onChange={handleChange}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-[#4b207f] focus:ring-[#4b207f]"
          required
        />
        <label className="text-sm text-gray-600">
          Acepto el{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4b207f] underline hover:text-[#e36520]"
          >
            tratamiento de mis datos personales
          </a>
        </label>
      </div>

      {/* Turnstile Widget */}
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
      </div>

      <button
        type="submit"
        className="mt-4 rounded-full bg-[#4b207f] px-8 py-3 font-medium text-white shadow-md transition-colors hover:bg-[#2f557f]"
        disabled={loading || !turnstileToken}
      >
        {loading ? 'Enviando...' : 'Enviar solicitud'}
      </button>
      {error && <div className="text-center font-semibold text-red-600">{error}</div>}
    </form>
  );
}
