/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-ignore
import { toESModule } from 'elm-esm'
//@ts-ignore
import compiler from 'node-elm-compiler'
import { relative } from 'path'
import type { ModuleNode, Plugin } from 'vite'
import { injectAssets } from './assetsInjector'
import { injectHMR } from './hmrInjector'
import { acquireLock } from './mutex'
/* eslint-enable @typescript-eslint/ban-ts-comment */

const trimDebugMessage = (code: string): string => code.replace(/(console\.warn\('Compiled in DEBUG mode)/, '// $1')
const viteProjectPath = (dependency: string) => `/${relative(process.cwd(), dependency)}`

export const plugin = (opts?: { debug?: boolean; optimize?: boolean }): Plugin => {
  const compilableFiles: Map<string, Set<string>> = new Map()
  const debug = opts?.debug
  const optimize = opts?.optimize

  return {
    name: 'vite-plugin-elm',
    enforce: 'pre',
    handleHotUpdate({ file, server, modules }) {
      if (!file.endsWith('.elm')) return
      const modulesToCompile: ModuleNode[] = []
      compilableFiles.forEach((dependencies, compilableFile) => {
        if (dependencies.has(file)) {
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
      const parsedId = new URL(id, 'file://')
      if (!parsedId.pathname.endsWith('.elm')) return

      const accompanyCandidates = parsedId.searchParams.getAll('with')

      const accompanies = await (() => {
        if (accompanyCandidates.length > 0) {
          const importTree = this.getModuleIds()
          let importer = ''
          for (const moduleId of importTree) {
            if (moduleId === id) break
            importer = moduleId
          }
          const resolveAcoompany = async (accompany: string) => (await this.resolve(accompany, importer))?.id
          return Promise.all(accompanyCandidates.map(resolveAcoompany))
        } else {
          return Promise.resolve([])
        }
      })()

      const targets = [parsedId.pathname, ...accompanies]

      compilableFiles.delete(parsedId.pathname)

      const isBuild = process.env.NODE_ENV === 'production'
      const dependencies: string[] = await compiler.findAllDependencies(parsedId.pathname)
      compilableFiles.set(parsedId.pathname, new Set(dependencies))

      const releaseLock = await acquireLock()
      try {
        const compiled: string = await compiler.compileToString(targets, {
          output: '.js',
          optimize: typeof optimize === 'boolean' ? optimize : !debug && isBuild,
          verbose: isBuild,
          debug: debug ?? !isBuild,
        })

        // Apparently `addWatchFile` may not exist: https://github.com/hmsk/vite-plugin-elm/pull/36
        if (this.addWatchFile) {
          dependencies.forEach(this.addWatchFile.bind(this))
        }

        const esm = injectAssets(toESModule(compiled))

        return {
          code: isBuild ? esm : trimDebugMessage(injectHMR(esm, dependencies.map(viteProjectPath))),
          map: null,
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('-- NO MAIN')) {
          const message = `${viteProjectPath(
            parsedId.pathname,
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
