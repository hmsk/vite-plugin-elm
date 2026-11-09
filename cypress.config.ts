import { defineConfig } from 'cypress'
import { copyFileSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8938',
    specPattern: 'cypress/integration/**/*.test.ts',
    supportFile: false,
    setupNodeEvents(on) {
      on('task', {
        // An Elm module outside the Vite root and the workspace, so outside server.fs.allow
        writeElmOutsideRoot() {
          const path = join(mkdtempSync(join(tmpdir(), 'vite-plugin-elm-outside-')), 'Outside.elm')
          writeFileSync(
            path,
            'module Outside exposing (main)\n\nimport Html\n\n\nmain =\n    Html.text "OUTSIDE-OF-ROOT"\n',
          )
          return path
        },
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
