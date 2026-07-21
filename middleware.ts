import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALES } from '@/config/origin';

/**
 * Root-only locale negotiation. The matcher restricts this to exactly `/`; every
 * other path passes through untouched (no rewrite, no cookie). On `/` we 307 to
 * `/en` or `/es` by Accept-Language, negotiating between exactly those two,
 * default `/en`.
 */
export function middleware(request: NextRequest): NextResponse {
  const locale = negotiate(request.headers.get('accept-language'));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}`;
  return NextResponse.redirect(url, 307);
}

/** First supported language by q-weight; default DEFAULT_LOCALE. No library. */
function negotiate(header: string | null): (typeof LOCALES)[number] {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { base: (tag ?? '').toLowerCase().split('-')[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { base } of ranked) {
    if ((LOCALES as readonly string[]).includes(base ?? '')) {
      return base as (typeof LOCALES)[number];
    }
  }
  return DEFAULT_LOCALE;
}

export const config = { matcher: '/' };
