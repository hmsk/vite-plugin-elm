import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { mkdtemp, readdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer, type AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

export const repositoryDir = resolve(import.meta.dirname, '..')
export const exampleDir = join(repositoryDir, 'example')

// A copy of the example for one test file, so edits stay in that file and test files can run at once
const copyExample = async () => {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'vite-plugin-elm-e2e-')))
  const entries = (await readdir(exampleDir)).filter((name) => !['node_modules', 'dist'].includes(name))
  // `cp -p` keeps modification times to the nanosecond, which Node's cp doesn't. Then Elm takes the copied elm-stuff
  // as up to date, instead of initializing it in every copy at once, which can crash Elm on a busy machine:
  // https://github.com/elm/compiler/issues/2279
  await promisify(execFile)('cp', ['-Rp', ...entries.map((name) => join(exampleDir, name)), dir])
  // The example's own dependencies: the Vite and Elm versions under test, and this plugin linked from the repository
  await symlink(join(exampleDir, 'node_modules'), join(dir, 'node_modules'), 'junction')
  return dir
}

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = createServer()
      .once('error', reject)
      .listen(0, '127.0.0.1', () => {
        const { port } = server.address() as AddressInfo
        server.close(() => resolve(port))
      })
  })

interface ViteProcess {
  child: ChildProcess
  output: () => string
}

// Run Vite as a user would: without Vitest's variables, and without the NODE_ENV=test it sets,
// which Vite would keep for `vite build` as well
const { NODE_ENV: _, ...inheritedEnv } = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith('VITEST')),
)

const vite = (dir: string, args: string[], env: Record<string, string> = {}): ViteProcess => {
  const child = spawn(process.execPath, [join(dir, 'node_modules/vite/bin/vite.js'), ...args], {
    cwd: dir,
    env: { ...inheritedEnv, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout?.on('data', (chunk) => (output += chunk))
  child.stderr?.on('data', (chunk) => (output += chunk))
  return { child, output: () => output }
}

const exited = ({ child }: ViteProcess) =>
  new Promise<number | null>((resolve) => {
    if (child.exitCode !== null) {
      resolve(child.exitCode)
    } else {
      child.once('exit', (code) => resolve(code))
    }
  })

const build = async (dir: string, env?: Record<string, string>) => {
  const process = vite(dir, ['build'], env)
  if ((await exited(process)) !== 0) {
    throw new Error(`vite build failed:\n${process.output()}`)
  }
}

const serve = async (dir: string, command: 'dev' | 'preview') => {
  const port = await freePort()
  const args = ['--port', String(port), '--strictPort', '--host', '127.0.0.1']
  const process = vite(dir, command === 'dev' ? args : ['preview', ...args])
  const url = `http://127.0.0.1:${port}`
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (process.child.exitCode !== null) {
      break
    }
    try {
      await fetch(url)
      return { process, url }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  process.child.kill()
  throw new Error(`vite ${command} did not start:\n${process.output()}`)
}

interface Options {
  command: 'dev' | 'preview'
  // Environment variables for `vite build`
  env?: Record<string, string>
}

/**
 * Runs the example with Vite for the tests in the current file or describe block.
 * Every test gets a new page, and files edited by `amend` are put back after each test.
 */
export const useExample = ({ command, env }: Options) => {
  let dir: string
  let server: Awaited<ReturnType<typeof serve>>
  let browser: Browser
  let context: BrowserContext
  let page: Page
  const originals = new Map<string, string>()

  beforeAll(async () => {
    dir = await copyExample()
    if (command === 'preview') {
      await build(dir, env)
    }
    server = await serve(dir, command)
    browser = await chromium.launch()
  })

  beforeEach(async () => {
    context = await browser.newContext()
    await context.tracing.start({ screenshots: true, snapshots: true })
    page = await context.newPage()
    page.setDefaultTimeout(10_000)
  })

  afterEach(async ({ task }) => {
    // Open a trace with `npx playwright show-trace test-results/<name>.zip`
    const name = task.fullName.replace(/[^\w.-]+/g, '-')
    await context.tracing.stop(
      task.result?.state === 'fail' ? { path: join(repositoryDir, 'test-results', `${name}.zip`) } : {},
    )
    await context.close()
    for (const [file, content] of originals) {
      await writeFile(file, content)
    }
    originals.clear()
  })

  afterAll(async () => {
    await browser?.close()
    if (server) {
      server.process.child.kill()
      await exited(server.process)
    }
    if (dir) {
      await rm(dir, { recursive: true, force: true })
    }
  })

  return {
    get page() {
      return page
    },
    url: (path: string) => new URL(path, server.url).toString(),
    goto: (path: string) => page.goto(new URL(path, server.url).toString()),
    // Replaces `target` in a file of the example copy, e.g. `src/Hello.elm`
    amend: async (path: string, target: string, replacement: string) => {
      const file = join(dir, path)
      const content = await readFile(file, 'utf8')
      if (!content.includes(target)) {
        throw new Error(`${path} does not contain ${JSON.stringify(target)}`)
      }
      if (!originals.has(file)) {
        originals.set(file, content)
      }
      await writeFile(file, content.replace(target, replacement))
    },
  }
}

// How the page was last loaded, to tell HMR from a full reload
export const navigationType = (page: Page) =>
  page.evaluate(() => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type)

// An Elm module outside the Vite root and the workspace, so outside server.fs.allow
export const writeElmOutsideRoot = async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'vite-plugin-elm-outside-')), 'Outside.elm')
  await writeFile(path, 'module Outside exposing (main)\n\nimport Html\n\n\nmain =\n    Html.text "OUTSIDE-OF-ROOT"\n')
  return path
}
