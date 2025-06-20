//@ts-expect-error typing isn't provided
import nodeElmcompiler from 'node-elm-compiler'
import { normalize, relative } from 'path'
import * as path from 'path'
import type { ModuleNode, Plugin } from 'vite'
import { injectHMR } from './hmrInjector.js'
import { acquireLock } from './mutex.js'
import { parseOptions } from './pluginOptions.js'
import { compile } from './compiler.js'

const trimDebugMessage = (code: string): string => code.replace(/(console\.warn\('Compiled in DEBUG mode)/, '// $1')
const viteProjectPath = (dependency: string) => `/${relative(process.cwd(), dependency)}`

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

  return {
    name: 'vite-plugin-elm',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source.endsWith('.elm')) {
        if (source.startsWith('/')) {
          return {
            id: source,
            external: false,
          }
        }
        if (!importer) {
          return null
        }
        const absolutePath = path.resolve(path.dirname(importer), source)
        return {
          id: absolutePath,
          external: false,
        }
      }
      return null
    },
    handleHotUpdate({ file, server, modules }) {
      const { valid } = parseImportId(file)
      if (!valid) return

      const modulesToCompile: ModuleNode[] = []
      compilableFiles.forEach((dependencies, compilableFile) => {
        if (dependencies.has(normalize(file))) {
          const module = server.moduleGraph.getModuleById(compilableFile)
          if (module) modulesToCompile.push(module)
        }
      })

      if (modulesToCompile.length > 0) {
        server.ws.send({
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

      const accompanies = await (() => {
        if (withParams.length > 0) {
          const importTree = this.getModuleIds()
          let importer = ''
          for (const moduleId of importTree) {
            if (moduleId === id) break
            importer = moduleId
          }
          const resolveAccompany = async (accompany: string) => (await this.resolve(accompany, importer))?.id ?? ''
          return Promise.all(withParams.map(resolveAccompany))
        } else {
          return Promise.resolve([])
        }
      })()

      const targets = [pathname, ...accompanies].filter((target) => target !== '')

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
          code: options.isBuild ? compiled : trimDebugMessage(injectHMR(compiled, dependencies.map(viteProjectPath))),
          map: null,
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
