export interface JsonLdProps {
  graph: Record<string, unknown>;
}

export function JsonLd({ graph }: JsonLdProps): JSX.Element {
  const json = JSON.stringify(graph).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
