import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { commandExists, ElmCompileError, elmMake, toCompileError } from './elmMake.js'

const cwd = path.resolve('/project')

const compileErrors = JSON.stringify({
  type: 'compile-errors',
  errors: [
    {
      path: path.join(cwd, 'src', 'Bad.elm'),
      name: 'Bad',
      problems: [
        {
          title: 'TYPE MISMATCH',
          region: { start: { line: 6, column: 20 }, end: { line: 6, column: 23 } },
          message: [
            'I cannot do addition with ',
            { bold: false, underline: false, color: 'yellow', string: 'String' },
            ' values: ',
            { bold: false, underline: false, color: 'RED', string: '^^^' },
            '\n\n',
            { bold: false, underline: true, color: null, string: 'Hint' },
            ': Switch to (++)',
          ],
        },
      ],
    },
  ],
})

describe('toCompileError', () => {
  it('renders compile errors like the Elm CLI, pointing at the first problem', () => {
    const error = toCompileError(compileErrors, cwd, false)

    expect(error).toBeInstanceOf(ElmCompileError)
    expect(error).toMatchObject({
      title: 'TYPE MISMATCH',
      id: path.join(cwd, 'src', 'Bad.elm'),
      loc: { file: path.join(cwd, 'src', 'Bad.elm'), line: 6, column: 20 },
    })
    expect(error.message).toMatch(
      new RegExp(`^-- TYPE MISMATCH -+ ${path.join('src', 'Bad.elm').replace(/\\/g, '\\\\')}\n`),
    )
    expect(error.message).toContain('I cannot do addition with String values: ^^^\n\nHint: Switch to (++)')
  })

  it('keeps colors of the message', () => {
    const { message } = toCompileError(compileErrors, cwd, true)

    expect(message).toContain('\x1b[33mString\x1b[0m')
    expect(message).toContain('\x1b[91m^^^\x1b[0m')
    expect(message).toContain('\x1b[4mHint\x1b[0m')
  })

  it('renders a general error', () => {
    const error = toCompileError(
      'Some notice from elm\n' + JSON.stringify({ type: 'error', path: null, title: 'NO MAIN', message: ['No main.'] }),
      cwd,
      false,
    )

    expect(error).toMatchObject({ title: 'NO MAIN', id: undefined })
    expect(error.message).toMatch(/^-- NO MAIN -+\n\nNo main\.$/)
  })

  it('falls back to the raw output when it is not a report', () => {
    const error = toCompileError('elm: thread blocked indefinitely', cwd)

    expect(error).not.toBeInstanceOf(ElmCompileError)
    expect(error.message).toBe('elm make failed:\nelm: thread blocked indefinitely')
  })
})

describe('elmMake', () => {
  let root: string
  let fakeElm: string

  beforeEach(() => {
    root = realpathSync(mkdtempSync(path.join(tmpdir(), 'vite-plugin-elm-')))
    fakeElm = path.join(root, 'fake-elm.mjs')
    writeFileSync(
      fakeElm,
      `#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
const args = process.argv.slice(2)
if (args.some((arg) => arg.endsWith('Broken.elm'))) {
  process.stderr.write(JSON.stringify({ type: 'error', path: null, title: 'NO MAIN', message: ['No main.'] }))
  process.exit(1)
}
const output = args.find((arg) => arg.startsWith('--output=')).slice('--output='.length)
writeFileSync(output, JSON.stringify({ args: args.filter((arg) => arg !== '--output=' + output), cwd: process.cwd() }))
`,
    )
    chmodSync(fakeElm, 0o755)
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('runs elm make in cwd with targets relative to it, and returns the output', async () => {
    const output = await elmMake([path.join(root, 'src', 'Main.elm'), path.join(root, 'src', 'Other.elm')], {
      cwd: root,
      debug: false,
      optimize: true,
      pathToElm: fakeElm,
    })

    expect(JSON.parse(output)).toEqual({
      args: ['make', path.join('src', 'Main.elm'), path.join('src', 'Other.elm'), '--report=json', '--optimize'],
      cwd: root,
    })
  })

  it('passes --debug', async () => {
    const output = await elmMake([path.join(root, 'Main.elm')], {
      cwd: root,
      debug: true,
      optimize: false,
      pathToElm: fakeElm,
    })

    expect(JSON.parse(output).args).toEqual(['make', 'Main.elm', '--report=json', '--debug'])
  })

  it('throws the error reported by elm', async () => {
    await expect(
      elmMake([path.join(root, 'Broken.elm')], { cwd: root, debug: false, optimize: false, pathToElm: fakeElm }),
    ).rejects.toMatchObject({ name: 'ElmCompileError', title: 'NO MAIN' })
  })

  it('tells how to get elm when it cannot run', async () => {
    await expect(
      elmMake([path.join(root, 'Main.elm')], {
        cwd: root,
        debug: false,
        optimize: false,
        pathToElm: 'surely-not-an-elm-binary',
      }),
    ).rejects.toThrow('Could not run `surely-not-an-elm-binary`. Install elm in your project (npm i -D elm)')
  })
})

describe('commandExists', () => {
  it('finds a command in the directory of node, and in PATH', () => {
    expect(commandExists(path.basename(process.execPath, '.exe'), tmpdir())).toBe(true)
  })

  it('finds a path relative to cwd', () => {
    const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'vite-plugin-elm-')))
    try {
      writeFileSync(path.join(root, 'elm.cmd'), '')
      expect(commandExists('./elm.cmd', root)).toBe(true)
      expect(commandExists('./missing', root)).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('finds a command in node_modules/.bin of an ancestor', () => {
    const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'vite-plugin-elm-')))
    try {
      mkdirSync(path.join(root, 'node_modules', '.bin'), { recursive: true })
      mkdirSync(path.join(root, 'app', 'src'), { recursive: true })
      writeFileSync(path.join(root, 'node_modules', '.bin', 'some-elm'), '')
      expect(commandExists('some-elm', path.join(root, 'app', 'src'))).toBe(true)
      expect(commandExists('surely-not-an-elm-binary', path.join(root, 'app', 'src'))).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
