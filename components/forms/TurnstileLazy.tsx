'use client';

import { useEffect, useRef } from 'react';

import type { Locale } from '@/lib/types';

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      language: Locale;
      callback: (token: string) => void;
      'expired-callback': () => void;
      theme: 'light';
    },
  ): string;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScript: Promise<void> | undefined;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstileScript) return turnstileScript;

  turnstileScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]',
    );
    const script = existing ?? document.createElement('script');

    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(), { once: true });

    if (!existing) {
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return turnstileScript;
}

export interface TurnstileLazyProps {
  locale: Locale;
  onToken: (token: string) => void;
}

export function TurnstileLazy({
  locale,
  onToken,
}: TurnstileLazyProps): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    const container = containerRef.current;
    if (!siteKey || !container) return;

    let active = true;
    const render = () => {
      if (!active || !window.turnstile) return;
      window.turnstile.render(container, {
        sitekey: siteKey,
        language: locale,
        callback: onToken,
        'expired-callback': () => onToken(''),
        theme: 'light',
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (window.turnstile) render();
        else void loadTurnstile().then(render).catch(() => undefined);
      },
      { rootMargin: '200px' },
    );

    observer.observe(container);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [locale, onToken, siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
}
