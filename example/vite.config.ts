import fs from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import plugin from 'vite-plugin-elm'
import { run as runEOL2 } from 'elm-optimize-level-2'
import {temporaryFile } from 'tempy';

const compileWithEOL2 = async (targets: string[]) => {
  const output = temporaryFile({extension: 'elm'});
  await runEOL2({
    inputFilePath: targets,
    outputFilePath: output,
    optimizeSpeed: true,
    processOpts: { stdio: ['inherit', 'ignore', 'inherit'] },
  })
  return fs.readFileSync(output).toString()
}

const elmPlugin = () => plugin(
  process.env.NODE_ENV === 'production' && !!process.env.CUSTOM_COMPILER ? { compiler: { compile: compileWithEOL2 } } : {}
)

export default defineConfig({
  plugins: [elmPlugin()],
  worker: {
    format: 'es',
    plugins: () => [elmPlugin()],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        application: resolve(__dirname, 'application.html'),
        elements: resolve(__dirname, 'elements.html'),
        raw: resolve(__dirname, 'raw.html'),
        worker: resolve(__dirname, 'worker.html'),
      },
    },
  },
})
