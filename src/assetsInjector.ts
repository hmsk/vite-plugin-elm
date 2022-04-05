import type { Node } from 'acorn'
import { parse } from 'acorn'
import { fullAncestor as walk } from 'acorn-walk'

const ASSET_TAG = /'\[VITE_PLUGIN_ELM_ASSET:(?<path>.+?)\]'/g

const importNameFrom = (path: string) => {
  return path.replace(/[/.\-~@?]/g, '_')
}

const generateImports = (paths: string[]) => {
  return paths.map((path) => `import ${importNameFrom(path)} from '${path}'`).join('\n')
}

interface NodeWithRaw extends Node {
  raw: string
}
const isLiteral = (node: Node): node is NodeWithRaw => node.type === 'Literal'

const assetsInjector = (compiledElmCodeInEsm: string) => {
  const taggedPaths: Record<string, { path: string; start: number; end: number }> = {}

  walk(
    parse(compiledElmCodeInEsm, { ecmaVersion: 2015, sourceType: 'module' }),
    (node) => {
      if (isLiteral(node)) {
        const matched = ASSET_TAG.exec(node.raw)
        if (matched !== null) {
          if (matched.groups?.path) {
            taggedPaths[importNameFrom(matched.groups.path)] = {
              path: matched.groups.path,
              start: node.start,
              end: node.end,
            }
          }
        }
      }
    },
    undefined,
    null,
  )

  if (Object.keys(taggedPaths).length > 0) {
    const src = compiledElmCodeInEsm.split('')
    const importPaths: string[] = []
    Object.entries(taggedPaths).forEach(([importName, { path, start, end }]) => {
      importPaths.push(path)
      for (let i = start; i < end; i++) {
        src[i] = ''
      }
      src[start] = importName
    })
    return `${generateImports(importPaths)}\n\n${src.join('')}`
  } else {
    return compiledElmCodeInEsm
  }
}

export default assetsInjector
