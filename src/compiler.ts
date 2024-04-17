//@ts-expect-error typing isn't provided
import { toESModule } from 'elm-esm'
//@ts-expect-error typing isn't provided
import nodeElmCompiler from 'node-elm-compiler'
import { findUpSync } from 'find-up'
import { dirname } from 'path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

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

export interface ManualCommand {
  command: (targets: string[]) => string
}

const findClosestElmJson = (pathname: string) => {
  const elmJson = findUpSync('elm.json', { cwd: dirname(pathname) })
  return elmJson ? dirname(elmJson) : undefined
}

export const compile = async (
  targets: string[],
  options: Partial<NodeElmCompilerOptions> | ManualCommand,
): Promise<string> => {
  const compiled =
    'command' in options
      ? await runCommandAndCapture(options.command(targets))
      : await nodeElmCompiler.compileToString(targets, {
          output: '.js',
          cwd: findClosestElmJson(targets[0]),
          ...options,
        })

  return injectAssets(toESModule(compiled))
}

const runCommandAndCapture = async (command: string): Promise<string> => {
  try {
    const { stdout } = await promisify(exec)(command)
    return stdout
  } catch (e) {
    throw 'Failed to run command'
  }
}
