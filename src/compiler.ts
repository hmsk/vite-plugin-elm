//@ts-expect-error typing isn't provided
import { toESModule } from 'elm-esm'
//@ts-expect-error typing isn't provided
import nodeElmCompiler from 'node-elm-compiler'
import { findUpSync } from 'find-up'
import { dirname } from 'path'

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

const findClosestElmJson = (pathname: string) => {
  const elmJson = findUpSync('elm.json', { cwd: dirname(pathname) })
  return elmJson ? dirname(elmJson) : undefined
}

export const compile = async (targets: string[], options: Partial<NodeElmCompilerOptions>): Promise<string> => {
  const compiled = await nodeElmCompiler.compileToString(targets, {
    output: '.js',
    cwd: findClosestElmJson(targets[0]),
    ...options,
  })

  return injectAssets(toESModule(compiled))
}
