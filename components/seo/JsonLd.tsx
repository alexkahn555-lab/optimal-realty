export interface JsonLdProps {
  // Any JSON-serializable node/graph: the entity JsonLdGraph, a BreadcrumbList,
  // or a FAQPage node all satisfy `object`.
  graph: object;
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
