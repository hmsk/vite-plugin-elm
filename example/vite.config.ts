import { resolve } from 'path'
import { defineConfig } from 'vite'
import plugin from 'vite-plugin-elm'

const outputDir = process.env.GITHUB_WORKSPACE ?? __dirname
const compileWithElmOptimizeLevel2 = (targets) => `npx elm-optimize-level-2 -O3 --output ${outputDir}/elm.js ${targets[0]} > /dev/null && cat ${outputDir}/elm.js && rm -f ${outputDir}/elm.js > /dev/null`;

export default defineConfig({
  plugins: [plugin(
    process.env.NODE_ENV === 'production' && !!process.env.COMMAND_LINE ? { compiler: { command: compileWithElmOptimizeLevel2 } } : {}
  )],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        application: resolve(__dirname, 'application.html'),
        elements: resolve(__dirname, 'elements.html'),
        raw: resolve(__dirname, 'raw.html'),
      },
    },
  },
})
