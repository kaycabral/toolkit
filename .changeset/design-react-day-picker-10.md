---
'@cbrl/design': minor
---

Move `Calendar` (and `DateField`, which composes it) to react-day-picker 10. `Calendar` forwards react-day-picker's props, so the APIs v10 removed are gone from it too: `fromMonth`/`fromYear`/`fromDate` and `toMonth`/`toYear`/`toDate` (use `startMonth`/`endMonth`, or `hidden={{ before, after }}`), `initialFocus` (use `autoFocus`), the `onDayKey*`/`onDayPointer*`/`onDayTouch*`/`onWeekNumberClick` handlers (use a custom `DayButton`/`WeekNumber`), the deprecated `classNames`/`styles` keys (`table`, `cell`, `caption`, ...), `components.Button` and the `formatMonthCaption`/`formatYearCaption`/`labelDay`/`labelCaption` aliases. The month grid now actually receives the `w-full border-collapse` classes (v9 silently dropped the deprecated `table` key); the rendered look is unchanged. Also bumps `lucide-react` to `^1.75.0`.
