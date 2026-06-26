// Next.js framework adjustments shared by every Next app on this base.
//
// Statically-typed routes (`typedRoutes`) brand `Route`. A route built from a
// dynamic string can't be statically inferred AND has no runtime shape to
// validate against (any string is a syntactically valid path), so `as Route` is
// irreducible — it is Next's own documented pattern. The convention is to confine
// it to a single `toRoute` seam at `src/shared/routes.ts`; this turns off the two
// assertion rules for THAT FILE ONLY (every other file stays strict).
//
// Both rules are disabled because the cast reads differently depending on whether
// `.next/types` has been generated when ESLint runs:
//   - with generated route types  → `Route` is branded → `no-unsafe-type-assertion`
//   - without them (bare `eslint`) → `Route` ≈ `string` → `no-unnecessary-type-assertion`
// Disabling both keeps the seam green in both modes (CI runs `next typegen` first
// via the package `lint` script; a bare `eslint .` does not).
export const next = [
  {
    files: ['**/src/shared/routes.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },
]
