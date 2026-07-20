import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import type { Locale, RouteId } from '@/lib/types';

export interface LocaleSwitchProps {
  locale: Locale;
  routeId: RouteId;
}

export function LocaleSwitch({ locale, routeId }: LocaleSwitchProps): JSX.Element {
  return (
    <nav aria-label={t(UI.locale.switchLabel, locale)}>
      <a
        href={href(routeId, 'en')}
        aria-current={locale === 'en' ? 'true' : undefined}
        className="font-mono text-xs uppercase tracking-wide text-ink"
      >
        {t(UI.locale.en, locale)}
      </a>
      {' / '}
      <a
        href={href(routeId, 'es')}
        aria-current={locale === 'es' ? 'true' : undefined}
        className="font-mono text-xs uppercase tracking-wide text-ink"
      >
        {t(UI.locale.es, locale)}
      </a>
    </nav>
  );
}
