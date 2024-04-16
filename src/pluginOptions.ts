import { NodeElmCompilerOptions } from './compiler.js'

interface InputOptions {
  debug?: boolean
  optimize?: boolean
  nodeElmCompilerOptions?: Partial<NodeElmCompilerOptions>
}

type DeterminedKeys = 'debug' | 'optimize' | 'verbose'

interface ParsedOptions {
  isBuild: boolean
  nodeElmCompilerOptions: Pick<NodeElmCompilerOptions, DeterminedKeys> &
    Partial<Omit<NodeElmCompilerOptions, DeterminedKeys>>
}

export const parseOptions = (inputOptions: InputOptions): ParsedOptions => {
  const isBuild = process.env.NODE_ENV === 'production'

  return {
    isBuild,
    nodeElmCompilerOptions: {
      debug: inputOptions.debug ?? !isBuild,
      optimize: typeof inputOptions.optimize === 'boolean' ? inputOptions.optimize : !inputOptions.debug && isBuild,
      verbose: isBuild,
      ...(inputOptions.nodeElmCompilerOptions ?? {}),
    },
  }
}
