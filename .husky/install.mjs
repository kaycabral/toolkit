// Husky is a dev-only tool. Skip in any environment where it does not belong:
// - production / CI envs that explicitly opt out (NODE_ENV, CI, VERCEL)
// - environments where husky was not installed at all (e.g. a production-only
//   install that omits devDependencies)
if (process.env.NODE_ENV === 'production' || process.env.CI || process.env.VERCEL) {
  process.exit(0)
}
let husky
try {
  husky = (await import('husky')).default
} catch {
  // husky not installed — nothing to set up.
  process.exit(0)
}
console.log(husky())
