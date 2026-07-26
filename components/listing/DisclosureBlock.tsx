import { ENTITY, LICENSE_LABEL } from '@/config/entity';
import { LISTING_DISCLOSURE } from '@/content/listings/disclosure';
import { localizedClean } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { PlaceholderTK } from '@/components/seo/PlaceholderTK';
import { Hairline } from '@/components/primitives';

/**
 * Disclosure block (M14 zone). Zero JS. The license line is assembled from
 * config/entity.ts confirmed facts (founder + the three FL licenses — single
 * source, Part 2.5). The brokerage-relationship notice is attorney/broker copy
 * and stays a TK_ marker in content/listings/disclosure.ts until supplied:
 * previews show a visible PlaceholderTK, production strict mode renders
 * nothing — never generated prose.
 */
export function DisclosureBlock({ locale }: { locale: Locale }): JSX.Element {
  const { entity } = ENTITY;
  const licenseLine = [
    entity.founder.name,
    ...entity.licenses.map(
      (license) => `${LICENSE_LABEL[license.role]} ${license.number}`
    ),
  ].join(' · ');

  const notice = LISTING_DISCLOSURE.brokerageRelationshipNotice;

  return (
    <section>
      <Hairline />
      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-marine">
        {licenseLine}
      </p>
      <div className="mt-3 max-w-prose font-sans text-xs text-marine">
        {localizedClean(notice) ? (
          <p>{t(notice, locale)}</p>
        ) : (
          <PlaceholderTK id="BROKERAGE_RELATIONSHIP_NOTICE" />
        )}
      </div>
    </section>
  );
}
