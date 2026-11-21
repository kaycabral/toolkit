import { execFileSync } from 'node:child_process'
import { hostname, networkInterfaces } from 'node:os'

/**
 * The commit being built, for `env.NEXT_PUBLIC_COMMIT_SHA` in `next.config.ts`.
 * Resolution order: `NEXT_PUBLIC_COMMIT_SHA`, `VERCEL_GIT_COMMIT_SHA`,
 * `git rev-parse HEAD`, then the literal `'unknown'` so builds without a
 * readable `.git` do not crash.
 */
export function commitSha(): string {
  const fromEnv = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA
  if (fromEnv) return fromEnv
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

/**
 * Hostnames for `allowedDevOrigins`: `127.0.0.1` (Playwright), this machine's
 * mDNS name (`<hostname>.local`, lowercased because origin matching is
 * case-sensitive), every non-internal LAN IPv4 (resolved at startup, so DHCP
 * changes do not break phone testing) and `extra`. Next.js dev blocks
 * cross-origin `/_next/*` requests from unlisted hosts, which silently stalls
 * hydration.
 */
export function devOrigins(extra: readonly string[] = []): string[] {
  const lan = Object.values(networkInterfaces())
    .flatMap((infos = []) => infos)
    .flatMap((info) => (info.family === 'IPv4' && !info.internal ? [info.address] : []))
  return [...new Set(['127.0.0.1', `${hostname().toLowerCase()}.local`, ...lan, ...extra])]
}
