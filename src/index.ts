import { Plugin, Transform } from 'vite'
//@ts-ignore
import compiler from 'node-elm-compiler'
//@ts-ignore
import { toESModule } from 'elm-esm'

const transform = (): Transform => {
  return {
    test: ({ path }) => path.endsWith('.elm'),
    transform: async ({ path, isBuild }) => {
      const compiled = await compiler.compileToString([path], { output: '.js', optimize: isBuild, verbose: isBuild, debug: !isBuild })
      return {
        code: toESModule(compiled)
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
