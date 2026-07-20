export interface PlaceholderTKProps {
  id?: string;
}

export function PlaceholderTK({ id }: PlaceholderTKProps): JSX.Element | null {
  if (process.env.CONTENT_STRICT === '1') return null;

  return (
    <span className="font-mono text-xs uppercase tracking-wider text-marine border-b border-dashed border-hair">
      {id ? `⟨ TK · ${id} ⟩` : '⟨ TK ⟩'}
    </span>
  );
}
