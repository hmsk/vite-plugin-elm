import { expect, it, vi } from 'vitest'
//@ts-expect-error typing isn't provided
import nodeElmCompiler from 'node-elm-compiler'

import { compile } from './compiler.js'

const compiled = `_Platform_export({'Hello':{'init':$author$project$Hello$main($elm$json$Json$Decode$string)({'versions':{'elm':'0.19.1'},'types':{'message':'Hello.Msg','aliases':{},'unions':{'Hello.Msg':{'args':[],'tags':{'Name':['String.String']}},'String.String':{'args':[],'tags':{'String':[]}}}}})}});}(this));`

it('calls node-elm-compiler', async () => {
  vi.spyOn(nodeElmCompiler, 'compileToString').mockImplementation(() => compiled)

  expect(await compile(['a', 'b', 'c'], { debug: false, optimize: true, verbose: true })).toMatch(
    /export const Elm = {'Hello':/,
  )

  expect(nodeElmCompiler.compileToString).toBeCalledWith(['a', 'b', 'c'], {
    output: '.js',
    debug: false,
    optimize: true,
    verbose: true,
  })
})

it('executes manual command', async () => {
  expect(
    await compile(['a', 'b', 'c'], {
      command: () => `echo "${compiled.replace('$', '\\$')}"`,
    }),
  ).toMatch(/export const Elm = {'Hello':/)
})

it('executes manual command which fails', async () => {
  expect(
    compile(['a', 'b', 'c'], {
      command: () => `whatever`,
    }),
  ).rejects.toMatch(/Failed to run command/)
})
