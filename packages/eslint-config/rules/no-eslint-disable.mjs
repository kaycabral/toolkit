// Custom rule: bans EVERY `eslint-disable*` directive in code. A wrong rule is
// changed in eslint.config.mjs through review, never silenced inline.
//
// Por que custom e não só o nativo `linterOptions.noInlineConfig`:
//   noInlineConfig neutraliza os directives mas reporta apenas WARNING (não
//   configurável pra error) — não barra um lint que roda sem `--max-warnings 0`.
//   Esta rule reporta ERROR (hard-fail). O `noInlineConfig` fica ligado em
//   paralelo como backstop: torna o disable inerte, então NÃO dá pra silenciar
//   esta própria regra com um `// eslint-disable-line cbrl/no-eslint-disable`.

export const noEslintDisable = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow all eslint-disable directives',
      recommended: true,
    },
    schema: [],
    messages: {
      disableForbidden:
        'eslint-disable directive is forbidden. If the rule is wrong, change it in eslint.config.mjs.',
    },
  },
  create(context) {
    return {
      Program() {
        const comments = context.getSourceCode().getAllComments()
        for (const comment of comments) {
          const text = comment.value.trim()
          // Match: eslint-disable, eslint-disable-line, eslint-disable-next-line
          if (/^eslint-disable(-line|-next-line)?(\s|$)/.test(text)) {
            context.report({
              loc: comment.loc,
              messageId: 'disableForbidden',
            })
          }
        }
      },
    }
  },
}
