// PHASE 1 STUB — replaced by HomeRouter in Phase 4

import type { Metadata } from 'next';
import type { Locale } from '@/lib/types';
import { ENTITY, LICENSE_LABEL } from '@/config/entity';
import { UI } from '@/content/ui-strings';
import { metaFor } from '@/lib/seo/meta';
import { Section, Heading, Hairline } from '@/components/primitives';

interface PageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  // No title → the layout's default title (bare site name) applies.
  return metaFor({ id: 'home', description: UI.home.metaDescription }, locale as Locale);
}

export default function HomeStub() {
  // Stub content is locale-invariant (trade name + license numbers).
  return (
    <Section className="py-16 md:py-24 space-y-8">
      <Heading level={1}>{ENTITY.entity.tradeName}</Heading>
      <Hairline />
      <div className="space-y-1">
        {ENTITY.entity.licenses.map((license) => (
          <div key={license.role} className="font-mono text-sm tabular-nums text-ink">
            {`${LICENSE_LABEL[license.role]} · ${license.number}`}
          </div>
        ))}
      </div>
    </Section>
  );
}
