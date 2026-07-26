import type { AnswerBlock, Localized } from '@/lib/types';

/**
 * ABOUT PAGE content. The AnswerBlock is assembled STRICTLY from confirmed
 * facts (config/entity.ts licenses, POSITIONING: FSU economics, USMC service,
 * NAR designation count, single-agency standard, service area, languages) and
 * FLAGGED for client review. The biography prose is broker voice — placeholder
 * until supplied. The individual NAR designation list is TK (D-03) and therefore
 * absent everywhere; only the confirmed count renders.
 */

export const ABOUT_ANSWER: AnswerBlock = {
  question: {
    en: 'Who is the broker behind Optimal Realty?',
    es: '¿Quién es el corredor detrás de Optimal Realty?',
  },
  // 53 words / confirmed facts only — FLAGGED for client review.
  answer: {
    en:
      'Optimal Realty was founded by Raul Perez, a Florida licensed real estate ' +
      'broker, state-certified appraiser, and community association manager ' +
      'serving Miami-Dade County. A Florida State University economics graduate ' +
      'and U.S. Marine Corps veteran with nine National Association of REALTORS ' +
      'designations, Raul represents one client per transaction under a ' +
      'single-agency standard, in English and Spanish.',
    es:
      'Optimal Realty fue fundada por Raul Perez, corredor de bienes raíces ' +
      'licenciado en Florida, tasador certificado por el estado y administrador ' +
      'de asociaciones comunitarias, al servicio del condado de Miami-Dade. ' +
      'Graduado en economía de Florida State University y veterano del Cuerpo de ' +
      'Marines de EE. UU., con nueve designaciones de la National Association of ' +
      'REALTORS, Raul representa a un solo cliente por transacción bajo un ' +
      'estándar de agencia única, en inglés y español.',
  },
  updated: '2026-07-26',
};

/** Broker-voice biography — never generated. */
export const ABOUT_BIO: Localized = {
  en: 'TK_ABOUT_BIO',
  es: 'TK_ABOUT_BIO',
};
