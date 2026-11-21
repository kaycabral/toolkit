import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const execFileSync = vi.hoisted(() => vi.fn())
const os = vi.hoisted(() => ({ hostname: vi.fn(), networkInterfaces: vi.fn() }))

vi.mock('node:child_process', () => ({ execFileSync }))
vi.mock('node:os', () => os)

const { commitSha, devOrigins } = await import('./runtime')

describe('commitSha', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_COMMIT_SHA', '')
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    execFileSync.mockReset()
  })

  it('prefers NEXT_PUBLIC_COMMIT_SHA', () => {
    vi.stubEnv('NEXT_PUBLIC_COMMIT_SHA', 'aaa')
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'bbb')
    expect(commitSha()).toBe('aaa')
  })

  it('falls back to VERCEL_GIT_COMMIT_SHA', () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'bbb')
    expect(commitSha()).toBe('bbb')
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it('falls back to git rev-parse HEAD', () => {
    execFileSync.mockReturnValue(Buffer.from('ccc\n'))
    expect(commitSha()).toBe('ccc')
    expect(execFileSync).toHaveBeenCalledWith('git', ['rev-parse', 'HEAD'], expect.any(Object))
  })

  it("returns 'unknown' when git fails", () => {
    execFileSync.mockImplementation(() => {
      throw new Error('not a git repository')
    })
    expect(commitSha()).toBe('unknown')
  })
})

describe('devOrigins', () => {
  it('lists loopback, the mDNS host, LAN IPv4s and extras without duplicates', () => {
    os.hostname.mockReturnValue('IdeaPad')
    os.networkInterfaces.mockReturnValue({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
      wlan0: [
        { family: 'IPv4', internal: false, address: '192.168.0.10' },
        { family: 'IPv6', internal: false, address: 'fe80::1' },
      ],
      eth0: undefined,
    })
    expect(devOrigins(['dev.example.com', '127.0.0.1'])).toEqual([
      '127.0.0.1',
      'ideapad.local',
      '192.168.0.10',
      'dev.example.com',
    ])
  })

  it('works without extras', () => {
    os.hostname.mockReturnValue('box')
    os.networkInterfaces.mockReturnValue({})
    expect(devOrigins()).toEqual(['127.0.0.1', 'box.local'])
  })
})
