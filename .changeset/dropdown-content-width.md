---
'@cbrl/design': patch
---

`DropdownMenuContent` no longer locks its width to the trigger's: it is at least as wide as the trigger (and 8rem) and grows to fit its items within the viewport, so menus opened from an icon button stop wrapping their labels.
