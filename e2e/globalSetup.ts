import { execFileSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { exampleDir, repositoryDir } from './example.js'

export default function setup() {
  if (!existsSync(join(exampleDir, 'node_modules'))) {
    throw new Error('Install the example first: npm install --prefix example')
  }
  // The example uses this plugin from dist. Built without type checks, as CI runs it on Vite 6 and 7 too,
  // whose types differ from Vite 8's that the plugin is checked with
  execFileSync('npm', ['run', 'build', '--', '--noCheck'], { cwd: repositoryDir, stdio: 'inherit' })
  // Download Elm packages and compile every entry once, before test files compile their copies of the example at once
  const entries = ['Hello', 'Application', 'Description', 'AnotherDescription', 'Worker', 'WorkerCompanion']
  // One by one, as Elm now and then crashes on a fresh elm-stuff when it is given several:
  // "d.dat: openBinaryFile: resource busy (file is locked)" and "thread blocked indefinitely in an MVar operation"
  const compileEntries = () => {
    for (const name of entries) {
      execFileSync(join(exampleDir, 'node_modules/.bin/elm'), ['make', `src/${name}.elm`, '--output=/dev/null'], {
        cwd: exampleDir,
        stdio: 'inherit',
      })
    }
  }
  try {
    compileEntries()
  } catch {
    // The crash may leave elm-stuff broken, so try once more from scratch
    console.warn('Compiling the example again from a clean elm-stuff')
    rmSync(join(exampleDir, 'elm-stuff'), { recursive: true, force: true })
    compileEntries()
  }
}
