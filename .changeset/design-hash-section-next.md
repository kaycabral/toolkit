---
'@cbrl/design': patch
---

`useHashSection` keeps `history.state` and re-states fragment-only navigations so the Next.js App Router no longer strips the hash and closes the section. `StatusDot` gets lighter dark-mode tones (success/warning/info). `AvatarGroup`'s default "+K" accessible name is now language-neutral (`"+K"` instead of `"K more"`).
