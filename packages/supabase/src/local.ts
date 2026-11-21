import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/** URLs and keys of the local Supabase stack, from `supabase status`. */
export type LocalSupabase = {
  apiUrl: string
  publishableKey: string
  secretKey: string
  /** Postgres URL as the `postgres` owner role. */
  dbUrl: string
}

/** Options for {@link findSupabaseAppDir}. */
export type FindSupabaseAppDirOptions = {
  /**
   * Subdirectories also probed at each level, so the search works from a
   * monorepo root. Defaults to `['apps/web']`.
   */
  subdirs?: readonly string[]
}

const ENV_KEY = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/

const CONFIG_FILE = path.join('supabase', 'config.toml')

/**
 * The directory holding `supabase/config.toml`, found by walking up from `cwd`
 * (and probing `subdirs` at each level). Throws when none is found.
 */
export function findSupabaseAppDir(
  cwd: string = process.cwd(),
  options: FindSupabaseAppDirOptions = {},
): string {
  const { subdirs = ['apps/web'] } = options
  for (let dir = path.resolve(cwd); ; dir = path.dirname(dir)) {
    for (const candidate of [dir, ...subdirs.map((subdir) => path.join(dir, subdir))]) {
      if (existsSync(path.join(candidate, CONFIG_FILE))) return candidate
    }
    if (path.dirname(dir) === dir) throw new Error(`${CONFIG_FILE} not found above ${cwd}`)
  }
}

function field(status: Record<string, unknown>, key: string): string {
  const value = status[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`supabase status: missing ${key}. Is the local stack running?`)
  }
  return value
}

/** Options for {@link readLocalSupabase}. */
export type ReadLocalSupabaseOptions = {
  /** Where to start looking for the app directory. Defaults to `process.cwd()`. */
  cwd?: string
}

/**
 * URL, keys and database URL of the LOCAL Supabase stack, read from
 * `pnpm exec supabase status -o json` in the app directory so nothing is
 * hard-coded. For Node scripts and Playwright configs only.
 */
export function readLocalSupabase(options: ReadLocalSupabaseOptions = {}): LocalSupabase {
  const raw = execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json', '--workdir', '.'], {
    cwd: findSupabaseAppDir(options.cwd),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const status: unknown = JSON.parse(raw)
  if (typeof status !== 'object' || status === null) {
    throw new Error('supabase status: unexpected output')
  }
  const record = Object.fromEntries(Object.entries(status))
  return {
    apiUrl: field(record, 'API_URL'),
    publishableKey: field(record, 'PUBLISHABLE_KEY'),
    secretKey: field(record, 'SECRET_KEY'),
    dbUrl: field(record, 'DB_URL'),
  }
}

/** `dbUrl` with its credentials swapped for `user` / `password` (e.g. a non-owner runtime role). */
export function withRole(dbUrl: string, user: string, password: string): string {
  const url = new URL(dbUrl)
  url.username = encodeURIComponent(user)
  url.password = encodeURIComponent(password)
  return url.toString()
}

/** Options for {@link writeEnvLocal}. */
export type WriteEnvLocalOptions = {
  /** Directory holding the env files. */
  appDir: string
  /** Target file name. Defaults to `.env.local`. */
  file?: string
  /** Template copied when the target does not exist yet. Defaults to `.env.example`. */
  template?: string
}

/**
 * Upserts `KEY=value` lines into `.env.local` (created from `.env.example` when
 * missing), leaving every other line untouched, and restricts the file to its
 * owner (mode `0o600`). Returns the path written.
 */
export function writeEnvLocal(
  values: Readonly<Record<string, string>>,
  options: WriteEnvLocalOptions,
): string {
  const { appDir, file = '.env.local', template = '.env.example' } = options
  const target = path.join(appDir, file)
  const templatePath = path.join(appDir, template)
  const source = existsSync(target) ? target : templatePath
  const content = existsSync(source) ? readFileSync(source, 'utf8') : ''

  const updates = new Map(Object.entries(values))
  const seen = new Set<string>()
  const lines = content.split('\n').map((line) => {
    const key = ENV_KEY.exec(line)?.[1]
    const value = key === undefined ? undefined : updates.get(key)
    if (key === undefined || value === undefined) return line
    seen.add(key)
    return `${key}=${value}`
  })
  if (lines.at(-1) === '') lines.pop()
  for (const [key, value] of updates) {
    if (!seen.has(key)) lines.push(`${key}=${value}`)
  }

  writeFileSync(target, `${lines.join('\n')}\n`, { mode: 0o600 })
  chmodSync(target, 0o600)
  return target
}
