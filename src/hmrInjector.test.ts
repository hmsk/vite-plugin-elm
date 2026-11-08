import { parse } from 'acorn'
import { describe, expect, it } from 'vitest'

import { injectHMR } from './hmrInjector.js'

const compiled = 'export const Elm = {};'
const parseModule = (code: string) => parse(code, { ecmaVersion: 'latest', sourceType: 'module' })

describe('injectHMR', () => {
  it('does not accept updates of dependencies when there is none', () => {
    const injected = injectHMR(compiled, [])

    expect(injected).toContain('import.meta.hot.accept()')
    expect(injected).not.toContain('import.meta.hot.accept([')
    expect(() => parseModule(injected)).not.toThrow()
  })

  it('accepts updates of dependencies', () => {
    const injected = injectHMR(compiled, ['/src/Message.elm', '/src/Another.elm'])

    expect(injected).toContain('import.meta.hot.accept(["/src/Message.elm","/src/Another.elm"]')
    expect(() => parseModule(injected)).not.toThrow()
  })

  it('emits valid code for paths which need escaping', () => {
    const injected = injectHMR(compiled, ['\\src\\Message.elm', "/src/It's.elm", '/src/"Quoted".elm'])

    expect(() => parseModule(injected)).not.toThrow()
  })
})
