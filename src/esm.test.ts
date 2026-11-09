import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
import { describe, expect, it } from 'vitest'

import { toESModule } from './esm.js'

// The same shape as what the Elm compiler emits, merging exports of multiple main modules
const compiled = `(function(scope){
'use strict';
var _Utils_internal = 'inside';
function _Platform_export(exports) {
  scope['Elm'] ? _Platform_mergeExports('Elm', scope['Elm'], exports) : scope['Elm'] = exports;
}
function _Platform_mergeExports(moduleName, obj, exports) {
  for (var name in exports) { obj[name] = exports[name]; }
}
_Platform_export({'Main':{'init':function() { return _Utils_internal; }}});
_Platform_export({'Other':{'init':function() { return 'other'; }}});}(this));`

const importModule = async (code: string) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vite-plugin-elm-'))
  try {
    const file = path.join(directory, 'elm.mjs')
    writeFileSync(file, code)
    return await import(/* @vite-ignore */ pathToFileURL(file).href)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

describe('toESModule', () => {
  it('exports Elm with every main module', async () => {
    const { Elm } = await importModule(toESModule(compiled))

    expect(Elm.Main.init()).toBe('inside')
    expect(Elm.Other.init()).toBe('other')
  })

  it("keeps Elm's internals at the top level for HMR", () => {
    const esm = toESModule(compiled)

    expect(esm).toMatch(/^const scope = \{\};\n'use strict';\nvar _Utils_internal = 'inside';/)
    expect(esm).toMatch(/\nexport const Elm = scope\.Elm;\n$/)
  })

  it('works with minified output', async () => {
    const minified = `(function(a){'use strict';function e(x){a.Elm=x}e({'Main':{'init':function(){return 'min'}}})})(this);`
    const { Elm } = await importModule(toESModule(minified))

    expect(Elm.Main.init()).toBe('min')
  })

  it('rejects output in another shape', () => {
    expect(() => toESModule('export const Elm = {};')).toThrow(/Unexpected output from the Elm compiler/)
  })
})
