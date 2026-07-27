import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/types';
import { UI } from '@/content/ui-strings';
import { isLocale } from '@/lib/i18n';
import { metaFor } from '@/lib/seo/meta';
import { HomeView } from './home-view';

/**
 * THE HOME ROUTER (Phase 4b) — /en, /es. Replaced the Phase 1 stub. The view
 * lives in home-view.tsx; /[locale] is its own segment entry so the static
 * import cannot leak into other routes, and the only island is the LeadForm
 * via its lazy boundary. Base budget class: ≤155 KB, LCP is the H1 text.
 */

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  // No title → the layout's default title (bare site name) applies.
  return metaFor({ id: 'home', description: UI.home.metaDescription }, locale);
}

export default async function HomePage({ params }: PageProps): Promise<JSX.Element> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomeView locale={locale as Locale} />;
}
