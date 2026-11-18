// Custom rule: proíbe fallback hardcoded de VALOR em `process.env.<ANY>`.
//
// Codifica princípio canônico do harness: "fail-fast > silent default".
// Vale pra QUALQUER env var (não só secrets): um default literal mascara
// misconfig — o app roda com um valor trivial em vez de quebrar e expor que a
// env não foi setada.
//
// Anti-pattern detectado (right operand é um literal de VALOR):
//   const url = process.env.APP_URL ?? 'http://localhost:3000'
//   const x   = process.env.X || 'default'
//   process.env.X ??= 'literal'
//   process.env.X ||= 'literal'
//   const p   = process.env.A ?? process.env.B ?? 'literal'   // cadeia que termina em literal
//
// Padrão correto: leia e falhe alto se ausente.
//   const url = process.env.APP_URL
//   if (!url) throw new Error('APP_URL not set')
//   // ou um helper `env('APP_URL')` que faz isso.
//
// NÃO viola (default não é literal de valor — não mascara misconfig):
//   - `||` booleano / lógica: `if (process.env.X || process.env.Y)`, `!!a || !!b`
//   - cadeia env→env sem literal: `process.env.A ?? process.env.B` (termina em throw downstream)
//   - normalização de ausência: `process.env.X ?? null`, `?? undefined`
//   - fallback que não é literal: `process.env.XDG_CONFIG_HOME ?? join(homedir(), ...)`

// Literal de VALOR: string/number/boolean/bigint/template. Exclui `null`
// (ESLint: Literal com value === null) — `?? null` é normalização, não default.
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

// `left` "vem de process.env" se é um acesso direto OU uma cadeia ??/|| cuja
// raiz à esquerda é process.env — pega `process.env.A ?? process.env.B ?? 'lit'`.
function leftRootIsProcessEnv(node) {
  if (isProcessEnvAccess(node)) return true
  if (node?.type === 'LogicalExpression' && (node.operator === '??' || node.operator === '||')) {
    return leftRootIsProcessEnv(node.left)
  }
  return false
}

// Nome da env mais à esquerda (pra mensagem), descendo a cadeia ??/||.
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
