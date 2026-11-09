import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { compile, findClosestElmJson } from './compiler.js'
import { elmMake } from './elmMake.js'

vi.mock('./elmMake.js', () => ({ elmMake: vi.fn() }))

const compiled = `(function(scope){
'use strict';
function _Platform_export(exports) { scope['Elm'] = exports; }
_Platform_export({'Hello':{'init':function() { return 'hello'; }}});}(this));`

describe('compile', () => {
  it('runs elm make in the directory having elm.json', async () => {
    vi.mocked(elmMake).mockResolvedValue(compiled)
    const root = mkdtempSync(path.join(tmpdir(), 'vite-plugin-elm-'))
    try {
      writeFileSync(path.join(root, 'elm.json'), '{}')
      const main = path.join(root, 'src', 'Main.elm')

      expect(await compile([main], { debug: false, optimize: true })).toMatch(/export const Elm = scope\.Elm;/)
      expect(elmMake).toHaveBeenCalledWith([main], { debug: false, optimize: true, cwd: root })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('runs a custom compiler', async () => {
    expect(
      await compile(['a', 'b', 'c'], {
        compile: async (targets) => (targets[1] === 'b' ? compiled : ''),
      }),
    ).toMatch(/export const Elm = scope\.Elm;/)
  })

  it('tells when a custom compiler fails', async () => {
    await expect(
      compile(['a', 'b', 'c'], {
        compile: async () => Promise.reject(new Error('sad')),
      }),
    ).rejects.toThrow('Failed to run the custom compiler: sad')
  })

  it('postprocesses the output of the compiler before making it an ES module', async () => {
    vi.mocked(elmMake).mockResolvedValue(compiled)
    const postprocess = vi.fn(async (js: string) => js.replace("'hello'", "'postprocessed'"))

    const result = await compile(['Main.elm'], { debug: false, optimize: true }, postprocess)

    expect(postprocess).toHaveBeenCalledWith(compiled)
    expect(result).toContain("return 'postprocessed';")
    expect(result).toMatch(/export const Elm = scope\.Elm;/)
  })

  it('postprocesses the output of a custom compiler too', async () => {
    expect(
      await compile(['Main.elm'], { compile: async () => compiled }, (js) => js.replace("'hello'", "'sync'")),
    ).toContain("return 'sync';")
  })

  it('tells when postprocess fails', async () => {
    vi.mocked(elmMake).mockResolvedValue(compiled)

    await expect(
      compile(['Main.elm'], { debug: false, optimize: true }, () => {
        throw new Error('sad')
      }),
    ).rejects.toThrow('Failed to run postprocess: sad')
  })
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
