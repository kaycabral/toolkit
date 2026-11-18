// Custom rule: bans a hardcoded VALUE fallback on `process.env.<ANY>`.
//
// Encodes "fail-fast over silent default". It applies to ANY env var, not only
// secrets: a literal default hides misconfiguration — the app runs with a
// trivial value instead of failing and revealing the variable was never set.
//
// Flagged anti-pattern (the right operand is a VALUE literal):
//   const url = process.env.APP_URL ?? 'http://localhost:3000'
//   const x   = process.env.X || 'default'
//   process.env.X ??= 'literal'
//   process.env.X ||= 'literal'
//   const p   = process.env.A ?? process.env.B ?? 'literal'   // chain ending in a literal
//
// Correct pattern: read it and fail loudly when missing.
//   const url = process.env.APP_URL
//   if (!url) throw new Error('APP_URL not set')
//   // or `requireEnv('APP_URL')` from @cbrl/env.
//
// NOT a violation (the default is not a value literal, so nothing is masked):
//   - boolean / logical `||`: `if (process.env.X || process.env.Y)`, `!!a || !!b`
//   - env→env chain with no literal: `process.env.A ?? process.env.B` (throws downstream)
//   - absence normalization: `process.env.X ?? null`, `?? undefined`
//   - non-literal fallback: `process.env.XDG_CONFIG_HOME ?? join(homedir(), ...)`

// VALUE literal: string/number/boolean/bigint/template. Excludes `null`
// (an ESLint Literal with value === null): `?? null` normalizes, it is not a default.
function isValueLiteralFallback(node) {
  if (!node) return false
  if (node.type === 'TemplateLiteral') return true
  if (node.type === 'Literal') return node.value !== null
  return false
}

function isProcessEnvAccess(node) {
  return (
    node?.type === 'MemberExpression' &&
    node.object?.type === 'MemberExpression' &&
    node.object?.object?.name === 'process' &&
    node.object?.property?.name === 'env'
  )
}

// `left` "comes from process.env" when it is a direct access OR a ??/|| chain
// whose leftmost root is process.env — catches `process.env.A ?? process.env.B ?? 'lit'`.
function leftRootIsProcessEnv(node) {
  if (isProcessEnvAccess(node)) return true
  if (node?.type === 'LogicalExpression' && (node.operator === '??' || node.operator === '||')) {
    return leftRootIsProcessEnv(node.left)
  }
  return false
}

// Leftmost env var name (for the message), walking down the ??/|| chain.
function leftmostEnvVarName(node) {
  if (isProcessEnvAccess(node)) return node.property?.name
  if (node?.type === 'LogicalExpression') return leftmostEnvVarName(node.left)
  return undefined
}

export const noEnvValueFallback = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded value fallback on `process.env.<ANY>` — read and fail-fast instead.',
      recommended: true,
    },
    schema: [],
    messages: {
      envFallback:
        "A literal fallback on `process.env.{{varName}}` hides misconfiguration: the app runs with a trivial value instead of failing. Read it fail-fast (`requireEnv('{{varName}}')` from @cbrl/env). Non-value defaults are fine: `?? null`, an env→env chain, or a computed path.",
    },
  },
  create(context) {
    function report(opNode, nameSourceNode) {
      const varName = leftmostEnvVarName(nameSourceNode)
      if (!varName) return
      context.report({ node: opNode, messageId: 'envFallback', data: { varName } })
    }

    return {
      // process.env.X ?? 'lit'  |  process.env.X || 'lit'  |  A ?? B ?? 'lit'
      'LogicalExpression[operator="??"]'(node) {
        if (leftRootIsProcessEnv(node.left) && isValueLiteralFallback(node.right)) {
          report(node, node.left)
        }
      },
      'LogicalExpression[operator="||"]'(node) {
        if (leftRootIsProcessEnv(node.left) && isValueLiteralFallback(node.right)) {
          report(node, node.left)
        }
      },
      // process.env.X ??= 'lit'  |  process.env.X ||= 'lit'
      'AssignmentExpression[operator="??="]'(node) {
        if (isProcessEnvAccess(node.left) && isValueLiteralFallback(node.right)) {
          report(node, node.left)
        }
      },
      'AssignmentExpression[operator="||="]'(node) {
        if (isProcessEnvAccess(node.left) && isValueLiteralFallback(node.right)) {
          report(node, node.left)
        }
      },
    }
  },
}
