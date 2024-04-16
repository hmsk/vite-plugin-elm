import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseOptions } from './pluginOptions.js'

type Result = ReturnType<typeof parseOptions>

describe('in dev build', () => {
  it('returns default in dev', () => {
    expect(parseOptions({})).toEqual<Result>({
      isBuild: false,
      nodeElmCompilerOptions: {
        debug: true,
        optimize: false,
        verbose: false,
      },
    })
  })

  it('overwrites debug and optimize as it given', () => {
    expect(parseOptions({ debug: false, optimize: true })).toEqual<Result>({
      isBuild: false,
      nodeElmCompilerOptions: {
        debug: false,
        optimize: true,
        verbose: false,
      },
    })
  })

  it('passes thru options for node-elm-compiler', () => {
    expect(
      parseOptions({
        nodeElmCompilerOptions: { pathToElm: 'wherever' },
      }),
    ).toEqual<Result>({
      isBuild: false,
      nodeElmCompilerOptions: {
        debug: true,
        optimize: false,
        verbose: false,
        pathToElm: 'wherever',
      },
    })
  })
})

describe('in production build', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
  })

  it('returns default for prod build', () => {
    expect(parseOptions({})).toEqual<Result>({
      isBuild: true,
      nodeElmCompilerOptions: {
        debug: false,
        optimize: true,
        verbose: true,
      },
    })
  })

  it('overwrites debug and optimize per just only debug', () => {
    expect(parseOptions({ debug: true })).toEqual<Result>({
      isBuild: true,
      nodeElmCompilerOptions: {
        debug: true,
        optimize: false,
        verbose: true,
      },
    })
  })

  it('overwrites debug and optimize', () => {
    expect(parseOptions({ debug: true, optimize: false })).toEqual<Result>({
      isBuild: true,
      nodeElmCompilerOptions: {
        debug: true,
        optimize: false,
        verbose: true,
      },
    })
  })
})
