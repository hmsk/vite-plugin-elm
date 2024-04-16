//@ts-expect-error typing isn't provided
import nodeElmCompiler from 'node-elm-compiler'

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

export const compile = async (targets: string[], options: Partial<NodeElmCompilerOptions>): Promise<string> => {
  return nodeElmCompiler.compileToString(targets, { output: '.js', ...options })
}
