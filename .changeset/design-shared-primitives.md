---
'@cbrl/design': minor
---

Add `ThemeProvider` (client wrapper over `next-themes`), the `WhatsappIcon` and `GoogleIcon` brand icons (decorative by default, accessible with `title`), and the `initials(primary, fallback?)` avatar helper. `UserMenu` now derives its fallback with `initials`, so a single word yields its first two characters (`'Ada'` → `'AD'`) and an email no longer splits on `@`/`.`; `userMenuInitials` is deprecated in favor of `initials`. The package's own tests now use `installJsdomPolyfills()` from `@cbrl/testing`.
