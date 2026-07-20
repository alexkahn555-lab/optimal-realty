import type { Config } from 'tailwindcss';

/**
 * The ONLY place these color values exist. A lint rule (see .eslintrc) fails CI
 * on any raw hex in a component file. Tokens only.
 *
 * Contrast constraints (Part 1.1) — enforced by review, not by the compiler:
 *   - teal FAILS text contrast on bone. Permitted for chart fills, rules, arrows,
 *     and display figures at 24px+. NEVER for body text or small labels on bone.
 *   - coral is a second DATA SERIES only. It never encodes place, price tier, or
 *     desirability (D11 / Part 1.4 — hard fair-housing rule).
 *   - bone-colored text on marine only.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bone: '#F2EFE8',
        ink: '#15181B',
        marine: '#0E2E36',
        teal: '#00A79A',
        coral: '#E2725B',
        hair: '#DAD5C8',
      },
      fontFamily: {
        // Wired to next/font CSS variables set in the locale layout.
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
    },
    // Global default: every figure is tabular. Overridable per-element if ever needed.
    fontVariantNumeric: {
      DEFAULT: 'tabular-nums',
    },
  },
  plugins: [],
};

export default config;
