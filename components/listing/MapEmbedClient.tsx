'use client';

import { useState } from 'react';

/**
 * Client LEAF for the map facade (M10) — enter through MapEmbedLazy only.
 * The single largest third-party LCP threat on the report is an eager map
 * embed, so NOTHING third-party loads until the visitor clicks: the initial
 * render is a static facade (server-rendered via SSR of this component), and
 * the click swaps in an OpenStreetMap iframe embed — no map SDK, no script,
 * just the iframe. Budget ≤2 KB gzipped (enforced in tests).
 */
export interface MapEmbedClientProps {
  lat: number;
  lng: number;
  /** Locality line shown on the facade (already privacy-safe). */
  label: string;
  loadLabel: string;
  sourceLabel: string;
  iframeTitle: string;
}

const D = 0.004; // embed bbox half-width in degrees (~400 m)

export function MapEmbedClient({
  lat,
  lng,
  label,
  loadLabel,
  sourceLabel,
  iframeTitle,
}: MapEmbedClientProps): JSX.Element {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    const bbox = [lng - D, lat - D, lng + D, lat + D].join('%2C');
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
    return (
      <iframe
        src={src}
        title={iframeTitle}
        className="aspect-[3/2] w-full border border-hair"
        loading="lazy"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="block aspect-[3/2] w-full border border-hair bg-bone"
    >
      <span className="flex h-full w-full flex-col items-center justify-center gap-2">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 fill-none stroke-marine"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path d="M12 21s-6.5-5.5-6.5-10a6.5 6.5 0 0 1 13 0c0 4.5-6.5 10-6.5 10Z" />
          <circle cx="12" cy="10.5" r="2.5" />
        </svg>
        <span className="font-sans text-sm text-ink">{label}</span>
        <span className="font-mono text-xs uppercase tracking-wider text-marine underline">
          {loadLabel}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-marine">
          {sourceLabel}
        </span>
      </span>
    </button>
  );
}
