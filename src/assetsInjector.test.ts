import { describe, expect, it } from 'vitest'

import { injectAssets } from './assetsInjector.js'

describe('injectAssets', () => {
  it('replaces an asset tag with an import', () => {
    const injected = injectAssets(`var logo = '[VITE_PLUGIN_ELM_ASSET:/assets/logo.jpg]';`)

    expect(injected).toMatch(/^import _[0-9a-f]{40} from "\/assets\/logo.jpg"/)
    expect(injected).toMatch(/var logo = _[0-9a-f]{40};/)
  })

  const helper = `var $hmsk$elm_vite_plugin_helper$VitePluginHelper$asset = function (path) {
	return 'VITE_PLUGIN_HELPER_ASSET' + path;
};`

  it('replaces a call of VitePluginHelper.asset with an import', () => {
    const injected = injectAssets(`${helper}
var logo = $hmsk$elm_vite_plugin_helper$VitePluginHelper$asset('/assets/logo.png?inline');`)

    expect(injected).toMatch(/^import _[0-9a-f]{40} from "\/assets\/logo.png\?inline"/)
    expect(injected).toMatch(/var logo = _[0-9a-f]{40};/)
  })

  // elm-optimize-level-2 prints strings with double quotes
  it('finds tags and helper calls in double quotes', () => {
    const injected = injectAssets(`var $hmsk$elm_vite_plugin_helper$VitePluginHelper$asset = function (path) {
    return "VITE_PLUGIN_HELPER_ASSET" + path;
};
var logo = "[VITE_PLUGIN_ELM_ASSET:/assets/logo.jpg]";
var inline = $hmsk$elm_vite_plugin_helper$VitePluginHelper$asset("/assets/logo.png?inline");`)

    expect(injected).toMatch(/^import _[0-9a-f]{40} from "\/assets\/logo.jpg"$/m)
    expect(injected).toMatch(/^import _[0-9a-f]{40} from "\/assets\/logo.png\?inline"$/m)
    expect(injected).toMatch(/var logo = _[0-9a-f]{40};\nvar inline = _[0-9a-f]{40};$/)
  })

  it('replaces adjacent asset tags', () => {
    const injected = injectAssets(
      `var a = ['[VITE_PLUGIN_ELM_ASSET:/assets/a.png]', '[VITE_PLUGIN_ELM_ASSET:/assets/longer-name.png]'];`,
    )

    expect(injected).toMatch(
      /^import _[0-9a-f]{40} from "\/assets\/a.png"\nimport _[0-9a-f]{40} from "\/assets\/longer-name.png"/,
    )
    expect(injected).toMatch(/var a = \[_[0-9a-f]{40}, _[0-9a-f]{40}\];$/)
  })

  it('keeps a path with quotes in the string of the import', () => {
    const injected = injectAssets(
      `var x = "[VITE_PLUGIN_ELM_ASSET:./a.png'; globalThis.injected = 1; import b from './b.png]";`,
    )

    expect(injected.split('\n')[0]).toMatch(
      /^import _[0-9a-f]{40} from "\.\/a\.png'; globalThis\.injected = 1; import b from '\.\/b\.png"$/,
    )
  })

  // https://github.com/hmsk/vite-plugin-elm/issues/455
  it('throws an Error telling to pass a string literal to VitePluginHelper.asset', () => {
    const compiled = `${helper}
var icon = function (name) { return $hmsk$elm_vite_plugin_helper$VitePluginHelper$asset(_Utils_ap('/icons/', name)); };`

    expect(() => injectAssets(compiled)).toThrow(Error)
    expect(() => injectAssets(compiled)).toThrow(
      /takes only a string literal.*Found in the compiled JavaScript: asset\(_Utils_ap\('\/icons\/', name\)\)$/,
    )
  })

  // Elm 0.19.2 emits U+2028/U+2029 as-is in string literals, which is valid only since ES2019
  // https://github.com/elm/compiler/issues/2360
  it('parses line and paragraph separators in string literals', () => {
    const compiled = `var separators = '${String.fromCodePoint(0x2028, 0x2029)}';`

    expect(injectAssets(compiled)).toBe(compiled)
  })
})
