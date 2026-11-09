import { parse, type CallExpression, type ExpressionStatement, type FunctionExpression } from 'acorn'

const isElmWrapper = (
  node: unknown,
): node is ExpressionStatement & { expression: CallExpression & { callee: FunctionExpression } } => {
  const statement = node as ExpressionStatement
  return (
    statement.type === 'ExpressionStatement' &&
    statement.expression.type === 'CallExpression' &&
    statement.expression.callee.type === 'FunctionExpression' &&
    statement.expression.callee.params.length === 1 &&
    statement.expression.callee.params[0].type === 'Identifier'
  )
}

/**
 * Turns the output of the Elm compiler, `(function(scope){ ... }(this));`, into an ES module.
 * Its body stays at the top level (HMR touches Elm's internals there), and `scope.Elm` gets exported.
 */
export const toESModule = (compiled: string): string => {
  const unexpected = 'Unexpected output from the Elm compiler: expected `(function(scope){ ... }(this));`'
  let program: ReturnType<typeof parse>
  try {
    program = parse(compiled, { ecmaVersion: 'latest', sourceType: 'script' })
  } catch (e) {
    throw new Error(`${unexpected}, but ${e instanceof Error ? e.message : e}`, { cause: e })
  }
  const wrapper = program.body.find(isElmWrapper)
  if (!wrapper) throw new Error(unexpected)

  const callee = wrapper.expression.callee
  const scope = callee.params[0].type === 'Identifier' ? callee.params[0].name : 'scope'
  const body = compiled.slice(callee.body.start + 1, callee.body.end - 1)
  return `${compiled.slice(0, wrapper.start)}const ${scope} = {};${body}\nexport const Elm = ${scope}.Elm;\n${compiled.slice(wrapper.end)}`
}
