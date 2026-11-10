import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseOptions } from './pluginOptions.js'

type Result = ReturnType<typeof parseOptions>

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('on the dev server', () => {
  it('returns default in dev', () => {
    expect(parseOptions({}, false)).toEqual<Result>({
      isBuild: false,
      compilerOptions: {
        debug: true,
        optimize: false,
      },
    })
  })

  it('overwrites debug and optimize as it given', () => {
    expect(parseOptions({ debug: false, optimize: true }, false)).toEqual<Result>({
      isBuild: false,
      compilerOptions: {
        debug: false,
        optimize: true,
      },
    })
  })

  it('passes pathToElm through', () => {
    expect(parseOptions({ pathToElm: 'lamdera' }, false)).toEqual<Result>({
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
      parseOptions(
        {
          pathToElm: 'wherever',
          compiler: { compile: async () => 'compiled' },
        },
        false,
      ),
    ).toEqual<Result>({
      isBuild: false,
      compilerOptions: {
        compile: expect.any(Function),
      },
    })
  })

  it('passes postprocess through', () => {
    const postprocess = (js: string) => js
    expect(parseOptions({ postprocess }, false)).toEqual<Result>({
      isBuild: false,
      compilerOptions: { debug: true, optimize: false },
      postprocess,
    })
  })

  // Tools like Vitest set NODE_ENV=test, so the plugin follows Vite's command instead
  it('does not follow NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(parseOptions({}, false).compilerOptions).toEqual({ debug: true, optimize: false })
  })

  it('tells how to migrate from nodeElmCompilerOptions', () => {
    // @ts-expect-error removed in v4
    expect(() => parseOptions({ nodeElmCompilerOptions: { pathToElm: 'elm' } }, false)).toThrow(/Use `pathToElm`/)
  })
})

describe('in vite build', () => {
  it('returns default for prod build', () => {
    expect(parseOptions({}, true)).toEqual<Result>({
      isBuild: true,
      compilerOptions: {
        debug: false,
        optimize: true,
      },
    })
  })

  it('overwrites debug and optimize per just only debug', () => {
    expect(parseOptions({ debug: true }, true)).toEqual<Result>({
      isBuild: true,
      compilerOptions: {
        debug: true,
        optimize: false,
      },
    })
  })

  it('overwrites debug and optimize', () => {
    expect(parseOptions({ debug: true, optimize: false }, true)).toEqual<Result>({
      isBuild: true,
      compilerOptions: {
        debug: true,
        optimize: false,
      },
    })
  })
})
