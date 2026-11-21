// Release guard: the `/react` entry must ship with its 'use client' directive,
// or consumers' RSC graph silently loses the client boundary.
import { readFileSync } from 'node:fs'

const DIRECTIVE = /^\s*['"]use client['"]/

for (const file of ['dist/react.mjs']) {
  if (!DIRECTIVE.test(readFileSync(file, 'utf8'))) {
    throw new Error(`${file} lost its 'use client' directive`)
  }
}
console.log("'use client' preserved in dist/react.mjs")
