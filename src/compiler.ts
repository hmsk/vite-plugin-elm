import path from 'path'

import { injectAssets } from './assetsInjector.js'
import { elmMake, type ElmMakeOptions } from './elmMake.js'
import { toESModule } from './esm.js'
import { isFile } from './files.js'

export type ElmCompilerOptions = Omit<ElmMakeOptions, 'cwd'>

export interface CustomCompiler {
  compile: (targets: string[]) => Promise<string>
}

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

export const compile = async (targets: string[], options: ElmCompilerOptions | CustomCompiler): Promise<string> => {
  const compiled =
    'compile' in options
      ? await runCustomCompiler(targets, options.compile)
      : await elmMake(targets, {
          ...options,
          // Without elm.json, let Elm tell what's missing
          cwd: findClosestElmJson(targets[0]) ?? path.dirname(path.resolve(targets[0])),
        })
  return injectAssets(toESModule(compiled))
}

const runCustomCompiler = async (targets: string[], compile: CustomCompiler['compile']) => {
  return compile(targets).catch((e) => {
    throw new Error(`Failed to run the custom compiler: ${e instanceof Error ? e.message : e}`, { cause: e })
  })
}
