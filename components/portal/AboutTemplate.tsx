import { ENTITY, LICENSE_LABEL, POSITIONING } from '@/config/entity';
import { ABOUT_ANSWER, ABOUT_BIO } from '@/content/about';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { AnswerBlock, Breadcrumbs, PlaceholderTK } from '@/components/seo';
import { Heading, Prose, Section } from '@/components/primitives';
import type { Locale, Localized } from '@/lib/types';

/**
 * ABOUT TEMPLATE (RSC, zero JS — D5). Confirmed facts only, rendered as
 * hairline dl rows: licenses from config/entity.ts, FSU economics, USMC
 * service, the NAR designation COUNT (the individual list is pending D-03 and
 * renders a placeholder, never an invented list), single-agency standard,
 * service area. Biography is broker voice — placeholder until supplied. The
 * ProfilePage JSON-LD graph is assembled by the page, not here.
 */

export interface AboutTemplateProps {
  locale: Locale;
}

const TK = /\bTK_/;
const isTK = (value: Localized): boolean => TK.test(value.en) || TK.test(value.es);

function FactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-1 border-b border-hair py-4 md:flex-row md:items-baseline md:justify-between">
      <dt className="font-mono text-xs uppercase tracking-wide text-marine">
        {label}
      </dt>
      <dd className="font-sans text-ink">{children}</dd>
    </div>
  );
}

export function AboutTemplate({ locale }: AboutTemplateProps): JSX.Element {
  return (
    <Section className="py-16 md:py-24">
      <div className="space-y-12">
        <Breadcrumbs
          items={[
            { id: 'home', label: UI.breadcrumb.home },
            { id: 'about', label: UI.nav.about },
          ]}
          locale={locale}
        />
        <Heading level={1}>{t(ABOUT_ANSWER.question, locale)}</Heading>
        <AnswerBlock block={ABOUT_ANSWER} locale={locale} />

        <dl>
          {ENTITY.entity.licenses.map((license) =>
            !TK.test(LICENSE_LABEL[license.role]) && !TK.test(license.number) ? (
              <FactRow key={license.role} label={LICENSE_LABEL[license.role]}>
                <span className="font-mono text-sm tabular-nums text-ink">
                  {license.number}
                </span>
              </FactRow>
            ) : null
          )}
          <FactRow label={t(UI.about.education, locale)}>
            {POSITIONING.education}
          </FactRow>
          <FactRow label={t(UI.about.militaryService, locale)}>
            {POSITIONING.militaryService}
          </FactRow>
          <FactRow label={t(UI.about.designations, locale)}>
            {String(POSITIONING.narDesignationCount)}
            {POSITIONING.narDesignations.length === 0 ? (
              <>
                {' '}
                <PlaceholderTK />
              </>
            ) : (
              ` · ${POSITIONING.narDesignations.join(' · ')}`
            )}
          </FactRow>
          <FactRow label={t(UI.about.standard, locale)}>
            {t(UI.about.standardFact, locale)}
          </FactRow>
          <FactRow label={t(UI.about.serviceArea, locale)}>
            {POSITIONING.serviceArea}
          </FactRow>
        </dl>

        {isTK(ABOUT_BIO) ? (
          <PlaceholderTK id={ABOUT_BIO.en} />
        ) : (
          <Prose>{t(ABOUT_BIO, locale)}</Prose>
        )}
      </div>
    </Section>
  );
}
