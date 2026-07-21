import { ENTITY, LICENSE_LABEL, POSITIONING } from '@/config/entity';
import { SITE_ORIGIN } from '@/config/origin';
import { href } from '@/lib/seo/href';

export const dynamic = 'force-static';

export function GET(): Response {
  const { tradeName, licenses } = ENTITY.entity;
  const licenseLine = licenses
    .map((license) => `${LICENSE_LABEL[license.role]} (${license.number})`)
    .join(', ');
  const contactLine = `- Contact: ${SITE_ORIGIN}${href('contact', 'en')} · ${SITE_ORIGIN}${href('contact', 'es')}`;
  const body = `# ${tradeName}\n> ${licenseLine}. ${POSITIONING.serviceArea}.\n\n${contactLine}\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
