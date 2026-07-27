'use client';

import { useRef, useState, type ComponentType, type ReactNode } from 'react';

/**
 * Lightbox SHELL — the only lightbox code in a route's initial load, kept
 * deliberately tiny: it wraps the SERVER-RENDERED gallery tiles (children
 * pass through untouched) and captures image clicks. The overlay module is
 * fetched via import() inside the click handler — its chunk loads on FIRST
 * CLICK, never before (the e2e asserts a new chunk request happens only after
 * click). Enter through LightboxLazy only.
 */

export interface LightboxAsset {
  src: string;
  w: number;
  h: number;
  alt: string;
}

export interface LightboxLabels {
  close: string;
  prev: string;
  next: string;
}

type OverlayComponent = ComponentType<{
  assets: LightboxAsset[];
  index: number;
  labels: LightboxLabels;
  onNavigate: (index: number) => void;
  onClose: () => void;
}>;

export function LightboxShell({
  assets,
  labels,
  children,
}: {
  assets: LightboxAsset[];
  labels: LightboxLabels;
  children: ReactNode;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [Overlay, setOverlay] = useState<OverlayComponent | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  const onClickCapture = async (
    event: React.MouseEvent<HTMLDivElement>
  ): Promise<void> => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement) || !containerRef.current) return;
    const images = Array.from(containerRef.current.querySelectorAll('img'));
    const clicked = images.indexOf(target);
    if (clicked < 0) return;
    // First click pays the (deferred) overlay chunk; later clicks reuse it.
    const mod = await import('./LightboxOverlay');
    setOverlay(() => mod.LightboxOverlay);
    setIndex(clicked);
  };

  return (
    <div
      ref={containerRef}
      onClickCapture={onClickCapture}
      className="cursor-zoom-in"
    >
      {children}
      {Overlay !== null && index !== null ? (
        <LightboxPortalCursorReset>
          <Overlay
            assets={assets}
            index={index}
            labels={labels}
            onNavigate={setIndex}
            onClose={() => setIndex(null)}
          />
        </LightboxPortalCursorReset>
      ) : null}
    </div>
  );
}

/** Overlay lives inside the zoom-cursor wrapper; reset the cursor for it. */
function LightboxPortalCursorReset({ children }: { children: ReactNode }): JSX.Element {
  return <div className="cursor-default">{children}</div>;
}
