import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseOptions } from './pluginOptions.js'

type Result = ReturnType<typeof parseOptions>

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('in dev build', () => {
  it('returns default in dev', () => {
    expect(parseOptions({})).toEqual<Result>({
      isBuild: false,
      compilerOptions: {
        debug: true,
        optimize: false,
      },
    })
  })

  it('overwrites debug and optimize as it given', () => {
    expect(parseOptions({ debug: false, optimize: true })).toEqual<Result>({
      isBuild: false,
      compilerOptions: {
        debug: false,
        optimize: true,
      },
    })
  })

  it('passes pathToElm through', () => {
    expect(parseOptions({ pathToElm: 'lamdera' })).toEqual<Result>({
      isBuild: false,
      compilerOptions: {
        debug: true,
        optimize: false,
        pathToElm: 'lamdera',
      },
    })
  })

  it('takes a custom compiler over options for elm', () => {
    expect(
      parseOptions({
        pathToElm: 'wherever',
        compiler: { compile: async () => 'compiled' },
      }),
    ).toEqual<Result>({
      isBuild: false,
      compilerOptions: {
        compile: expect.any(Function),
      },
    })
  })

  it('passes postprocess through', () => {
    const postprocess = (js: string) => js
    expect(parseOptions({ postprocess })).toEqual<Result>({
      isBuild: false,
      compilerOptions: { debug: true, optimize: false },
      postprocess,
    })
  })

  it('tells how to migrate from nodeElmCompilerOptions', () => {
    // @ts-expect-error removed in v4
    expect(() => parseOptions({ nodeElmCompilerOptions: { pathToElm: 'elm' } })).toThrow(/Use `pathToElm`/)
  })
})

describe('in production build', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
  })

  it('returns default for prod build', () => {
    expect(parseOptions({})).toEqual<Result>({
      isBuild: true,
      compilerOptions: {
        debug: false,
        optimize: true,
      },
    })
  })

  it('overwrites debug and optimize per just only debug', () => {
    expect(parseOptions({ debug: true })).toEqual<Result>({
      isBuild: true,
      compilerOptions: {
        debug: true,
        optimize: false,
      },
    })
  })

  it('overwrites debug and optimize', () => {
    expect(parseOptions({ debug: true, optimize: false })).toEqual<Result>({
      isBuild: true,
      compilerOptions: {
        debug: true,
        optimize: false,
      },
    })
  })
})
