import { resolve } from 'path'
import { defineConfig } from 'vite'
import plugin from 'vite-plugin-elm'

export default defineConfig({
  plugins: [plugin()],
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
