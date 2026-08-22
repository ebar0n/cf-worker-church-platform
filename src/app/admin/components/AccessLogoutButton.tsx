'use client';

import { useEffect, useRef, useState } from 'react';

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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
          />
        </svg>
        <span className="hidden md:inline">Salir</span>
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cerrar sesión"
          onClick={() => setConfirming(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-lg bg-white p-5 text-left shadow-xl"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              ¿Cerrar la sesión de este dispositivo?
            </h2>
            <p className="mt-1 text-sm text-gray-600">Volver a entrar pide un código nuevo.</p>

            {warning && (
              <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {warning}. Sin sesión no se pueden enviar.
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={logout}
                disabled={leaving}
                className="h-12 rounded-lg bg-[#4b207f] text-base font-medium text-white hover:bg-[#3b1965] disabled:opacity-60"
              >
                {leaving ? 'Cerrando…' : 'Cerrar sesión'}
              </button>
              <a
                href="/"
                className="flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-white text-base text-gray-700 hover:bg-gray-50"
              >
                Solo ir al inicio
              </a>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={leaving}
                className="h-12 rounded-lg text-base text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
