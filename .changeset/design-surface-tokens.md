---
'@cbrl/design': minor
---

Surface tokens: light mode paints the page (`--background`) and `--sidebar` a soft gray (`oklch(0.97 0 0)`) so white cards and popovers stand out; dark `--popover` is lighter than `--card` (`oklch(0.24 0 0)`); new `shadow-popup` elevation token. Visual change for every app: to keep the all-white light page, redefine `--background`/`--sidebar` in the app's `:root`.
