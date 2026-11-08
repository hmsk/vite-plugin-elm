import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Keep out Cypress specs and compiled tests in dist
    include: ['src/**/*.test.ts'],
  },
})
