/// <reference types="node" />

import { copyFileSync, readFileSync, renameSync, writeFileSync } from 'fs'

// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
const plugin = (on /*, config */) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
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
}
export default plugin
