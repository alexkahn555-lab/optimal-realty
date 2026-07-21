import type { Metadata } from 'next';
import { DEFAULT_LOCALE } from '@/config/origin';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import { UI } from '@/content/ui-strings';
import { fontVariables } from './fonts';
import './globals.css';

/**
 * Global 404. Because app/[locale]/layout.tsx is the root layout, this page renders
 * OUTSIDE it (for unmatched top-level paths like /fr), so it must supply its own
 * <html>/<body> and fonts. The locale is unknown at this boundary, so it renders
 * the default (x-default = en); the copy is authored in both locales in ui-strings.
 */

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function NotFound() {
  const locale = DEFAULT_LOCALE;
  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <main
          id="main-content"
          className="mx-auto max-w-5xl space-y-6 px-6 py-24 md:px-8"
        >
          <h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">
            {t(UI.notFound.heading, locale)}
          </h1>
          <a
            href={href('home', locale)}
            className="inline-block font-mono text-sm uppercase tracking-wide text-marine underline"
          >
            {t(UI.notFound.home, locale)}
          </a>
        </main>
      </body>
    </html>
  );
}
