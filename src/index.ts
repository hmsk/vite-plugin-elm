import { Plugin, Transform } from 'vite'
//@ts-ignore
import compiler from 'node-elm-compiler'

const transform = (): Transform => {
  return {
    test: ({ path }) => path.endsWith('.elm'),
    transform: async ({ path, isBuild }) => {
      const compiled = await compiler.compileToString([path], { output: '.js', optimize: isBuild, verbose: isBuild, debug: !isBuild })
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
