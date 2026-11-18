// Custom rule: bans EVERY `eslint-disable*` directive in code. A wrong rule is
// changed in eslint.config.mjs through review, never silenced inline.
//
// Why a custom rule and not just the native `linterOptions.noInlineConfig`:
//   noInlineConfig neutralizes the directives but only reports a WARNING (not
//   configurable as an error), so it does not fail a lint run without
//   `--max-warnings 0`. This rule reports an ERROR (hard fail). `noInlineConfig`
//   stays on alongside it as a backstop: it makes the directive inert, so this
//   rule cannot be silenced with `// eslint-disable-line cbrl/no-eslint-disable`.

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
