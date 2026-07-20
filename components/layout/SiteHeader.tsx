import { ENTITY } from '@/config/entity';
import { UI } from '@/content/ui-strings';
import { publishedPortals } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import type { Locale, RouteId } from '@/lib/types';
import { LocaleSwitch } from './LocaleSwitch';
import { MobileNav } from './MobileNav';

export interface SiteHeaderProps {
  locale: Locale;
  routeId: RouteId;
}

export function SiteHeader({ locale, routeId }: SiteHeaderProps): JSX.Element {
  const portals = publishedPortals();
  const navItems = portals.map((portal) => ({
    id: (`portal.${portal.id}`) as RouteId,
    label: t(portal.title, locale),
  }));

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-bone focus:p-2 focus:text-ink font-mono text-xs uppercase"
      >
        {t(UI.a11y.skipToContent, locale)}
      </a>
      <header className="border-b border-hair">
        <div className="mx-auto max-w-5xl px-6 md:px-8 py-4 flex items-center justify-between">
          <a
            href={href('home', locale)}
            className="font-display text-lg font-semibold text-ink"
          >
            {ENTITY.entity.tradeName}
          </a>
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={href(item.id, locale)}
                className="font-sans text-sm text-ink"
              >
                {item.label}
              </a>
            ))}
            <LocaleSwitch locale={locale} routeId={routeId} />
          </div>
          <div className="md:hidden">
            <MobileNav
              items={navItems.map((item) => ({
                href: href(item.id, locale),
                label: item.label,
              }))}
              menuLabel={t(UI.nav.menu, locale)}
              closeLabel={t(UI.nav.close, locale)}
            >
              <LocaleSwitch locale={locale} routeId={routeId} />
            </MobileNav>
          </div>
        </div>
      </header>
    </>
  );
}
