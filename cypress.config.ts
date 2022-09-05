import { defineConfig } from 'cypress'
import { copyFileSync, readFileSync, renameSync, writeFileSync } from 'fs'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8938',
    specPattern: 'cypress/integration/**/*.test.ts',
    supportFile: false,
    setupNodeEvents(on) {
      on('task', {
        keepOriginal(paths: string | string[]) {
          return (Array.isArray(paths) ? paths : [paths]).map((path) => {
            const tmpFileName = `${path}.tmp`
            copyFileSync(path, tmpFileName)
            return tmpFileName
          })
        },
        restoreOriginal(paths: string | string[]) {
          return (Array.isArray(paths) ? paths : [paths]).map((path) => {
            const tmpFileName = `${path}.tmp`
            renameSync(tmpFileName, path)
            return path
          })
        },
        amendFile({ path, target, replacement }: { path: string; target: string; replacement: string }) {
          const original = readFileSync(path).toString()
          writeFileSync(path, original.replace(target, replacement))
          return path
        },
      })
    },
  },
})
