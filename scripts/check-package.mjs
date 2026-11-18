// Validates the tarball that will actually be published: packs with pnpm (the
// publish path, which rewrites `workspace:`/`catalog:`), asserts no protocol
// leaked into the manifest, then runs publint and (for JS packages) attw on it.
//
// Usage (from a package dir): node ../../scripts/check-package.mjs [--types] [attw args...]
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const checkTypes = args.includes('--types')
const attwArgs = args.filter((arg) => arg !== '--types')

const run = (command, commandArgs) =>
  execFileSync(command, commandArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })

const destination = mkdtempSync(join(tmpdir(), 'cbrl-pack-'))
try {
  const packed = JSON.parse(run('pnpm', ['pack', '--json', '--pack-destination', destination]))
  const tarball = packed.filename
  const manifest = run('tar', ['-xOzf', tarball, 'package/package.json'])
  const leaked = manifest.match(/"(workspace|catalog):[^"]*"/g)
  if (leaked) throw new Error(`Packed package.json leaks pnpm protocols: ${leaked.join(', ')}`)

  run('publint', ['--strict', '--pack', 'false'])
  if (checkTypes) {
    process.stdout.write(
      run('attw', [tarball, '--profile', 'esm-only', '--format', 'ascii', ...attwArgs]),
    )
  }
  console.log(`${packed.name}@${packed.version}: ${packed.files.length} files, manifest clean`)
} finally {
  rmSync(destination, { recursive: true, force: true })
}
