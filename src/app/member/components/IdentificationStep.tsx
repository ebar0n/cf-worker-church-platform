import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

interface TurnstileConfig {
  siteKey: string;
}

interface IdentificationStepProps {
  documentID: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheck: () => void;
  loading: boolean;
  isExisting: boolean;
  registerInfo: { createdAt: string; updatedAt: string } | null;
  error: string | null;
  termsAccepted: boolean;
  turnstileToken: string;
  onTurnstileChange: (token: string) => void;
}

export default function IdentificationStep({
  documentID,
  onChange,
  onCheck,
  loading,
  isExisting,
  registerInfo,
  error,
  termsAccepted,
  turnstileToken,
  onTurnstileChange,
}: IdentificationStepProps) {
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [siteKey, setSiteKey] = useState<string>('');
  const [widgetRendered, setWidgetRendered] = useState<boolean>(false);

  useEffect(() => {
    // Obtener la site key desde el backend
    const fetchSiteKey = async () => {
      try {
        const response = await fetch('/api/turnstile-config');
        const data = (await response.json()) as TurnstileConfig;
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

  useEffect(() => {
    if (!siteKey || widgetRendered) {
      return;
    }

    // Cargar el script de Turnstile si no está ya cargado
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        renderTurnstileWidget();
      };
    } else {
      renderTurnstileWidget();
    }
  }, [siteKey, onTurnstileChange, widgetRendered]);

  // Fallback for lost widget callbacks (e.g. after transient error 600010):
  // Turnstile mirrors the token into a hidden input, so sync from it
  useEffect(() => {
    const interval = setInterval(() => {
      const value = turnstileRef.current?.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]'
      )?.value;
      if (value) {
        onTurnstileChange(value);
      }
    }, 1500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderTurnstileWidget = () => {
    if (turnstileRef.current && window.turnstile) {
      window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onTurnstileChange(token);
        },
        'expired-callback': () => {
          onTurnstileChange('');
        },
        'error-callback': () => {
          // Transient widget errors (e.g. 600010) can strand the flow:
          // reset so Turnstile retries with a fresh instance
          onTurnstileChange('');
          setTimeout(() => {
            if (window.turnstile && turnstileRef.current) {
              try {
                window.turnstile.reset(turnstileRef.current);
              } catch {
                // widget already gone
              }
            }
          }, 2000);
        },
        appearance: 'always',
        theme: 'light',
        language: 'es',
      });

      setWidgetRendered(true);
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[28px] leading-[1.15] md:text-[32px]">Identificación</h2>
        <p className="text-ink-soft text-[15px] md:text-base">
          Ingresa tu documento de identidad para comenzar
        </p>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <label htmlFor="documentID" className="text-sm font-medium">
          Número de documento
        </label>
        <Input
          id="documentID"
          name="documentID"
          type="text"
          value={documentID}
          onChange={onChange}
          placeholder="Número de documento"
          autoComplete="off"
          required
        />
        <span className="text-ink-soft text-[13px]">
          (Ejemplo: registro civil, cédula, pasaporte o cualquier documento legal vigente que
          permita identificarte)
        </span>
      </div>

      {error && (
        <div className="border-line flex items-center gap-3 rounded-xl border bg-white p-4 text-[15px] font-medium text-[#b3261e]">
          <AlertCircle className="h-5 w-5 flex-none" strokeWidth={1.5} />
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="termsAccepted"
          name="termsAccepted"
          checked={termsAccepted}
          onChange={onChange}
          className="accent-ink h-5 w-5 flex-none"
        />
        <label htmlFor="termsAccepted" className="text-base">
          Acepto los{' '}
          <a href="/privacy" target="_blank" className="text-denim hover:text-ink underline">
            términos y condiciones
          </a>
        </label>
      </div>

      {/* Turnstile Widget */}
      <div className="flex">
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

      <div className="border-line flex justify-end border-t pt-6">
        <Button
          type="button"
          size="lg"
          onClick={onCheck}
          disabled={loading || !documentID || !termsAccepted || !turnstileToken}
          className="w-full md:w-auto"
        >
          {loading ? 'Buscando...' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
}
