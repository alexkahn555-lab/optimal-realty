export interface HairlineProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Hairline({
  className,
  orientation = 'horizontal',
}: HairlineProps): JSX.Element {
  if (orientation === 'vertical') {
    return (
      <span
        aria-hidden="true"
        className={['inline-block w-px self-stretch bg-hair', className]
          .filter(Boolean)
          .join(' ')}
      />
    );
  }

  return (
    <hr
      className={['w-full border-0 border-t border-hair', className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
