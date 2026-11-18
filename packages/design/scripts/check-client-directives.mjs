// Release guard: every source module marked 'use client' must ship with the
// directive in dist/, or consumers' RSC graph silently loses the client boundary.
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIRECTIVE = /^\s*['"]use client['"]/

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

const marked = (root, pattern, strip) =>
  new Set(
    walk(root)
      .filter((file) => pattern.test(file) && DIRECTIVE.test(readFileSync(file, 'utf8')))
      .map((file) => relative(root, file).replace(strip, '')),
  )

const source = marked('src', /\.tsx?$/, /\.tsx?$/)
const shipped = marked('dist', /\.js$/, /\.js$/)
const missing = [...source].filter((module) => !shipped.has(module))
const extra = [...shipped].filter((module) => !source.has(module))

if (missing.length > 0 || extra.length > 0) {
  console.error(JSON.stringify({ missing, extra }, null, 2))
  throw new Error("dist/ 'use client' directives diverge from src/")
}
console.log(`'use client' preserved in ${shipped.size} modules`)
