import { Plugin, Transform } from 'vite'

const transform = (): Transform => {
  return {
    test: ({ path }) => path.endsWith('.elm'),
    transform: ({ code }) => {
      return {
        code: code
      }
    }
  }
}

export const plugin = (): Plugin => {
  return {
    transforms: [transform()]
  }
}
