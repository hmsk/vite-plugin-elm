import type { CustomCompiler, ElmCompilerOptions } from './compiler.js'

export interface InputOptions {
  debug?: boolean
  optimize?: boolean
  // Path or command name of elm (or a compatible CLI). By default, `elm` in node_modules/.bin, then in PATH.
  pathToElm?: string
  compiler?: CustomCompiler
}

interface ParsedOptions {
  isBuild: boolean
  compilerOptions: ElmCompilerOptions | CustomCompiler
}

export const parseOptions = (inputOptions: InputOptions): ParsedOptions => {
  if ('nodeElmCompilerOptions' in inputOptions) {
    throw new Error(
      '[vite-plugin-elm] `nodeElmCompilerOptions` was removed in v4. Use `pathToElm` instead of `nodeElmCompilerOptions.pathToElm`.',
    )
  }

  const isBuild = process.env.NODE_ENV === 'production'

  return {
    isBuild,
    compilerOptions: inputOptions.compiler ?? {
      debug: inputOptions.debug ?? !isBuild,
      optimize: typeof inputOptions.optimize === 'boolean' ? inputOptions.optimize : !inputOptions.debug && isBuild,
      ...(inputOptions.pathToElm ? { pathToElm: inputOptions.pathToElm } : {}),
    },
  }
}
