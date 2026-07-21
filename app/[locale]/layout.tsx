import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { SITE_ORIGIN } from '@/config/origin';
import { isLocale } from '@/lib/i18n';
import { SITE_NAME, TITLE_TEMPLATE } from '@/lib/seo/meta';
import { entityGraph } from '@/lib/seo/jsonld';
import { JsonLd } from '@/components/seo';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { UTM_SNIPPET } from '@/components/forms/utm';
import { fontVariables } from '../fonts';
import '../globals.css';

/**
 * The LOCALE LAYOUT is the app's root layout (there is no app/layout.tsx): it is
 * the only place that knows the locale, so it renders <html lang> and mounts the
 * fonts, chrome, and entity JSON-LD graph once per page.
 *
 * dynamicParams=false + generateStaticParams → any non-en/es segment (e.g. /fr)
 * 404s at the routing layer; the explicit notFound() below is a belt-and-suspenders
 * validation of the segment per the dispatch.
 */

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
}

export const dynamicParams = false;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { template: TITLE_TEMPLATE, default: SITE_NAME },
};

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        {/* First-touch UTM capture — <= 0.3 KB, budget-enforced in tests. */}
        <script dangerouslySetInnerHTML={{ __html: UTM_SNIPPET }} />
        {/* Phase 1: home is the only route, so the locale switch targets home. */}
        <SiteHeader locale={locale} routeId="home" />
        <main id="main-content">{children}</main>
        <SiteFooter locale={locale} />
        <JsonLd graph={entityGraph(locale)} />
      </body>
    </html>
  );
}
