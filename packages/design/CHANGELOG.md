# @cbrl/design

## 0.5.0

### Minor Changes

- [#53](https://github.com/kaycabral/toolkit/pull/53) [`13d50a2`](https://github.com/kaycabral/toolkit/commit/13d50a21b007a0f8359c1eef534761f20de7fbed) Thanks [@kaycabral](https://github.com/kaycabral)! - Tabs: `variant="line"` on `TabsList` (underlined, full-width, scrolls sideways) and `TabsCount` for item counts beside a tab label.

## 0.4.0

### Minor Changes

- [#51](https://github.com/kaycabral/toolkit/pull/51) [`3959e57`](https://github.com/kaycabral/toolkit/commit/3959e57bc94e3313c3e6a04e877d8abcdf1672d6) Thanks [@kaycabral](https://github.com/kaycabral)! - `AppShell` takes `defaultOpen`, `open` and `onOpenChange` (passed to its `SidebarProvider`), so an app can control the sidebar's expanded state — e.g. remember it across reloads in its own storage.

### Patch Changes

- [#51](https://github.com/kaycabral/toolkit/pull/51) [`3959e57`](https://github.com/kaycabral/toolkit/commit/3959e57bc94e3313c3e6a04e877d8abcdf1672d6) Thanks [@kaycabral](https://github.com/kaycabral)! - `Calendar`/`DateField` with `captionLayout="dropdown"`: the month and year selects open again. The arrows' nav bar covered the caption row and swallowed the clicks; now only the arrows take pointer events.

- [#51](https://github.com/kaycabral/toolkit/pull/51) [`3959e57`](https://github.com/kaycabral/toolkit/commit/3959e57bc94e3313c3e6a04e877d8abcdf1672d6) Thanks [@kaycabral](https://github.com/kaycabral)! - `List`: rows with `onClick` (rendered as a `<button>`) now span the whole row and align left, like link and static rows; before they were content-sized and centered.

## 0.3.0

### Minor Changes

- [#36](https://github.com/kaycabral/toolkit/pull/36) [`8a45455`](https://github.com/kaycabral/toolkit/commit/8a45455bb4c0e66bdc3575217bd5089bd6de45e3) Thanks [@kaycabral](https://github.com/kaycabral)! - Move `Calendar` (and `DateField`, which composes it) to react-day-picker 10. `Calendar` forwards react-day-picker's props, so the APIs v10 removed are gone from it too: `fromMonth`/`fromYear`/`fromDate` and `toMonth`/`toYear`/`toDate` (use `startMonth`/`endMonth`, or `hidden={{ before, after }}`), `initialFocus` (use `autoFocus`), the `onDayKey*`/`onDayPointer*`/`onDayTouch*`/`onWeekNumberClick` handlers (use a custom `DayButton`/`WeekNumber`), the deprecated `classNames`/`styles` keys (`table`, `cell`, `caption`, ...), `components.Button` and the `formatMonthCaption`/`formatYearCaption`/`labelDay`/`labelCaption` aliases. The month grid now actually receives the `w-full border-collapse` classes (v9 silently dropped the deprecated `table` key); the rendered look is unchanged. Also bumps `lucide-react` to `^1.75.0`.

## 0.2.0

### Minor Changes

- [#19](https://github.com/kaycabral/toolkit/pull/19) [`9b7fcb3`](https://github.com/kaycabral/toolkit/commit/9b7fcb3aaa17ad47a17d75151feaf9c331d355a3) Thanks [@kaycabral](https://github.com/kaycabral)! - Add `ThemeProvider` (client wrapper over `next-themes`), the `WhatsappIcon` and `GoogleIcon` brand icons (decorative by default, accessible with `title`), and the `initials(primary, fallback?)` avatar helper. `UserMenu` now derives its fallback with `initials`, so a single word yields its first two characters (`'Ada'` → `'AD'`) and an email no longer splits on `@`/`.`; `userMenuInitials` is deprecated in favor of `initials`. The package's own tests now use `installJsdomPolyfills()` from `@cbrl/testing`.
