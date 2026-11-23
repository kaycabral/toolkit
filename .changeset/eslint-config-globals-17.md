---
'@cbrl/eslint-config': patch
---

Bump `globals` to `^17.14.0` (browser globals now come from both Chrome and Firefox; AudioWorklet globals such as `registerProcessor` left `globals.browser`) and narrow the `typescript` peer to `>=5.0.0 <6.1`, the range `typescript-eslint` actually supports. TypeScript 6.1+ and 7 were never usable with this config; the peer now says so.
