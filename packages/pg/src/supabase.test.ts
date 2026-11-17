import { describe, expect, it } from 'vitest'
import { stripSslParams, SUPABASE_ROOT_CA_2021, supabaseSsl } from './supabase'

describe('supabaseSsl', () => {
  it('pins the Supabase root CA for Supabase pooler and direct hosts', () => {
    for (const url of [
      'postgresql://u:p@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
      'postgresql://u:p@db.abc.supabase.co:5432/postgres',
    ]) {
      expect(supabaseSsl(url)).toEqual({ ca: SUPABASE_ROOT_CA_2021 })
    }
  })

  it('leaves local and CI databases to the connection string', () => {
    expect(supabaseSsl('postgres://postgres:postgres@localhost:55432/gabar')).toBeUndefined()
    expect(supabaseSsl('postgres://postgres:postgres@postgres:5432/gabar')).toBeUndefined()
  })

  it('ships a single PEM certificate', () => {
    expect(SUPABASE_ROOT_CA_2021.match(/BEGIN CERTIFICATE/g)).toHaveLength(1)
  })
})

describe('stripSslParams', () => {
  it('drops ssl params and keeps the rest', () => {
    const url =
      'postgres://u:p@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x'
    expect(stripSslParams(url)).toBe(
      'postgres://u:p@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?supa=base-pooler.x',
    )
  })

  it('leaves a url without params untouched', () => {
    const url = 'postgres://postgres:postgres@localhost:54322/postgres'
    expect(stripSslParams(url)).toBe(url)
  })
})
