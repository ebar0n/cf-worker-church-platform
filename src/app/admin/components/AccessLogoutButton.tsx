'use client';

import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

/**
 * Closes the Cloudflare Access session, which is what "Salir" has to mean on a
 * shared iPad: navigating to "/" leaves the CF_Authorization cookie in place, so
 * the next volunteer inherits the previous one's identity — and every survey
 * they capture would be attributed to that person.
 *
 * It asks first, in a dialog. Ending the session is destructive (getting back in
 * means a new one-time PIN) and on a tablet held in one hand the button sits
 * where a thumb rests. The dialog also separates the two intentions behind that
 * tap: leaving the screen and ending the session.
 *
 * The logout endpoint is fetched instead of navigated to: its response is a
 * Cloudflare page, and in an installed app (no browser chrome, no back button)
 * that page is a dead end. Fetching applies the cookie-clearing headers and we
 * do the navigation ourselves.
 */
export default function AccessLogoutButton({
  className = '',
  /** Shown inside the dialog, e.g. surveys still queued on the device. */
  warning,
}: {
  className?: string;
  warning?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // An unanswered dialog should not stay armed: coming back to a tablet that was
  // left open and tapping once more must not sign anyone out.
  useEffect(() => {
    if (!confirming) return;

    timer.current = setTimeout(() => setConfirming(false), 15000);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirming(false);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener('keydown', onKey);
    };
  }, [confirming]);

  const logout = async () => {
    setLeaving(true);
    try {
      await fetch('/cdn-cgi/access/logout', { credentials: 'include' });
    } catch {
      // No signal, or Access not in front of this deployment (local dev): the
      // navigation below still gets the volunteer out of the capture screen.
    }
    window.location.replace('/');
  };

  return (
    <>
      <button type="button" onClick={() => setConfirming(true)} className={className}>
        <LogOut className="h-5 w-5" strokeWidth={1.5} />
        <span className="hidden md:inline">Salir</span>
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cerrar sesión"
          onClick={() => setConfirming(false)}
          className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="border-line w-full max-w-sm rounded-2xl border bg-white p-6 text-left"
          >
            <h2 className="text-ink text-2xl leading-tight">
              ¿Cerrar la sesión de este dispositivo?
            </h2>
            <p className="text-ink-soft mt-2 text-sm">Volver a entrar pide un código nuevo.</p>

            {warning && (
              <p className="border-warm/40 bg-warm-soft text-ink mt-4 rounded-xl border px-3 py-2 text-sm">
                {warning}. Sin sesión no se pueden enviar.
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <Button type="button" size="lg" onClick={logout} disabled={leaving}>
                {leaving ? 'Cerrando…' : 'Cerrar sesión'}
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/">Solo ir al inicio</a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => setConfirming(false)}
                disabled={leaving}
                className="text-ink-soft"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
