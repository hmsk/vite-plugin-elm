import { describe, expect, test, vi } from 'vitest'
//@ts-expect-error typing isn't provided
import nodeElmCompiler from 'node-elm-compiler'

import { compile } from './compiler.js'

const compiled = `_Platform_export({'Hello':{'init':$author$project$Hello$main($elm$json$Json$Decode$string)({'versions':{'elm':'0.19.1'},'types':{'message':'Hello.Msg','aliases':{},'unions':{'Hello.Msg':{'args':[],'tags':{'Name':['String.String']}},'String.String':{'args':[],'tags':{'String':[]}}}}})}});}(this));`

describe('compiler', () => {
  test('calls node-elm-compiler', async () => {
    vi.spyOn(nodeElmCompiler, 'compileToString').mockImplementation(() => compiled)

    expect(await compile(['a', 'b', 'c'], { debug: false, optimize: true, verbose: true })).toMatch(
      /export const Elm = {'Hello':/,
    )

    expect(nodeElmCompiler.compileToString).toHaveBeenCalledWith(['a', 'b', 'c'], {
      output: '.js',
      debug: false,
      optimize: true,
      verbose: true,
    })
  })

  test('executes manual command', async () => {
    expect(
      await compile(['a', 'b', 'c'], {
        compile: async (targets) => (targets[1] === 'b' ? compiled : ''),
      }),
    ).toMatch(/export const Elm = {'Hello':/)
  })

  test('executes manual command which fails', async () => {
    await expect(
      compile(['a', 'b', 'c'], {
        compile: async () => Promise.reject('sad'),
      }),
    ).rejects.toMatch(/Failed to run command/)
  })
})
