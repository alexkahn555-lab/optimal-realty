import { SITE_ORIGIN } from '@/config/origin';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import type { Locale, Localized, RouteId } from '@/lib/types';
import { JsonLd } from './JsonLd';

export interface Crumb {
  id: RouteId;
  label: Localized;
}

export interface BreadcrumbsProps {
  items: Crumb[];
  locale: Locale;
}

export function Breadcrumbs({ items, locale }: BreadcrumbsProps): JSX.Element | null {
  if (items.length === 0) return null;

  const node = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: t(crumb.label, locale),
      item: `${SITE_ORIGIN}${href(crumb.id, locale)}`,
    })),
  };

  return (
    <>
      <nav aria-label={t(UI.breadcrumb.ariaLabel, locale)}>
        <ol className="font-mono text-xs uppercase tracking-wider text-marine">
          {items.map((crumb, index) => {
            const label = t(crumb.label, locale);
            const isLast = index === items.length - 1;

            return (
              <li key={crumb.id} className="inline">
                {index > 0 ? ' / ' : null}
                {isLast ? (
                  <span aria-current="page">{label}</span>
                ) : (
                  <a href={href(crumb.id, locale)}>{label}</a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd graph={node} />
    </>
  );
}
