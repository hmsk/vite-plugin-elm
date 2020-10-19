import { Plugin, Transform } from 'vite'
//@ts-ignore
import compiler from 'node-elm-compiler'

const transform = (): Transform => {
  return {
    test: ({ path }) => path.endsWith('.elm'),
    transform: async ({ code, path }) => {
      const compiled = await compiler.compileToString([path], { output: '.js' })
      return {
        code: `let output = {}; (function () { ${compiled} }).call(output); export default output.Elm;`
      }
    }
  }
}

export const plugin = (): Plugin => {
  return {
    transforms: [transform()]
  }
}

export default plugin
