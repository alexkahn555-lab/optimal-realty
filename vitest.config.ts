import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Test infra (dependency-free — vitest already bundles vite). Maps the `@/` alias
 * to the repo root (lib modules import via '@/...') and enables the React automatic
 * JSX runtime so component tests can renderToStaticMarkup without jsdom.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
  },
});
