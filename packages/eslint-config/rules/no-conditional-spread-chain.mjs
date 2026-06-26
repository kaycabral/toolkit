// Custom rule: proíbe spread condicional aninhado em outro spread condicional.
//
// Codifica decisão canônica do PR #971 (commit `abec9de7`) + recidiva no
// PR #972 (commit `285e0f1c`). Memória de projeto não previne recidiva
// cross-instância de Claude; análise sintática previne.
//
// Anti-pattern:
//
//   const obj = {
//     base: 1,
//     ...(c1
//       ? { foo: mapValue({
//           ...(c2 ? { a: x } : {}),         // ← spread aninhado dentro
//           ...(c3 ? { b: y } : {}),         //   de outro spread cond
//         }) }
//       : {}),
//   }
//
// Por quê é ruim:
//   - Legibilidade ruim (nesting profundo, ternário + spread misturados)
//   - TypeScript infer fica frágil (vira `Partial<X>` / `Record<string,unknown>`)
//   - Repetição da expressão de teste (`c1.x` 3-6× no mesmo bloco)
//   - Esconde forma final do objeto — leitor expande mentalmente
//
// Padrão correto: record intermediário + `if`s explícitos.
//
//   const inner: Record<string, X> = {}
//   if (c2) inner.a = x
//   if (c3) inner.b = y
//   const obj: Record<string, Y> = { base: 1 }
//   if (c1) obj.foo = mapValue(inner)
//
// Referência canonical: `buildPlanSnapshot` em
// `packages/oilio/shared/src/utils/plan-snapshot.ts` (resolução da
// recidiva flagada em #971).
//
// Distinção (NÃO confundir):
//   - Spread condicional ÚNICO E RASO (`...(opts.foo ? { foo: ... } : {})`)
//     é idiomático — esta rule NÃO dispara nele.
//   - Só dispara quando há aninhamento (spread cond dentro de spread cond).

function isConditionalSpread(node) {
  return node?.type === 'SpreadElement' && node.argument?.type === 'ConditionalExpression'
}

// Walk recursivo procurando outro spread condicional dentro do nó dado.
// Caminha por ObjectExpression, CallExpression args, ArrayExpression,
// ConditionalExpression branches e Property values — cobre os formatos
// reais do anti-pattern (incluindo o caso `mapValue({...cond...})` onde o
// spread aninhado mora dentro de uma chamada de helper).
function containsConditionalSpread(node, depthBudget = 50) {
  if (!node || depthBudget <= 0) return false
  if (isConditionalSpread(node)) return true

  switch (node.type) {
    case 'ObjectExpression':
      return node.properties.some((p) => containsConditionalSpread(p, depthBudget - 1))
    case 'CallExpression':
    case 'NewExpression':
      return (node.arguments ?? []).some((a) => containsConditionalSpread(a, depthBudget - 1))
    case 'ConditionalExpression':
      return (
        containsConditionalSpread(node.consequent, depthBudget - 1) ||
        containsConditionalSpread(node.alternate, depthBudget - 1)
      )
    case 'ArrayExpression':
      return (node.elements ?? []).some((e) => e && containsConditionalSpread(e, depthBudget - 1))
    case 'Property':
      return containsConditionalSpread(node.value, depthBudget - 1)
    case 'SpreadElement':
      return containsConditionalSpread(node.argument, depthBudget - 1)
    case 'LogicalExpression':
    case 'BinaryExpression':
      return (
        containsConditionalSpread(node.left, depthBudget - 1) ||
        containsConditionalSpread(node.right, depthBudget - 1)
      )
    default:
      return false
  }
}

export const noConditionalSpreadChain = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow nested conditional-spread (`...(c ? {...(c2 ? {} : {}), ...} : {})`); use intermediate record + explicit ifs.',
      recommended: true,
    },
    schema: [],
    messages: {
      chain:
        'Spread condicional aninhado dentro de outro spread condicional. Refatore com record intermediário + `if`s explícitos — ver `buildPlanSnapshot` em `@oilio/shared/src/utils/plan-snapshot.ts` (decisão canônica PR #971). Spread condicional único e raso é OK; só aninhamento é proibido.',
    },
  },
  create(context) {
    return {
      SpreadElement(node) {
        if (node.argument?.type !== 'ConditionalExpression') return
        const cond = node.argument
        if (
          containsConditionalSpread(cond.consequent) ||
          containsConditionalSpread(cond.alternate)
        ) {
          context.report({ node, messageId: 'chain' })
        }
      },
    }
  },
}
