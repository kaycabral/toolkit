import { afterEach, describe, expect, it } from 'vitest'

import {
  authEmulatorHost,
  emulatorProjectId,
  firebaseEmulatorWebServer,
  firestoreEmulatorHost,
} from './index'

const EMULATOR_VARS = [
  'GCLOUD_PROJECT',
  'FIRESTORE_EMULATOR_HOST',
  'FIREBASE_AUTH_EMULATOR_HOST',
] as const

afterEach(() => {
  for (const v of EMULATOR_VARS) delete process.env[v]
})

describe('emulator host readers', () => {
  it('return injected values', () => {
    process.env.GCLOUD_PROJECT = 'demo-local'
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
    expect(emulatorProjectId()).toBe('demo-local')
    expect(firestoreEmulatorHost()).toBe('127.0.0.1:8080')
    expect(authEmulatorHost()).toBe('127.0.0.1:9099')
  })

  it('fail-fast when not running under emulators:exec', () => {
    expect(() => firestoreEmulatorHost()).toThrow(/Missing required env: FIRESTORE_EMULATOR_HOST/)
    expect(() => emulatorProjectId()).toThrow(/Missing required env: GCLOUD_PROJECT/)
  })
})

describe('firebaseEmulatorWebServer', () => {
  it('derives the health-check URL from the port (no hard-coded URL drift)', () => {
    const ws = firebaseEmulatorWebServer({
      command: 'pnpm run dev',
      port: 3003,
      projectId: 'imovil-local',
    })
    expect(ws.url).toBe('http://127.0.0.1:3003')
    expect(ws.command).toBe('pnpm run dev')
  })

  it('wires the firebase defaults from the project id', () => {
    const ws = firebaseEmulatorWebServer({ command: 'x', port: 3000, projectId: 'demo-local' })
    expect(ws.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS).toBe('true')
    expect(ws.env.FIREBASE_ADMIN_PROJECT_ID).toBe('demo-local')
    expect(ws.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('demo-local')
    expect(ws.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).toBe('demo-local.firebasestorage.app')
  })

  it('does not set emulator hosts (they are inherited from emulators:exec)', () => {
    const ws = firebaseEmulatorWebServer({ command: 'x', port: 3000, projectId: 'demo-local' })
    expect(ws.env).not.toHaveProperty('FIRESTORE_EMULATOR_HOST')
    expect(ws.env).not.toHaveProperty('FIREBASE_AUTH_EMULATOR_HOST')
  })

  it('merges app-specific env over the defaults', () => {
    const ws = firebaseEmulatorWebServer({
      command: 'x',
      port: 3000,
      projectId: 'demo-local',
      env: { NEXT_PUBLIC_MAPTILER_API_KEY: 'ci-local', NEXT_PUBLIC_FIREBASE_API_KEY: 'override' },
    })
    expect(ws.env.NEXT_PUBLIC_MAPTILER_API_KEY).toBe('ci-local')
    expect(ws.env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('override')
  })
})
