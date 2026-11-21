import { beforeEach, describe, expect, it, vi } from 'vitest'

import { smokeSuite } from './smoke'

type Fixtures = Record<string, unknown>
type TestBody = (fixtures: Fixtures) => Promise<void>

const registered = new Map<string, TestBody>()

const hasTitle = (value: unknown): value is { title: () => Promise<string> } =>
  typeof value === 'object' && value !== null && 'title' in value

vi.mock('@playwright/test', () => ({
  test: (title: string, body: TestBody) => {
    registered.set(title, body)
  },
  expect: (actual: unknown) => ({
    toBe: (expected: unknown) => expect(actual).toBe(expected),
    toBeLessThan: (expected: number) => expect(actual).toBeLessThan(expected),
    toMatchObject: (expected: Record<string, unknown>) => expect(actual).toMatchObject(expected),
    toHaveTitle: async (pattern: RegExp) => {
      if (!hasTitle(actual)) throw new Error('not a page')
      expect(await actual.title()).toMatch(pattern)
    },
  }),
}))

function run(title: string, fixtures: Fixtures): Promise<void> {
  const body = registered.get(title)
  if (!body) throw new Error(`test not registered: ${title}`)
  return body(fixtures)
}

const response = (status: number, json: unknown = {}) => ({
  status: () => status,
  json: () => Promise.resolve(json),
})

const page = (title: string, status: number | null) => ({
  goto: vi.fn(() => Promise.resolve(status === null ? null : response(status))),
  title: () => Promise.resolve(title),
})

beforeEach(() => {
  registered.clear()
})

describe('smokeSuite', () => {
  it('registers the health and home tests', () => {
    smokeSuite()
    expect([...registered.keys()]).toEqual(['health endpoint returns ok', 'home page renders'])
  })

  it('checks the default health path and home page', async () => {
    smokeSuite()
    const get = vi.fn(() => Promise.resolve(response(200, { status: 'ok', sha: 'abc' })))
    await run('health endpoint returns ok', { request: { get } })
    expect(get).toHaveBeenCalledWith('/api/health')

    const home = page('Home', 200)
    await run('home page renders', { page: home })
    expect(home.goto).toHaveBeenCalledWith('/')
  })

  it('uses custom paths', async () => {
    smokeSuite({ healthPath: '/healthz', homePath: '/pt' })
    const get = vi.fn(() => Promise.resolve(response(200, { status: 'ok' })))
    await run('health endpoint returns ok', { request: { get } })
    expect(get).toHaveBeenCalledWith('/healthz')

    const home = page('Home', 304)
    await run('home page renders', { page: home })
    expect(home.goto).toHaveBeenCalledWith('/pt')
  })

  it('fails when the health endpoint is down or the page has no title', async () => {
    smokeSuite()
    await expect(
      run('health endpoint returns ok', { request: { get: () => Promise.resolve(response(503)) } }),
    ).rejects.toThrow()
    await expect(run('home page renders', { page: page('', null) })).rejects.toThrow()
  })
})
