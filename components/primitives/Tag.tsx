import type { ReactNode } from 'react';

export interface TagProps {
  children: ReactNode;
  className?: string;
}

export function Tag({ children, className }: TagProps): JSX.Element {
  return (
    <span
      className={[
        'font-mono text-xs uppercase tracking-wider text-marine',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
