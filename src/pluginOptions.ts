interface NodeElmCompilerOptions {
  cwd?: string
  docs?: string
  debug?: boolean
  optimize?: boolean
  processOpts?: Record<string, string>
  report?: string
  pathToElm?: string
  verbose?: boolean
}

interface InputOptions {
  debug?: boolean
  optimize?: boolean
  nodeElmCompilerOptions?: NodeElmCompilerOptions
}

interface ParsedOptions {
  isBuild: boolean
  debug: boolean
  optimize: boolean
  nodeElmCompilerOptionsOverwrite: NodeElmCompilerOptions
}

export const parseOptions = (inputOptions: InputOptions): ParsedOptions => {
  const isBuild = process.env.NODE_ENV === 'production'
  return {
    isBuild,
    debug: inputOptions.debug ?? !isBuild,
    optimize: typeof inputOptions.optimize === 'boolean' ? inputOptions.optimize : !inputOptions.debug && isBuild,
    nodeElmCompilerOptionsOverwrite: inputOptions.nodeElmCompilerOptions ?? {},
  }
}
