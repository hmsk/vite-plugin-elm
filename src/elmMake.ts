import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { x } from 'tinyexec'

export interface ElmMakeOptions {
  // Directory having elm.json, where `elm make` runs
  cwd: string
  debug: boolean
  optimize: boolean
  // Defaults to `elm` in node_modules/.bin of cwd or its ancestors, then in PATH
  pathToElm?: string
}

type MessageChunk = string | { bold: boolean; underline: boolean; color: string | null; string: string }

interface Region {
  start: { line: number; column: number }
  end: { line: number; column: number }
}

// The shape `elm make --report=json` writes to stderr
type Report =
  | { type: 'error'; path: string | null; title: string; message: MessageChunk[] }
  | {
      type: 'compile-errors'
      errors: { path: string; name: string; problems: { title: string; region: Region; message: MessageChunk[] }[] }[]
    }

export class ElmCompileError extends Error {
  readonly title: string
  // Picked up by Vite to point at the source
  readonly id?: string
  readonly loc?: { file: string; line: number; column: number }

  constructor(message: string, title: string, location?: { file: string } & Region['start']) {
    super(message)
    this.name = 'ElmCompileError'
    // It's about the Elm code, so the plugin's stack trace is just noise next to it
    this.stack = `${this.name}: ${message}`
    this.title = title
    if (location) {
      this.id = location.file
      this.loc = location
    }
  }
}

const ansiColors: Record<string, number> = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
}

const renderChunk = (chunk: MessageChunk, colored: boolean): string => {
  if (typeof chunk === 'string' || !colored) return typeof chunk === 'string' ? chunk : chunk.string
  const codes: number[] = []
  if (chunk.bold) codes.push(1)
  if (chunk.underline) codes.push(4)
  // Elm uses upper case for vivid colors
  const color = chunk.color && ansiColors[chunk.color.toLowerCase()]
  if (color) codes.push(chunk.color === chunk.color?.toUpperCase() ? color + 60 : color)
  return codes.length > 0 ? `\x1b[${codes.join(';')}m${chunk.string}\x1b[0m` : chunk.string
}

const renderProblem = (title: string, file: string | null, message: MessageChunk[], colored: boolean): string => {
  const header = `-- ${title} `.padEnd(80 - (file?.length ?? 0) - 1, '-') + (file ? ` ${file}` : '')
  return `${colored ? `\x1b[36m${header}\x1b[0m` : header}\n\n${message.map((chunk) => renderChunk(chunk, colored)).join('')}`
}

export const toCompileError = (stderr: string, cwd: string, colored = !process.env.NO_COLOR): Error => {
  let report: Report
  try {
    // Elm may print other text (e.g. about a corrupted elm-stuff) before the JSON, and raw tabs inside it
    report = JSON.parse(stderr.slice(stderr.indexOf('{')).replace(/\t/g, '\\t'))
  } catch {
    return new Error(`elm make failed:\n${stderr}`)
  }

  if (report.type === 'error') {
    return new ElmCompileError(
      renderProblem(report.title, report.path && path.relative(cwd, report.path), report.message, colored),
      report.title,
    )
  }

  const problems = report.errors.flatMap((error) => error.problems.map((problem) => ({ ...problem, path: error.path })))
  const message = problems
    .map((problem) => renderProblem(problem.title, path.relative(cwd, problem.path), problem.message, colored))
    .join('\n\n')
  const [first] = problems
  return new ElmCompileError(
    message,
    first?.title ?? 'COMPILE ERROR',
    first && { file: first.path, ...first.region.start },
  )
}

export const elmMake = async (targets: string[], options: ElmMakeOptions): Promise<string> => {
  const command = options.pathToElm ?? 'elm'
  const outputDirectory = await mkdtemp(path.join(tmpdir(), 'vite-plugin-elm-'))
  // Elm can't write JS to stdout
  const output = path.join(outputDirectory, 'elm.js')
  const args = [
    'make',
    // Relative paths keep the command line short, which matters on Windows
    ...targets.map((target) => path.relative(options.cwd, target)),
    `--output=${output}`,
    '--report=json',
    ...(options.debug ? ['--debug'] : []),
    ...(options.optimize ? ['--optimize'] : []),
  ]

  try {
    const result = await run(command, args, options.cwd)
    if (result.exitCode !== 0) throw toCompileError(result.stderr || result.stdout, options.cwd)
    return await readFile(output, 'utf8')
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
}

// cmd.exe exits with this when it can't find the command, which tinyexec runs through on Windows
const WINDOWS_COMMAND_NOT_FOUND = 9009

const commandNotFound = (command: string, cause: unknown) =>
  new Error(
    `Could not run \`${command}\`. Install elm in your project (npm i -D elm), or point the pathToElm option at an elm binary.`,
    { cause },
  )

const run = async (command: string, args: string[], cwd: string) => {
  let result: Awaited<ReturnType<typeof x>>
  try {
    result = await x(command, args, {
      throwOnError: false,
      nodeOptions: {
        cwd,
        // The Elm compiler can crash without a UTF-8 locale
        env: process.env.LANG ? undefined : { LANG: 'en_US.UTF-8' },
      },
    })
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === 'ENOENT') throw commandNotFound(command, e)
    throw e
  }
  if (process.platform === 'win32' && result.exitCode === WINDOWS_COMMAND_NOT_FOUND) {
    throw commandNotFound(command, result.stderr)
  }
  return result
}
