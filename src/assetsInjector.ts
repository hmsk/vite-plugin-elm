import type { Literal, Node } from 'acorn'
import { parse } from 'acorn'
import { fullAncestor as walk } from 'acorn-walk'
import crypto from 'crypto'

// Matched against string values, not the source, as tools like elm-optimize-level-2 rewrite quotes
const ASSET_TAG = /^\[VITE_PLUGIN_ELM_ASSET:(?<path>.+)\]$/
const HELPER_PACKAGE_IDENTIFIER = 'VITE_PLUGIN_HELPER_ASSET'

const importNameFrom = (path: string) => {
  return '_' + crypto.createHash('sha1').update(path).digest('hex')
}

const generateImports = (paths: string[]) => {
  // A path comes from a string in Elm code, possibly in a package, so it must stay a string
  return paths.map((path) => `import ${importNameFrom(path)} from ${JSON.stringify(path)}`).join('\n')
}

const isLiteral = (node: Node): node is Literal => node.type === 'Literal'
const isStringLiteral = (node: Node): node is Literal & { value: string } =>
  isLiteral(node) && typeof node.value === 'string'

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
            value?: unknown
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
  arguments?: Node[]
}
const isCallExpression = (node: Node): node is NodeCallExpression => node.type === 'CallExpression'

export const injectAssets = (compiledESM: string) => {
  const taggedPaths: {
    path: string
    start: number
    end: number
  }[] = []

  const ast = parse(compiledESM, { ecmaVersion: 'latest', sourceType: 'module' })
  let helperFunctionName: string
  walk<Node[]>(
    ast,
    (node, state) => {
      if (isLiteral(node)) {
        // Find callers of VitePluginHelper.asset
        if (!helperFunctionName && node.value === HELPER_PACKAGE_IDENTIFIER) {
          const helperFunc = state?.find(
            (nodeOnState): nodeOnState is NodeDeclarator =>
              isDeclarator(nodeOnState) &&
              nodeOnState?.init?.body?.body?.[0]?.argument?.left?.value === HELPER_PACKAGE_IDENTIFIER,
          )
          if (helperFunc?.id?.name) {
            helperFunctionName = helperFunc.id.name
            walk(
              ast,
              (node) => {
                if (isCallExpression(node) && node?.callee?.name === helperFunctionName) {
                  if (node?.arguments?.length === 1 && isStringLiteral(node.arguments[0])) {
                    const matchedPath = node.arguments[0].value
                    taggedPaths.push({
                      path: matchedPath,
                      start: node.start,
                      end: node.end,
                    })
                  } else {
                    const argument = node.arguments?.map((arg) => compiledESM.slice(arg.start, arg.end)).join(', ')
                    throw new Error(
                      'VitePluginHelper.asset takes only a string literal, like `asset "/assets/logo.png"`. ' +
                        'Vite resolves assets at build time, so the path cannot be built from variables or concatenation. ' +
                        `Found in the compiled JavaScript: asset(${argument})`,
                    )
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
        const matched = typeof node.value === 'string' ? ASSET_TAG.exec(node.value) : null
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
    undefined,
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
