'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Closes the Cloudflare Access session, which is what "Salir" has to mean on a
 * shared iPad: navigating to "/" leaves the CF_Authorization cookie in place, so
 * the next volunteer inherits the previous one's identity — and every survey
 * they capture would be attributed to that person.
 *
 * It asks first. Logging out is a one-tap action with an expensive undo: signing
 * back in means a new one-time PIN, and on a tablet held in one hand the button
 * sits right where a thumb rests.
 *
 * The logout endpoint is fetched instead of navigated to: its response is a
 * Cloudflare page, and in an installed app (no browser chrome, no back button)
 * that page is a dead end. Fetching applies the cookie-clearing headers and we
 * do the navigation ourselves.
 */
export default function AccessLogoutButton({
  className = '',
  /** Shown inside the confirmation, e.g. surveys still queued on the device. */
  warning,
}: {
  className?: string;
  warning?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // An unanswered confirmation should not stay armed: coming back to a tablet
  // and tapping once more must not sign you out.
  useEffect(() => {
    if (!confirming) return;

    timer.current = setTimeout(() => setConfirming(false), 8000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
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

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/90">¿Cerrar sesión?</span>
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#4b207f] hover:bg-white/90 disabled:opacity-60"
          >
            {leaving ? 'Cerrando…' : 'Sí, cerrar sesión'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={leaving}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
          >
            Cancelar
          </button>
        </div>
        {warning && <span className="text-right text-xs text-amber-200">{warning}</span>}
      </div>
    );
  }

  return (
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
  );
}
