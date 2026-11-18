// Custom rule: bans a conditional spread nested inside another conditional spread.
//
// A recurring review finding turned into a syntactic check, so it cannot regress.
//
// Anti-pattern:
//
//   const obj = {
//     base: 1,
//     ...(c1
//       ? { foo: mapValue({
//           ...(c2 ? { a: x } : {}),         // ← spread nested inside
//           ...(c3 ? { b: y } : {}),         //   another conditional spread
//         }) }
//       : {}),
//   }
//
// Why it hurts:
//   - Poor readability (deep nesting, ternaries mixed with spreads)
//   - Fragile TypeScript inference (degrades to `Partial<X>` / `Record<string, unknown>`)
//   - The test expression repeats (`c1.x` 3-6 times in the same block)
//   - Hides the final shape of the object — the reader expands it mentally
//
// Correct pattern: an intermediate record plus explicit `if`s.
//
//   const inner: Record<string, X> = {}
//   if (c2) inner.a = x
//   if (c3) inner.b = y
//   const obj: Record<string, Y> = { base: 1 }
//   if (c1) obj.foo = mapValue(inner)
//
// Do NOT confuse with:
//   - A SINGLE, SHALLOW conditional spread (`...(opts.foo ? { foo: ... } : {})`)
//     is idiomatic — this rule does NOT fire on it.
//   - It only fires on nesting (a conditional spread inside a conditional spread).

function isConditionalSpread(node) {
  return node?.type === 'SpreadElement' && node.argument?.type === 'ConditionalExpression'
}

// Recursive walk looking for another conditional spread inside the given node.
// Visits ObjectExpression, CallExpression args, ArrayExpression,
// ConditionalExpression branches and Property values — the real shapes of the
// anti-pattern (including `mapValue({...cond...})`, where the nested spread
// lives inside a helper call).
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
        'Conditional spread nested inside another conditional spread. Build an intermediate record with explicit `if`s instead. A single, shallow conditional spread is fine; only nesting is banned.',
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
