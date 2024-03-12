/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-ignore
import { toESModule } from 'elm-esm'
//@ts-ignore
import compiler from 'node-elm-compiler'
import { normalize, relative, dirname, resolve } from 'path'
import type { ModuleNode, Plugin } from 'vite'
import { findUp } from 'find-up'
import { injectAssets } from './assetsInjector.js'
import { injectHMR } from './hmrInjector.js'
import { acquireLock } from './mutex.js'
/* eslint-enable @typescript-eslint/ban-ts-comment */

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

const findClosestElmJson = async (pathname: string) => {
  const elmJson = await findUp('elm.json', { cwd: dirname(pathname) })
  return elmJson ? dirname(elmJson) : undefined
}

type NodeElmCompilerOptions = {
  cwd?: string
  docs?: string
  debug?: boolean
  optimize?: boolean
  processOpts?: Record<string, string>
  report?: string
  pathToElm?: string
  verbose?: boolean
}

export const plugin = (opts?: {
  debug?: boolean
  optimize?: boolean
  nodeElmCompilerOptions: NodeElmCompilerOptions
}): Plugin => {
  const compilableFiles: Map<string, Set<string>> = new Map()
  const debug = opts?.debug
  const optimize = opts?.optimize
  const compilerOptionsOverwrite = opts?.nodeElmCompilerOptions ?? {}

  return {
    name: 'vite-plugin-elm',
    enforce: 'pre',
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

      const accompanies = withParams.map((accompany: string) => resolve(dirname(pathname), accompany))

      const targets = [pathname, ...accompanies].filter((target) => target !== '')

      compilableFiles.delete(id)
      const dependencies = (
        await Promise.all<string[]>(targets.map((target) => compiler.findAllDependencies(target) as string[]))
      ).flat()
      compilableFiles.set(id, new Set([...accompanies, ...dependencies]))

      const releaseLock = await acquireLock()
      try {
        const isBuild = process.env.NODE_ENV === 'production'
        const compiled: string = await compiler.compileToString(targets, {
          output: '.js',
          optimize: typeof optimize === 'boolean' ? optimize : !debug && isBuild,
          verbose: isBuild,
          debug: debug ?? !isBuild,
          cwd: await findClosestElmJson(pathname),
          ...compilerOptionsOverwrite,
        })

        const esm = injectAssets(toESModule(compiled))

        // Apparently `addWatchFile` may not exist: https://github.com/hmsk/vite-plugin-elm/pull/36
        if (this.addWatchFile) {
          dependencies.forEach(this.addWatchFile.bind(this))
        }

        return {
          code: isBuild ? esm : trimDebugMessage(injectHMR(esm, dependencies.map(viteProjectPath))),
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
