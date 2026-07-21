import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npx next start -p 3000',
    url: 'http://localhost:3000/en',
    reuseExistingServer: true,
  },
  use: { baseURL: 'http://localhost:3000' },
});
