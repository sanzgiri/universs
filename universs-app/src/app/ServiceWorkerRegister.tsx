'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker that enables offline reading (browser Cache
 * API only — no server storage). Registration is skipped in development so
 * it doesn't interfere with hot reloading.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      typeof navigator === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* registration failed — app still works online */
      });
    };
    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
