import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseOptions } from './pluginOptions.js'

type Result = ReturnType<typeof parseOptions>

const defaultDevOptions: Result = {
  isBuild: false,
  debug: true,
  optimize: false,
  nodeElmCompilerOptionsOverwrite: {},
}

describe('in dev build', () => {
  it('returns default in dev', () => {
    expect(parseOptions({})).toEqual(defaultDevOptions)
  })

  it('overwrites debug and optimize as it given', () => {
    expect(parseOptions({ debug: false, optimize: true })).toEqual({
      ...defaultDevOptions,
      debug: false,
      optimize: true,
    })
  })

  it('passes thru options for node-elm-compiler', () => {
    expect(
      parseOptions({
        nodeElmCompilerOptions: { pathToElm: 'wherever' },
      }),
    ).toEqual({
      ...defaultDevOptions,
      nodeElmCompilerOptionsOverwrite: { pathToElm: 'wherever' },
    })
  })
})

describe('in production build', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
  })

  it('returns default for prod build', () => {
    expect(parseOptions({})).toEqual({
      ...defaultDevOptions,
      isBuild: true,
      debug: false,
      optimize: true,
    })
  })

  it('overwrites debug and optimize per just only debug', () => {
    expect(parseOptions({ debug: true })).toEqual({
      ...defaultDevOptions,
      isBuild: true,
      debug: true,
      optimize: false,
    })
  })

  it('overwrites debug and optimize', () => {
    expect(parseOptions({ debug: true, optimize: false })).toEqual({
      ...defaultDevOptions,
      isBuild: true,
      debug: true,
      optimize: false,
    })
  })
})
