import type { Node } from 'acorn'
import { parse } from 'acorn'
import { fullAncestor as walk } from 'acorn-walk'
import crypto from 'crypto'

const ASSET_TAG = /'\[VITE_PLUGIN_ELM_ASSET:(?<path>.+?)\]'/g
const HELPER_PACKAGE_IDENTIFIER = 'VITE_PLUGIN_HELPER_ASSET'

const importNameFrom = (path: string) => {
  return '_' + crypto.createHash('sha1').update(path).digest('hex')
}

const generateImports = (paths: string[]) => {
  return paths.map((path) => `import ${importNameFrom(path)} from '${path}'`).join('\n')
}

interface NodeLiteral extends Node {
  raw: string
  value: string
}
const isLiteral = (node: Node): node is NodeLiteral => node.type === 'Literal'

interface NodeDeclarator extends Node {
  raw: string
  id?: {
    name?: string
  }
  init?: {
    body?: {
      body?: {
        argument?: {
          left?: {
            raw?: string
          }
        }
      }[]
    }
  }
}
const isDeclarator = (node: Node): node is NodeDeclarator => node.type === 'VariableDeclarator'

interface NodeCallExpression extends Node {
  callee?: {
    name?: string
  }
  arguments?: (NodeLiteral | Node)[]
}
const isCallExpression = (node: Node): node is NodeCallExpression => node.type === 'CallExpression'

export const injectAssets = (compiledESM: string) => {
  const taggedPaths: {
    path: string
    start: number
    end: number
  }[] = []

  const ast = parse(compiledESM, { ecmaVersion: 2015, sourceType: 'module' })
  let helperFunctionName: string
  walk(
    ast,
    (node, state) => {
      if (isLiteral(node)) {
        // Find callers of VitePluginHelper.asset
        if (!helperFunctionName && node.raw === `'${HELPER_PACKAGE_IDENTIFIER}'`) {
          const helperFunc = state?.find(
            (nodeOnState): nodeOnState is NodeDeclarator =>
              isDeclarator(nodeOnState) &&
              nodeOnState?.init?.body?.body?.[0]?.argument?.left?.raw === `'${HELPER_PACKAGE_IDENTIFIER}'`,
          )
          if (helperFunc?.id?.name) {
            helperFunctionName = helperFunc.id.name
            walk(
              ast,
              (node) => {
                if (isCallExpression(node) && node?.callee?.name === helperFunctionName) {
                  if (node?.arguments?.length === 1 && isLiteral(node.arguments[0])) {
                    const matchedPath = node.arguments[0].value
                    taggedPaths.push({
                      path: matchedPath,
                      start: node.start,
                      end: node.end,
                    })
                  } else {
                    throw 'Arguments for VitePluginHelper should be just a plain String'
                  }
                }
              },
              undefined,
              null,
            )
          }
          return
        }

        // Find plain asset tags
        const matched = ASSET_TAG.exec(node.raw)
        if (matched !== null) {
          if (matched.groups?.path) {
            taggedPaths.push({
              path: matched.groups.path,
              start: node.start,
              end: node.end,
            })
          }
        }
      }
    },
    undefined,
    null,
  )

  if (taggedPaths.length > 0) {
    const src = compiledESM.split('')
    const importPaths: string[] = []
    taggedPaths.forEach(({ path, start, end }) => {
      for (let i = start; i < end; i++) {
        src[i] = ''
      }
      src[start] = importNameFrom(path)
      if (!importPaths.includes(path)) {
        importPaths.push(path)
      }
    })
    return `${generateImports(importPaths)}\n\n${src.join('')}`
  } else {
    return compiledESM
  }
}
