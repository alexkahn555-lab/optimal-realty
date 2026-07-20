import { ENTITY, LICENSE_LABEL, POSITIONING } from '@/config/entity';

export const dynamic = 'force-static';

export function GET(): Response {
  const { tradeName, licenses } = ENTITY.entity;
  const licenseLine = licenses
    .map((license) => `${LICENSE_LABEL[license.role]} (${license.number})`)
    .join(', ');
  const body = `# ${tradeName}\n> ${licenseLine}. ${POSITIONING.serviceArea}.\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
