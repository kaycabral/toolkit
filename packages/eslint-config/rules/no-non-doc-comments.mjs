import ts from 'typescript'

const MACHINE_PRAGMAS = [
  /^\s*@ts-(expect-error|ignore|nocheck|check)\b/,
  /^\/\s*<(reference|amd-module|amd-dependency)\b/,
  /^\s*globals?\s/,
  /^\s*eslint-env\b/,
  /^\s*prettier-ignore\b/,
  /^\s*(c8|v8|istanbul|node:coverage)\b/,
  /^\s*@(jest|vitest)-environment\b/,
  /^\s*#!/,
  /^\s*#?__(PURE|NO_SIDE_EFFECTS)__\s*$/,
  /^\s*@(license|preserve|__PURE__|__NO_SIDE_EFFECTS__|vite-ignore)\b/,
  /webpackChunkName|webpackPrefetch|webpackPreload|webpackMode|webpackIgnore/,
  /^#\s*sourceMappingURL=/,
  /^\s*#?(end)?region\b/,
]

const ESLINT_DIRECTIVE = /^\s*eslint(-disable(-line|-next-line)?|-enable)?\b/

function collectTaggedJsDocRanges(tsSource) {
  const ranges = new Set()
  const visit = (node) => {
    const jsDoc = node.jsDoc
    if (Array.isArray(jsDoc)) {
      for (const doc of jsDoc) {
        if (Array.isArray(doc.tags) && doc.tags.length > 0) {
          ranges.add(`${doc.pos}:${doc.end}`)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(tsSource)
  return ranges
}

function isMachinePragma(text) {
  return MACHINE_PRAGMAS.some((pattern) => pattern.test(text))
}

function jsxContainerAround(sourceCode, comment) {
  const node = sourceCode.getNodeByRangeIndex(comment.range[0])
  if (node === null) return null
  if (node.type === 'JSXExpressionContainer' && node.expression?.type === 'JSXEmptyExpression') {
    return node
  }
  if (node.type === 'JSXEmptyExpression' && node.parent?.type === 'JSXExpressionContainer') {
    return node.parent
  }
  return null
}

export const noNonDocComments = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        'Disallow every comment except machine pragmas and compiler-attached TSDoc — the code is the single source of truth (oilio zero-comment policy).',
      recommended: false,
    },
    schema: [],
    messages: {
      prose:
        'Comments are forbidden here. Only machine pragmas (@ts-*, ///<reference>, prettier-ignore, coverage) and compiler-attached TSDoc (/** */ above a declaration) survive — everything a human reads must live in the code itself, never in prose that can drift from it. Delete this comment; make the code self-explanatory, promote a load-bearing reason to a test, or attach TSDoc to the symbol.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    const services = sourceCode.parserServices
    const program = services?.program
    const tsSource = program?.getSourceFile(context.filename)
    const hasProgram = tsSource !== undefined && tsSource !== null
    const taggedJsDoc = hasProgram ? collectTaggedJsDocRanges(tsSource) : new Set()

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          const text = comment.value

          if (ESLINT_DIRECTIVE.test(text)) continue
          if (isMachinePragma(text)) continue

          if (comment.type === 'Block' && text.startsWith('*')) {
            if (!hasProgram) continue
            const key = `${comment.range[0]}:${comment.range[1]}`
            if (taggedJsDoc.has(key)) continue
          }

          context.report({
            loc: comment.loc,
            messageId: 'prose',
            fix(fixer) {
              const fullText = sourceCode.getText()
              const container = jsxContainerAround(sourceCode, comment)
              const [rangeStart, rangeEnd] = container === null ? comment.range : container.range

              let from = rangeStart
              while (from > 0 && (fullText[from - 1] === ' ' || fullText[from - 1] === '\t')) {
                from -= 1
              }
              let to = rangeEnd
              const lineStartIsBlank = from === 0 || fullText[from - 1] === '\n'
              if (lineStartIsBlank && fullText[to] === '\n') {
                to += 1
              }
              return fixer.removeRange([from, to])
            },
          })
        }
      },
    }
  },
}
