import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
    include: ['tests/**/*.spec.ts'],
    exclude: ['node_modules', '.nuxt', '.output'],
    coverage: {
      provider: 'v8',
      include: ['utils/**/*.ts'],
      thresholds: {
        lines: 90,
        branches: 90,
      },
    },
  },
})
