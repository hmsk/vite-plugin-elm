import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import plugin from 'vite-plugin-elm'
import { transform } from 'elm-optimize-level-2'

export default defineConfig(({ command }) => {
  // `npm run build:eol2` optimizes the compiled code further with elm-optimize-level-2
  const elmPlugin = () =>
    plugin(command === 'build' && !!process.env.EOL2 ? { postprocess: (compiled) => transform(compiled, true) } : {})

  return {
    plugins: [elmPlugin()],
    worker: {
      format: 'es' as const,
      plugins: () => [elmPlugin()],
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, 'index.html'),
          application: resolve(import.meta.dirname, 'application.html'),
          elements: resolve(import.meta.dirname, 'elements.html'),
          raw: resolve(import.meta.dirname, 'raw.html'),
          worker: resolve(import.meta.dirname, 'worker.html'),
        },
      },
    },
  }
})
