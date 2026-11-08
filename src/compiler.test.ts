import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
//@ts-expect-error typing isn't provided
import nodeElmCompiler from 'node-elm-compiler'

import { compile, findClosestElmJson } from './compiler.js'

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
      compile: async (targets) => (targets[1] === 'b' ? compiled : ''),
    }),
  ).toMatch(/export const Elm = {'Hello':/)
})

it('executes manual command which fails', async () => {
  await expect(
    compile(['a', 'b', 'c'], {
      compile: async () => Promise.reject('sad'),
    }),
  ).rejects.toMatch(/Failed to run command/)
})

describe('findClosestElmJson', () => {
  describe('on the file system', () => {
    let root: string
    const touch = (...segments: string[]) => {
      const file = path.join(root, ...segments)
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, '')
      return file
    }

    beforeEach(() => {
      root = mkdtempSync(path.join(tmpdir(), 'vite-plugin-elm-'))
    })

    afterEach(() => {
      rmSync(root, { recursive: true, force: true })
    })

    it('finds the closest directory having elm.json', () => {
      touch('elm.json')
      touch('nested', 'elm.json')
      const main = touch('nested', 'src', 'Deep', 'Main.elm')

      expect(findClosestElmJson(main)).toBe(path.join(root, 'nested'))
    })

    it('resolves a relative path from the current directory', () => {
      touch('elm.json')
      const main = touch('src', 'Main.elm')

      expect(findClosestElmJson(path.relative(process.cwd(), main))).toBe(root)
    })

    it('ignores a directory named elm.json', () => {
      mkdirSync(path.join(root, 'elm.json'))
      const main = touch('src', 'Main.elm')

      expect(findClosestElmJson(main)).toBeUndefined()
    })
  })

  describe.each([
    {
      platform: 'Windows',
      pathImpl: path.win32,
      cases: [
        { from: 'C:\\work\\app\\src\\Main.elm', files: ['C:\\work\\app\\elm.json'], expected: 'C:\\work\\app' },
        { from: 'C:\\work\\app\\src\\Main.elm', files: ['C:\\elm.json'], expected: 'C:\\' },
        { from: 'C:\\work\\app\\src\\Main.elm', files: ['D:\\work\\app\\elm.json'], expected: undefined },
        {
          from: '\\\\server\\share\\app\\src\\Main.elm',
          files: ['\\\\server\\share\\elm.json'],
          expected: '\\\\server\\share\\',
        },
        { from: '\\\\server\\share\\app\\src\\Main.elm', files: [], expected: undefined },
      ],
    },
    {
      platform: 'POSIX',
      pathImpl: path.posix,
      cases: [
        { from: '/work/app/src/Main.elm', files: ['/work/app/elm.json'], expected: '/work/app' },
        { from: '/work/app/src/Main.elm', files: ['/elm.json'], expected: '/' },
        { from: '/work/app/src/Main.elm', files: [], expected: undefined },
      ],
    },
  ])('with $platform paths', ({ pathImpl, cases }) => {
    it.each(cases)('looks up from $from with $files', ({ from, files, expected }) => {
      const fileExists = (file: string) => files.includes(file)

      expect(findClosestElmJson(from, { pathImpl, fileExists })).toBe(expected)
    })
  })
})
