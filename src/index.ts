//@ts-expect-error typing isn't provided
import nodeElmcompiler from 'node-elm-compiler'
import { normalize, relative } from 'path'
import type { EnvironmentModuleNode, Plugin } from 'vite'
import { injectHMR } from './hmrInjector.js'
import { acquireLock } from './mutex.js'
import { parseOptions } from './pluginOptions.js'
import { compile } from './compiler.js'

const trimDebugMessage = (code: string): string => code.replace(/(console\.warn\('Compiled in DEBUG mode)/, '// $1')
const viteProjectPath = (dependency: string) => `/${relative(process.cwd(), dependency)}`
// An id Vite can resolve regardless of `root`/cwd: the absolute file path with forward slashes
const hmrDependencyId = (dependency: string) => dependency.replace(/\\/g, '/')

const parseImportId = (id: string) => {
  const parsedId = new URL(id, 'file://')
  const pathname = parsedId.pathname
  const valid = pathname.endsWith('.elm') && !parsedId.searchParams.has('raw')
  const withParams = parsedId.searchParams.getAll('with')

  return {
    valid,
    pathname,
    withParams,
  }
}

export const plugin = (userOptions: Parameters<typeof parseOptions>[0] = {}): Plugin => {
  const options = parseOptions(userOptions)
  const compilableFiles: Map<string, Set<string>> = new Map()
  // Importer of each `?with=` import, which accompanying paths are relative to
  const importersOfCombined: Map<string, string> = new Map()

  return {
    name: 'vite-plugin-elm',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || !source.includes('.elm')) return null
      const { valid, withParams } = parseImportId(source)
      if (!valid || withParams.length === 0) return null

      // Spreading `options` reads the deprecated `options.ssr`
      const { kind, custom, isEntry } = options
      const resolved = await this.resolve(source, importer, { kind, custom, isEntry, skipSelf: true })
      if (resolved) importersOfCombined.set(resolved.id, importer)
      return resolved
    },
    hotUpdate({ type, file, modules }) {
      if (type !== 'update') return
      const { valid } = parseImportId(file)
      if (!valid) return

      const modulesToCompile: EnvironmentModuleNode[] = []
      compilableFiles.forEach((dependencies, compilableFile) => {
        if (dependencies.has(normalize(file))) {
          const module = this.environment.moduleGraph.getModuleById(compilableFile)
          if (module) modulesToCompile.push(module)
        }
      })

      if (modulesToCompile.length > 0) {
        this.environment.hot.send({
          type: 'custom',
          event: 'hot-update-dependents',
          data: modulesToCompile.map(({ url }) => url),
        })
        return modulesToCompile
      } else {
        return modules
      }
    },
    async load(id) {
      const { valid, pathname, withParams } = parseImportId(id)
      if (!valid) return

      const accompanies = await Promise.all(
        withParams.map(async (accompany) => {
          // Without a known importer (e.g. requested directly), resolve from the main file
          const resolved = await this.resolve(accompany, importersOfCombined.get(id) ?? pathname)
          if (!resolved) throw new Error(`Could not resolve "${accompany}" given via ?with= in ${id}`)
          return resolved.id
        }),
      )

      const targets = [pathname, ...accompanies]

      compilableFiles.delete(id)
      const dependencies = (
        await Promise.all<string[]>(targets.map((target) => nodeElmcompiler.findAllDependencies(target) as string[]))
      ).flat()
      compilableFiles.set(id, new Set([...accompanies, ...dependencies]))

      const releaseLock = await acquireLock()
      try {
        const compiled = await compile(targets, options.compilerOptions)

        // Apparently `addWatchFile` may not exist: https://github.com/hmsk/vite-plugin-elm/pull/36
        if (this.addWatchFile) {
          dependencies.forEach(this.addWatchFile.bind(this))
        }

        return {
          code: options.isBuild ? compiled : trimDebugMessage(injectHMR(compiled, dependencies.map(hmrDependencyId))),
          map: null,
          moduleType: 'js',
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('-- NO MAIN')) {
          const message = `${viteProjectPath(
            pathname,
          )}: NO MAIN .elm file is requested to transform by vite. Probably, this file is just a depending module`
          throw message
        } else {
          throw e
        }
      } finally {
        releaseLock()
      }
    },
  }
}

export default plugin
