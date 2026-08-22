'use client';

import { useEffect, useState } from 'react';

/**
 * Reload control for the installed app. A standalone web app has no browser
 * chrome, so there is no reload button and tapping the logo while already on the
 * same URL looks like nothing happened. In a normal tab this renders nothing:
 * the browser already provides the gesture.
 */
export default function ReloadInAppButton() {
  const [standalone, setStandalone] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    const installed =
      // matchMedia is missing in jsdom, and this component renders on every page
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      // iOS reports it here instead of through display-mode
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(installed);
  }, []);

  if (!standalone) return null;

  return (
    <button
      type="button"
      title="Actualizar"
      aria-label="Actualizar"
      onClick={() => {
        setReloading(true);
        window.location.reload();
      }}
      className="rounded-lg p-3 text-white transition-colors hover:bg-white/10"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`h-5 w-5 ${reloading ? 'animate-spin' : ''}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
    </button>
  );
}
