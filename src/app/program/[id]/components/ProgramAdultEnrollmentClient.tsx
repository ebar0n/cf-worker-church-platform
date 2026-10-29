'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CircleCheck } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import ProgramEventInfo from '@/app/program/[id]/components/ProgramEventInfo';

interface Props {
  programId: number;
  programTitle: string;
  programContent: string | null;
  departmentName: string;
  departmentImage: string;
  imageUrl: string | null;
  eventDate: string | null;
  eventTime: string | null;
}

const INPUT_CLASS =
  'h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-ink placeholder:text-gray-500 focus-visible:border-denim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-denim/25';
const LABEL_CLASS = 'mb-2 block text-sm font-medium text-ink';
const CARD_CLASS = 'rounded-2xl border border-line bg-white p-6 md:p-8';

// Enrollment for adult programs (every department except children and clubs):
// the document ID is enough for known members; newcomers add name + phone.
export default function ProgramAdultEnrollmentClient({
  programId,
  programTitle,
  programContent,
  departmentName,
  departmentImage,
  imageUrl,
  eventDate,
  eventTime,
}: Props) {
  const [documentID, setDocumentID] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [needsDetails, setNeedsDetails] = useState(false);
  const [result, setResult] = useState<{ name: string; alreadyEnrolled: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const turnstileRef = useRef<HTMLDivElement>(null);
  const [siteKey, setSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const widgetRendered = useRef(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentID: documentID.trim(),
          ...(needsDetails && { name, phone }),
          token: turnstileToken,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        needsDetails?: boolean;
        name?: string;
        alreadyEnrolled?: boolean;
      };
      if (!res.ok) throw new Error(data.error || 'Error al procesar la inscripción');
      if (data.needsDetails) {
        setNeedsDetails(true);
      } else {
        setResult({ name: data.name || '', alreadyEnrolled: Boolean(data.alreadyEnrolled) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la inscripción');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-paper min-h-screen">
      <div className="mx-auto w-full max-w-[880px] px-5 py-10 md:px-8 lg:py-16">
        {/* Hero */}
        <div className="mb-10 flex flex-col gap-5">
          <span className="border-line inline-flex items-center gap-2 self-start rounded-full border bg-white px-3 py-1.5 text-[13px] font-medium">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={departmentImage}
              alt={`Logo ${departmentName}`}
              className="h-6 w-6 object-contain grayscale"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {departmentName}
          </span>
          <h1 className="text-[40px] leading-[1.04] lg:text-[56px]">{programTitle}</h1>
          <ProgramEventInfo
            title={programTitle}
            imageUrl={imageUrl}
            eventDate={eventDate}
            eventTime={eventTime}
          />

          {programContent && (
            <div className={CARD_CLASS}>
              <h3 className="mb-3 text-2xl">Detalles</h3>
              <div className="whitespace-pre-wrap text-base leading-[1.7]">{programContent}</div>
            </div>
          )}
        </div>

        {error && (
          <div className="border-line mb-6 flex items-start gap-3 rounded-xl border bg-white p-4 text-[15px] text-[#b3261e]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
            {error}
          </div>
        )}

        {result ? (
          <div className={`${CARD_CLASS} text-center`}>
            <CircleCheck className="mx-auto mb-4 h-12 w-12 text-green-700" strokeWidth={1.5} />
            <h2 className="text-[28px] leading-tight md:text-[32px]">
              {result.alreadyEnrolled ? 'Ya estabas inscrito/a' : '¡Inscripción completada!'}
            </h2>
            <p className="text-ink-soft mt-3">
              <span className="text-ink font-semibold">{result.name}</span>, quedaste inscrito/a en{' '}
              <strong className="text-ink">{programTitle}</strong>. ¡Te esperamos!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={CARD_CLASS}>
            <h2 className="text-[28px] leading-tight md:text-[32px]">Inscríbete</h2>
            <p className="text-ink-soft mb-6 mt-2">
              {needsDetails
                ? 'No encontramos tu documento. Completa tu nombre y teléfono para inscribirte.'
                : 'Ingresa tu número de documento para inscribirte.'}
            </p>
            <div className="space-y-5">
              <div>
                <label htmlFor="adult-document" className={LABEL_CLASS}>
                  Número de documento <span className="text-[#b3261e]">*</span>
                </label>
                <input
                  id="adult-document"
                  value={documentID}
                  onChange={(e) => {
                    setDocumentID(e.target.value);
                    setNeedsDetails(false);
                  }}
                  className={INPUT_CLASS}
                  placeholder="Ej: 12345678"
                  inputMode="numeric"
                  required
                />
              </div>
              {needsDetails && (
                <>
                  <div>
                    <label htmlFor="adult-name" className={LABEL_CLASS}>
                      Nombre completo <span className="text-[#b3261e]">*</span>
                    </label>
                    <input
                      id="adult-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={INPUT_CLASS}
                      minLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="adult-phone" className={LABEL_CLASS}>
                      Teléfono <span className="text-[#b3261e]">*</span>
                    </label>
                    <input
                      id="adult-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Ej: 3001234567"
                      inputMode="tel"
                      minLength={5}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <div ref={turnstileRef} className="mt-6 flex" />
            {turnstileToken && (
              <p className="mt-2 text-sm text-green-700">✓ Verificación completada</p>
            )}
            <Button
              type="submit"
              disabled={busy || !documentID.trim() || !turnstileToken}
              size="lg"
              className="mt-6 w-full"
            >
              {busy ? 'Enviando...' : 'Inscribirme'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
