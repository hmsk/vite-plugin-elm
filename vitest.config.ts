import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          // Keep out compiled tests in dist
          include: ['src/**/*.test.ts'],
          typecheck: {
            enabled: true,
            include: ['client.test-d.ts'],
            tsconfig: './tsconfig.client.json',
          },
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['e2e/**/*.test.ts'],
          globalSetup: ['e2e/globalSetup.ts'],
          testTimeout: 30_000,
          // Starting a server includes `vite build` and the first Elm compile
          hookTimeout: 120_000,
        },
      },
    ],
  },
})
