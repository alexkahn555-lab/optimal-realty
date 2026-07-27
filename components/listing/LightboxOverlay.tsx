'use client';

import { useCallback, useEffect } from 'react';

import type { LightboxAsset, LightboxLabels } from './LightboxShell';

/**
 * Lightbox OVERLAY — fetched by LightboxShell via import() inside the click
 * handler, so this chunk is NEVER part of any route's initial load (asserted
 * in e2e). Shows the original committed asset (≤600 KB pipeline contract) at
 * full size with prev/next/close and keyboard support.
 */
export function LightboxOverlay({
  assets,
  index,
  labels,
  onNavigate,
  onClose,
}: {
  assets: LightboxAsset[];
  index: number;
  labels: LightboxLabels;
  onNavigate: (index: number) => void;
  onClose: () => void;
}): JSX.Element | null {
  const count = assets.length;
  const prev = useCallback(
    () => onNavigate((index - 1 + count) % count),
    [index, count, onNavigate]
  );
  const next = useCallback(
    () => onNavigate((index + 1) % count),
    [index, count, onNavigate]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') prev();
      if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  const asset = assets[index];
  if (!asset) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={asset.alt}
      className="fixed inset-0 z-50 flex flex-col bg-marine/95 p-4"
      data-testid="lightbox-overlay"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-xs uppercase tracking-wider text-bone underline"
        >
          {labels.close}
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center py-2">
        {/* Plain <img> of the original pipeline asset (already size-capped):
            the overlay bypasses the optimizer by design — full-res view. */}
        <img
          src={asset.src}
          width={asset.w}
          height={asset.h}
          alt={asset.alt}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          className="font-mono text-xs uppercase tracking-wider text-bone underline"
        >
          {labels.prev}
        </button>
        <span className="font-mono text-xs tabular-nums text-bone">
          {`${index + 1} / ${count}`}
        </span>
        <button
          type="button"
          onClick={next}
          className="font-mono text-xs uppercase tracking-wider text-bone underline"
        >
          {labels.next}
        </button>
      </div>
    </div>
  );
}
