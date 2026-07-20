import type { ReactNode } from 'react';

export interface ProseProps {
  children: ReactNode;
  className?: string;
}

export function Prose({ children, className }: ProseProps): JSX.Element {
  return (
    <div
      className={[
        'max-w-prose space-y-4 font-sans leading-relaxed text-ink',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
