import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
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
  execFileSync(
    join(exampleDir, 'node_modules/.bin/elm'),
    ['make', ...entries.map((name) => `src/${name}.elm`), '--output=/dev/null'],
    { cwd: exampleDir, stdio: 'inherit' },
  )
}
