import { beforeEach, expect, it, vi } from 'vitest'
//@ts-expect-error typing isn't provided
import nodeElmCompiler from 'node-elm-compiler'

import { compile } from './compiler.js'

beforeEach(() => {
  vi.spyOn(nodeElmCompiler, 'compileToString').mockImplementation(() => 'compiled!')
})

it('calls node-elm-compiler', async () => {
  expect(await compile(['a', 'b', 'c'], { debug: false, optimize: true, verbose: true })).toBe('compiled!')

  expect(nodeElmCompiler.compileToString).toBeCalledWith(['a', 'b', 'c'], {
    output: '.js',
    debug: false,
    optimize: true,
    verbose: true,
  })
})
