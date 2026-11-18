import assert from 'node:assert/strict'
import { test } from 'node:test'
import { format } from 'prettier'
import base from './index.mjs'
import tailwind from './tailwind.mjs'

// Both plugins fail silently (no-op) when they cannot load, so assert their effect.
test('organizes imports', async () => {
  const output = await format("import { b } from 'b'\nimport { a } from 'a'\nconsole.log(a, b)\n", {
    ...base,
    parser: 'typescript',
    filepath: 'x.ts',
  })
  assert.equal(output, "import { a } from 'a'\nimport { b } from 'b'\nconsole.log(a, b)\n")
})

test('sorts Tailwind classes and still organizes imports', async () => {
  const output = await format(
    "import { b } from 'b'\nimport { a } from 'a'\nexport const x = <div className=\"p-2 flex\">{a}{b}</div>\n",
    { ...tailwind, parser: 'typescript', filepath: 'x.tsx' },
  )
  assert.match(output, /^import \{ a \} from 'a'\nimport \{ b \} from 'b'/)
  assert.match(output, /className="flex p-2"/)
})
