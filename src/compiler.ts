//@ts-expect-error typing isn't provided
import { toESModule } from 'elm-esm'
//@ts-expect-error typing isn't provided
import nodeElmCompiler from 'node-elm-compiler'
import { statSync } from 'fs'
import path from 'path'

import { injectAssets } from './assetsInjector.js'

export interface NodeElmCompilerOptions {
  cwd: string
  docs: string
  debug: boolean
  optimize: boolean
  processOpts: Record<string, string>
  report: string
  pathToElm: string
  verbose: boolean
}

export interface CustomCompiler {
  compile: (targets: string[]) => Promise<string>
}

const isFile = (pathname: string) => statSync(pathname, { throwIfNoEntry: false })?.isFile() ?? false

// Returns the closest directory having elm.json, looking up from the given file until the root
// (`/`, `C:\` or `\\server\share\`). The path implementation is swappable to test other platforms.
export const findClosestElmJson = (
  pathname: string,
  {
    pathImpl = path,
    fileExists = isFile,
  }: { pathImpl?: path.PlatformPath; fileExists?: (path: string) => boolean } = {},
): string | undefined => {
  let directory = pathImpl.resolve(pathImpl.dirname(pathname))
  for (;;) {
    if (fileExists(pathImpl.join(directory, 'elm.json'))) return directory
    const parent = pathImpl.dirname(directory)
    if (parent === directory) return undefined
    directory = parent
  }
}

export const compile = async (
  targets: string[],
  options: Partial<NodeElmCompilerOptions> | CustomCompiler,
): Promise<string> => {
  const compiled =
    'compile' in options
      ? await runCustomCompiler(targets, options.compile)
      : await nodeElmCompiler.compileToString(targets, {
          output: '.js',
          cwd: findClosestElmJson(targets[0]),
          ...options,
        })
  return injectAssets(toESModule(compiled))
}

const runCustomCompiler = async (targets: string[], compile: CustomCompiler['compile']) => {
  return compile(targets).catch((e) => {
    throw `Failed to run command: ${e}`
  })
}
