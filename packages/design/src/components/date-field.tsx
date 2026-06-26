'use client'

import { CalendarDays } from 'lucide-react'
import * as React from 'react'

import { cn } from '../lib/cn'
import { brDateToIso, dateToIso, isoToBrDate, isoToDate, maskBrDate } from '../lib/date'
import { Button } from './button'
import { Calendar } from './calendar'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

// Flexible pt-BR date field for the whole monorepo. ALWAYS displays `dd/mm/aaaa`
// and emits/stores ISO `yyyy-mm-dd` — independent of the browser locale (unlike
// a native `<input type="date">`). The consumer chooses the affordances:
//   • presentation="input" + calendar (default) → type OR pick from the calendar
//   • presentation="input" calendar={false}     → type only
//   • presentation="button"                      → icon/label button, calendar only
// For `<form action>` submission it renders a hidden input carrying the ISO value
// under `name`, while the visible field shows the Brazilian format.
export type DateFieldProps = {
  /** Submitted form field name — a hidden input carries the ISO value. */
  name?: string
  /** Controlled ISO value (`yyyy-mm-dd`). */
  value?: string
  /** Uncontrolled initial ISO value (`yyyy-mm-dd`). */
  defaultValue?: string
  /** Called with the ISO value (`''` while incomplete/invalid). */
  onValueChange?: (iso: string) => void
  /** Show the calendar popover affordance. Defaults to `true`. Ignored (always
   * on) when `presentation="button"`. */
  calendar?: boolean
  /** `input` = masked text field; `button` = icon/label trigger only. */
  presentation?: 'input' | 'button'
  /** Calendar caption: `label` (arrows, default) or a `dropdown*` variant with
   * month/year selects — ideal for far-past dates like birthdays. The year range
   * derives from `min`/`max` (falling back to the last 100 years). */
  captionLayout?: React.ComponentProps<typeof Calendar>['captionLayout']
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  /** ISO lower/upper bounds for the calendar. */
  min?: string
  max?: string
  className?: string
  'aria-label'?: string
}

export function DateField({
  name,
  value,
  defaultValue,
  onValueChange,
  calendar = true,
  presentation = 'input',
  captionLayout,
  placeholder = 'dd/mm/aaaa',
  disabled,
  required,
  id,
  min,
  max,
  className,
  'aria-label': ariaLabel,
}: DateFieldProps) {
  const isControlled = value !== undefined
  const [text, setText] = React.useState(() => isoToBrDate(value ?? defaultValue ?? ''))
  const [focused, setFocused] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  // Reflect external (controlled) changes — but never while the user is typing,
  // so a partial entry isn't clobbered by a round-trip through ISO.
  React.useEffect(() => {
    if (isControlled && !focused) setText(isoToBrDate(value ?? ''))
  }, [value, isControlled, focused])

  const iso = brDateToIso(text)

  function commit(nextText: string) {
    setText(nextText)
    onValueChange?.(brDateToIso(nextText))
  }

  function pick(nextIso: string) {
    commit(isoToBrDate(nextIso))
    setOpen(false)
  }

  const showCalendar = calendar || presentation === 'button'
  const calendarBody = (
    <DateCalendar iso={iso} min={min} max={max} captionLayout={captionLayout} onPick={pick} />
  )

  return (
    <div className={cn('relative', presentation === 'input' && 'w-full', className)}>
      {name ? <input type="hidden" name={name} value={iso} /> : null}

      {presentation === 'button' ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              id={id}
              disabled={disabled}
              aria-label={ariaLabel}
              className={cn('justify-start gap-2 font-normal', !iso && 'text-muted-foreground')}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              {iso ? isoToBrDate(iso) : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {calendarBody}
          </PopoverContent>
        </Popover>
      ) : (
        <>
          <Input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            value={text}
            disabled={disabled}
            required={required}
            aria-label={ariaLabel}
            pattern="\d{2}/\d{2}/\d{4}"
            className={cn(showCalendar && 'pr-9')}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => commit(maskBrDate(e.target.value))}
          />
          {showCalendar ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  aria-label="Abrir calendário"
                  className="text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2"
                >
                  <CalendarDays className="size-4" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                {calendarBody}
              </PopoverContent>
            </Popover>
          ) : null}
        </>
      )}
    </div>
  )
}

// The calendar body shared by both presentations. Owns the bounds + dropdown
// year-range derivation so `DateField` stays lean.
function DateCalendar({
  iso,
  min,
  max,
  captionLayout,
  onPick,
}: {
  iso: string
  min?: string
  max?: string
  captionLayout: DateFieldProps['captionLayout']
  onPick: (iso: string) => void
}) {
  const minDate = min ? isoToDate(min) : undefined
  const maxDate = max ? isoToDate(max) : undefined
  const disabled = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ]

  // Dropdown caption needs a year range to populate its select. Derive it from
  // the bounds, falling back to the last 100 years (covers any birthday).
  const isDropdown = captionLayout != null && captionLayout !== 'label'
  const endBound = maxDate ?? new Date()
  const startBound = minDate ?? new Date(endBound.getFullYear() - 100, 0, 1)

  return (
    <Calendar
      mode="single"
      captionLayout={captionLayout}
      startMonth={isDropdown ? startBound : undefined}
      endMonth={isDropdown ? endBound : undefined}
      selected={isoToDate(iso)}
      defaultMonth={isoToDate(iso)}
      disabled={disabled.length > 0 ? disabled : undefined}
      onSelect={(date) => {
        if (date) onPick(dateToIso(date))
      }}
    />
  )
}
