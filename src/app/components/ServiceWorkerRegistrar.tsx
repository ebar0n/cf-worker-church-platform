'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker so the site opens without connectivity
 * (volunteers install it on iPads and use it in the field).
 *
 * Renders nothing and never throws: a failed registration must not take the
 * page down.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    // Skip in local development: a service worker caching /_next/static breaks
    // Turbopack hot reload. Registered only in production builds, or when the
    // build runs against a non-localhost host (preview / deployed worker).
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    const shouldRegister = process.env.NODE_ENV === 'production' || !isLocalhost;
    if (!shouldRegister) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  }, []);

  return null;
}
