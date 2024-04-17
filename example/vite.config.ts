import { resolve } from 'path'
import { defineConfig } from 'vite'
import plugin from 'vite-plugin-elm'

export default defineConfig({
  plugins: [plugin(
    process.env.NODE_ENV === 'production' ? { compiler: { command: (targets) => `node_modules/.bin/elm-optimize-level-2 -O3 --output ${__dirname}/elm.js ${targets[0]} &> /dev/null && cat ${__dirname}/elm.js` }} : {}
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
