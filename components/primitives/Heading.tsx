import type { ReactNode } from 'react';

export interface HeadingProps {
  level: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
  id?: string;
}

const levelClasses = {
  1: 'text-4xl font-semibold md:text-5xl',
  2: 'text-2xl font-semibold md:text-3xl',
  3: 'text-xl font-medium md:text-2xl',
  4: 'text-lg font-medium',
} as const;

export function Heading({
  level,
  children,
  className,
  id,
}: HeadingProps): JSX.Element {
  const Component = `h${level}` as const;

  return (
    <Component
      className={[
        'text-balance font-display text-ink',
        levelClasses[level],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      id={id}
    >
      {children}
    </Component>
  );
}
