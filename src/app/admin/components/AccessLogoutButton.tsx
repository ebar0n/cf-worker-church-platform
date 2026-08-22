'use client';

import { useState } from 'react';

/**
 * Closes the Cloudflare Access session, which is what "Salir" has to mean on a
 * shared iPad: navigating to "/" leaves the CF_Authorization cookie in place, so
 * the next volunteer inherits the previous one's identity — and every survey
 * they capture would be attributed to that person.
 *
 * The logout endpoint is fetched instead of navigated to: its response is a
 * Cloudflare page, and in an installed app (no browser chrome, no back button)
 * that page is a dead end. Fetching applies the cookie-clearing headers and we
 * do the navigation ourselves.
 */
export default function AccessLogoutButton({ className = '' }: { className?: string }) {
  const [leaving, setLeaving] = useState(false);

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
    <button type="button" onClick={logout} disabled={leaving} className={className}>
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
      <span className="hidden md:inline">{leaving ? 'Saliendo…' : 'Salir'}</span>
    </button>
  );
}
