---
'@cbrl/design': patch
---

Restore visible sidebar hover: light `--background` and `--sidebar` go to `oklch(0.985 0 0)`, a step lighter than `--accent`/`--sidebar-accent` (`0.97`), which they had matched since 0.6.0. Cards and popovers stay white.
