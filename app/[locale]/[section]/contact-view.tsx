import type { Locale } from '@/lib/types';
import { ENTITY, LICENSE_LABEL } from '@/config/entity';
import { SITE_ORIGIN } from '@/config/origin';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import { AnswerBlock, JsonLd } from '@/components/seo';
import { LeadForm } from '@/components/forms/LeadFormLazy';
import { Hairline, Heading, Section } from '@/components/primitives';

/**
 * CONTACT VIEW — the [section] router's contact branch, split out of the page
 * module so the router's static graph stays island-free. LeadForm enters
 * through the LeadFormLazy client boundary, never the static island: all
 * [section] URLs share one page entry, and a static island import would ride
 * the form into the form-less tools hub and about page (Part 8: islands ship
 * only where used).
 */

/** Answer freshness date — bump when the answer copy changes. */
const CONTACT_ANSWER_UPDATED = '2026-07-20' as const;

const TK = /\bTK_/;

/** Flat TK omission for the JSON-LD nodes below (page-local; entity graph has its own). */
function withoutTk(node: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, value]) => typeof value !== 'string' || !TK.test(value)
    )
  );
}

/** ContactPage + ContactPoint, merged onto the entity graph via the #agent @id. */
function contactGraph(locale: Locale): object {
  const url = `${SITE_ORIGIN}${href('contact', locale)}`;
  const agentId = `${SITE_ORIGIN}/#agent`;

  const page = {
    '@type': 'ContactPage',
    '@id': `${url}#contactpage`,
    url,
    name: t(UI.contact.question, locale),
    inLanguage: locale,
    dateModified: CONTACT_ANSWER_UPDATED,
    about: { '@id': agentId },
  };

  const contactPoint = withoutTk({
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['en', 'es'],
    telephone: ENTITY.entity.phone,
    email: ENTITY.entity.email,
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [page, { '@type': 'RealEstateAgent', '@id': agentId, contactPoint }],
  };
}

export function ContactView({ locale }: { locale: Locale }): JSX.Element {
  const { address } = ENTITY.entity;
  const addressLine = !TK.test(address.line1)
    ? [address.line1, address.city, address.state, address.zip]
        .filter((value) => !TK.test(value))
        .join(', ')
    : null;

  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-8">
        <Heading level={1}>{t(UI.contact.question, locale)}</Heading>
        <AnswerBlock
          block={{
            question: UI.contact.question,
            answer: UI.contact.answer,
            updated: CONTACT_ANSWER_UPDATED,
          }}
          locale={locale}
        />
        <Hairline />
        <div className="grid gap-12 md:grid-cols-[3fr,2fr]">
          <div className="space-y-8">
            <LeadForm locale={locale} sourceType="contact" />
          </div>
          <div className="space-y-8">
            <div className="space-y-8">
              {!TK.test(ENTITY.entity.tradeName) && (
                <p className="font-display text-lg text-ink">{ENTITY.entity.tradeName}</p>
              )}
              <div className="space-y-1 text-ink">
                {!TK.test(ENTITY.entity.phone) && <p>{ENTITY.entity.phone}</p>}
                {!TK.test(ENTITY.entity.email) && <p>{ENTITY.entity.email}</p>}
                {addressLine && <p>{addressLine}</p>}
              </div>
            </div>
            <Hairline />
            <div className="space-y-1">
              {ENTITY.entity.licenses.map((license) =>
                !TK.test(LICENSE_LABEL[license.role]) && !TK.test(license.number) ? (
                  <div
                    key={license.role}
                    className="font-mono text-sm tabular-nums text-ink"
                  >
                    {`${LICENSE_LABEL[license.role]} · ${license.number}`}
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      </div>
      <JsonLd graph={contactGraph(locale)} />
    </Section>
  );
}
