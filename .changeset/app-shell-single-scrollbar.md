---
'@cbrl/design': patch
---

Drop the always-on `html` scrollbar when the app shell is mounted: the shell scrolls inside `app-scroll`, so the forced document scrollbar showed up as a dead second bar.
