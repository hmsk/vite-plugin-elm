import { CustomCompiler, NodeElmCompilerOptions } from './compiler.js'

interface InputOptions {
  debug?: boolean
  optimize?: boolean
  nodeElmCompilerOptions?: Partial<NodeElmCompilerOptions>
  compiler?: CustomCompiler
}

type DeterminedKeys = 'debug' | 'optimize' | 'verbose'

interface ParsedOptions {
  isBuild: boolean
  compilerOptions:
    | (Pick<NodeElmCompilerOptions, DeterminedKeys> & Partial<Omit<NodeElmCompilerOptions, DeterminedKeys>>)
    | CustomCompiler
}

export const parseOptions = (inputOptions: InputOptions): ParsedOptions => {
  const isBuild = process.env.NODE_ENV === 'production'

  return {
    isBuild,
    compilerOptions: inputOptions.compiler ?? {
      debug: inputOptions.debug ?? !isBuild,
      optimize: typeof inputOptions.optimize === 'boolean' ? inputOptions.optimize : !inputOptions.debug && isBuild,
      verbose: isBuild,
      ...(inputOptions.nodeElmCompilerOptions ?? {}),
    },
  }
}
