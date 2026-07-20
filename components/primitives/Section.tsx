import type { ReactNode } from 'react';

export interface SectionProps {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div';
}

export function Section({
  children,
  className,
  as = 'section',
}: SectionProps): JSX.Element {
  const Component = as;

  return (
    <Component
      className={['mx-auto w-full max-w-5xl px-6 md:px-8', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Component>
  );
}
