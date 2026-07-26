'use client';

import Image from 'next/image';

/**
 * Client LEAF for MediaImage — always enter through MediaImageLazy, never
 * import this directly from anything a shared page entry can reach. Props are
 * primitives only (the RSC wrapper resolves the Localized alt) so the island
 * boundary stays serializable. `unoptimized` deliberately does not exist here.
 */
export interface MediaImageClientProps {
  src: string;
  width: number;
  height: number;
  alt: string;
  sizes: string;
  quality: number;
  priority: boolean;
  className?: string;
}

export function MediaImageClient({
  src,
  width,
  height,
  alt,
  sizes,
  quality,
  priority,
  className,
}: MediaImageClientProps): JSX.Element {
  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={className}
    />
  );
}
