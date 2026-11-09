import { describe, expect, it } from 'vitest'

import { annotatePure } from './pure.js'

describe('annotatePure', () => {
  it('marks top-level F2..F9 declarations as pure', () => {
    const code = [
      'var _List_cons = F2(_List_Cons);',
      'var $elm$core$List$foldl = F3(',
      '\tfunction (func, acc, list) {',
      'var _Platform_worker = F4(function(impl, flagDecoder, debugMetadata, args) {',
    ].join('\n')

    expect(annotatePure(code)).toBe(
      [
        'var _List_cons = /* @__PURE__ */ F2(_List_Cons);',
        'var $elm$core$List$foldl = /* @__PURE__ */ F3(',
        '\tfunction (func, acc, list) {',
        'var _Platform_worker = /* @__PURE__ */ F4(function(impl, flagDecoder, debugMetadata, args) {',
      ].join('\n'),
    )
  })

  it('leaves calls that may have side effects', () => {
    const code = [
      'var $author$project$Main$main = A2($elm$browser$Browser$element, {});',
      '\tvar inner = F2(function (a, b) { return a; });',
      'var _Platform_effectManagers = {}, _Platform_effectsQueue = [];',
      'var x = F10(f);',
    ].join('\n')

    expect(annotatePure(code)).toBe(code)
  })
})
