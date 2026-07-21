// Runs before any test module imports config/origin, so SITE_ORIGIN resolves to a
// clean (non-TK) origin. Without this, the vitest env has no NEXT_PUBLIC_SITE_ORIGIN
// and SITE_ORIGIN falls back to the TK_DOMAIN placeholder — which stripTK would then
// (correctly) remove from the JSON-LD @ids, hiding the @id assertions.
process.env.NEXT_PUBLIC_SITE_ORIGIN = 'https://optimal-realty.vercel.app';
