import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findSupabaseAppDir, readLocalSupabase, withRole, writeEnvLocal } from './local'

const execFileSync = vi.hoisted(() => vi.fn<(...args: unknown[]) => string>())
vi.mock('node:child_process', () => ({ execFileSync }))

let root: string

function makeApp(dir: string): string {
  mkdirSync(path.join(dir, 'supabase'), { recursive: true })
  writeFileSync(path.join(dir, 'supabase', 'config.toml'), '')
  return dir
}

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'cbrl-supabase-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  vi.clearAllMocks()
})

describe('findSupabaseAppDir', () => {
  it('finds the app directory from a nested cwd', () => {
    const app = makeApp(path.join(root, 'app'))
    const nested = path.join(app, 'src', 'e2e')
    mkdirSync(nested, { recursive: true })

    expect(findSupabaseAppDir(nested)).toBe(app)
  })

  it('probes apps/web from a monorepo root by default', () => {
    const app = makeApp(path.join(root, 'apps', 'web'))

    expect(findSupabaseAppDir(root)).toBe(app)
  })

  it('probes custom subdirectories', () => {
    const app = makeApp(path.join(root, 'site'))

    expect(findSupabaseAppDir(root, { subdirs: ['site'] })).toBe(app)
  })

  it('throws when no supabase/config.toml is found', () => {
    expect(() => findSupabaseAppDir(root, { subdirs: [] })).toThrow(
      `${path.join('supabase', 'config.toml')} not found above ${root}`,
    )
  })

  it('defaults to the process cwd', () => {
    const app = makeApp(path.join(root, 'app'))
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(app)

    expect(findSupabaseAppDir()).toBe(app)
    cwd.mockRestore()
  })
})

describe('readLocalSupabase', () => {
  const status = {
    API_URL: 'http://127.0.0.1:54321',
    PUBLISHABLE_KEY: 'sb_publishable_local',
    SECRET_KEY: 'sb_secret_local',
    DB_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  }

  it('reads the stack from `supabase status` in the app directory', () => {
    const app = makeApp(path.join(root, 'app'))
    execFileSync.mockReturnValue(JSON.stringify(status))

    expect(readLocalSupabase({ cwd: app })).toEqual({
      apiUrl: status.API_URL,
      publishableKey: status.PUBLISHABLE_KEY,
      secretKey: status.SECRET_KEY,
      dbUrl: status.DB_URL,
    })
    expect(execFileSync).toHaveBeenCalledWith(
      'pnpm',
      ['exec', 'supabase', 'status', '-o', 'json', '--workdir', '.'],
      expect.objectContaining({ cwd: app, encoding: 'utf8' }),
    )
  })

  it('defaults to the process cwd', () => {
    const app = makeApp(path.join(root, 'app'))
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(app)
    execFileSync.mockReturnValue(JSON.stringify(status))

    expect(readLocalSupabase().apiUrl).toBe(status.API_URL)
    cwd.mockRestore()
  })

  it.each(['null', '"text"'])('rejects unexpected output (%s)', (raw) => {
    const app = makeApp(path.join(root, 'app'))
    execFileSync.mockReturnValue(raw)

    expect(() => readLocalSupabase({ cwd: app })).toThrow('supabase status: unexpected output')
  })

  it.each([
    ['missing', {}],
    ['empty', { SECRET_KEY: '' }],
  ])('names a %s field', (_label, override) => {
    const app = makeApp(path.join(root, 'app'))
    const partial: Record<string, unknown> = { ...status, ...override }
    if (Object.keys(override).length === 0) delete partial.SECRET_KEY
    execFileSync.mockReturnValue(JSON.stringify(partial))

    expect(() => readLocalSupabase({ cwd: app })).toThrow(
      'supabase status: missing SECRET_KEY. Is the local stack running?',
    )
  })
})

describe('withRole', () => {
  it('swaps the credentials and keeps the rest of the URL', () => {
    expect(withRole('postgresql://postgres:postgres@127.0.0.1:54322/postgres', 'app', 'pw')).toBe(
      'postgresql://app:pw@127.0.0.1:54322/postgres',
    )
  })

  it('percent-encodes reserved characters', () => {
    const url = new URL(withRole('postgresql://u:p@localhost/db', 'app', 'p@ss:w%rd'))

    expect(decodeURIComponent(url.password)).toBe('p@ss:w%rd')
  })
})

describe('writeEnvLocal', () => {
  const values = { NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', POSTGRES_URL: 'pg://x' }

  it('creates .env.local from .env.example, upserting keys with mode 0o600', () => {
    writeFileSync(
      path.join(root, '.env.example'),
      '# Supabase\nNEXT_PUBLIC_SUPABASE_URL=\nOTHER=keep\n',
    )

    const target = writeEnvLocal(values, { appDir: root })

    expect(target).toBe(path.join(root, '.env.local'))
    expect(readFileSync(target, 'utf8')).toBe(
      '# Supabase\nNEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nOTHER=keep\nPOSTGRES_URL=pg://x\n',
    )
    expect(statSync(target).mode & 0o777).toBe(0o600)
  })

  it('updates an existing .env.local in place, including repeated keys', () => {
    const target = path.join(root, '.env.local')
    writeFileSync(target, 'POSTGRES_URL=old\nA=1\n POSTGRES_URL = older', { mode: 0o644 })
    writeFileSync(path.join(root, '.env.example'), 'IGNORED=1\n')

    writeEnvLocal(values, { appDir: root })

    expect(readFileSync(target, 'utf8')).toBe(
      'POSTGRES_URL=pg://x\nA=1\nPOSTGRES_URL=pg://x\nNEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\n',
    )
    expect(statSync(target).mode & 0o777).toBe(0o600)
  })

  it('starts empty when neither file exists, honouring custom names', () => {
    const target = writeEnvLocal({ KEY: 'v' }, { appDir: root, file: '.env.test', template: 'x' })

    expect(target).toBe(path.join(root, '.env.test'))
    expect(readFileSync(target, 'utf8')).toBe('KEY=v\n')
  })
})
