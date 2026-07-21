import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3,8}/]',
          message:
            'Raw hex colors are banned in component files. Use Tailwind tokens (bone, ink, marine, teal, coral, hair) defined in tailwind.config.ts.',
        },
        {
          selector: "JSXAttribute[name.name='href'] > Literal[value=/^\\//]",
          message:
            'Raw internal-path hrefs are banned in JSX. Build every internal URL with href(id, locale) from lib/seo/href.ts. (Fragments, mailto:, tel: and external URLs are exempt.)',
        },
        {
          selector: 'Identifier[name=/NEXT_PUBLIC_\\w*SERVICE_ROLE/]',
          message:
            'The Supabase service-role key is server-only. A NEXT_PUBLIC_ prefix would compile it into the client bundle. Use SUPABASE_SERVICE_ROLE_KEY via lib/leads/clients.ts.',
        },
        {
          selector: 'Literal[value=/NEXT_PUBLIC_\\w*SERVICE_ROLE/]',
          message:
            'The Supabase service-role key is server-only. A NEXT_PUBLIC_ prefix would compile it into the client bundle. Use SUPABASE_SERVICE_ROLE_KEY via lib/leads/clients.ts.',
        },
        {
          selector: 'TemplateElement[value.raw=/NEXT_PUBLIC_\\w*SERVICE_ROLE/]',
          message:
            'The Supabase service-role key is server-only. A NEXT_PUBLIC_ prefix would compile it into the client bundle. Use SUPABASE_SERVICE_ROLE_KEY via lib/leads/clients.ts.',
        },
      ],
    },
  },
  {
    // Each config exempts itself: tailwind holds the raw palette hex values,
    // and this file's own selector strings would match the service-role rule.
    files: ['tailwind.config.ts', 'eslint.config.mjs'],
    rules: { 'no-restricted-syntax': 'off' },
  },
];
