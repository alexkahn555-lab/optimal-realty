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
      ],
    },
  },
  {
    files: ['tailwind.config.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
];
