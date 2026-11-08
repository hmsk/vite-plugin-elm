import { describe, expect, it } from 'vitest'

import { injectAssets } from './assetsInjector.js'

describe('injectAssets', () => {
  it('replaces an asset tag with an import', () => {
    const injected = injectAssets(`var logo = '[VITE_PLUGIN_ELM_ASSET:/assets/logo.jpg]';`)

    expect(injected).toMatch(/^import _[0-9a-f]{40} from '\/assets\/logo.jpg'/)
    expect(injected).toMatch(/var logo = _[0-9a-f]{40};/)
  })

  // Elm 0.19.2 emits U+2028/U+2029 as-is in string literals, which is valid only since ES2019
  // https://github.com/elm/compiler/issues/2360
  it('parses line and paragraph separators in string literals', () => {
    const compiled = `var separators = '${String.fromCodePoint(0x2028, 0x2029)}';`

    expect(injectAssets(compiled)).toBe(compiled)
  })
})
