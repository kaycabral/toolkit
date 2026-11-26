---
'@cbrl/design': minor
---

Tabs: `TabsList` never hides the active tab (horizontal scroll without scrollbar, edge fade masks only where tabs are hidden, active tab revealed on mount/resize/change; reduced motion is instant). On by default for both variants, opt out with `scrollable={false}`. New hooks `useScrollStrip` and `useElementSize`.
