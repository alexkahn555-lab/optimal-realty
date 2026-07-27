'use client';

import dynamic from 'next/dynamic';

/**
 * LAZY BOUNDARY for the map facade island — the same split-point pattern as
 * LeadFormLazy / MediaImageLazy, for the same Part 8 reason: only this stub
 * sits in shared entries; the facade chunk is fetched (and SSR-preloaded, so
 * the gate weighs it) only on URLs that render M10.
 */
export const MapEmbed = dynamic(() =>
  import('./MapEmbedClient').then((mod) => mod.MapEmbedClient)
);
