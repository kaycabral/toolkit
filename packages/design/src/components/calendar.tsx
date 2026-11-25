'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type DropdownProps,
} from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'

import { cn } from '../lib/cn'
import { Button, buttonVariants } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger } from './select'

// Calendar primitive — the canonical shadcn react-day-picker component, on
// react-day-picker v10 and adapted to our import paths and pinned to pt-BR. Exposed on its own so
// consumers can build bespoke date surfaces; `DateField` composes it.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn(
        'group/calendar bg-background p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString('pt-BR', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        // The nav spans the caption row over the month/year selects; only its
        // arrows take clicks, so the selects (captionLayout="dropdown") open.
        nav: cn(
          'pointer-events-none absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'pointer-events-auto size-(--cell-size) p-0 select-none aria-disabled:opacity-50',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'pointer-events-auto size-(--cell-size) p-0 select-none aria-disabled:opacity-50',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn('relative', defaultClassNames.dropdown_root),
        dropdown: defaultClassNames.dropdown,
        caption_label: cn(
          'font-medium select-none',
          captionLayout === 'label'
            ? 'text-sm'
            : '[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        // v9 accepted (and silently ignored) shadcn's deprecated `table` key; v10
        // only takes the UI keys, and the <table> is `month_grid`.
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground flex-1 rounded-md text-[0.8rem] font-normal select-none',
          defaultClassNames.weekday,
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn('w-(--cell-size) select-none', defaultClassNames.week_number_header),
        week_number: cn(
          'text-muted-foreground text-[0.8rem] select-none',
          defaultClassNames.week_number,
        ),
        day: cn(
          'group/day relative aspect-square h-full w-full p-0 text-center select-none [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md',
          defaultClassNames.day,
        ),
        range_start: cn('bg-accent rounded-l-md', defaultClassNames.range_start),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('bg-accent rounded-r-md', defaultClassNames.range_end),
        today: cn(
          'bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none',
          defaultClassNames.today,
        ),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside,
        ),
        disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
        ),
        // Only the nav prev/next chevrons remain — the month/year dropdowns use
        // our `Select` (with its own chevron), so no `down` orientation here.
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) =>
          orientation === 'left' ? (
            <ChevronLeftIcon className={cn('size-4', chevronClassName)} {...chevronProps} />
          ) : (
            <ChevronRightIcon className={cn('size-4', chevronClassName)} {...chevronProps} />
          ),
        Dropdown: CalendarDropdown,
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekNumberProps }) => (
          <td {...weekNumberProps}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

// Month/year navigation dropdown built on OUR `Select` primitive instead of the
// native `<select>` react-day-picker ships by default. A visually-hidden native
// `<select>` keeps react-day-picker's `onChange` wired (it gets a real
// ChangeEvent — no synthetic-event cast); our `Select` is the visible control,
// driving the hidden one via the native value setter.
// The subset of react-day-picker's DropdownProps we actually consume, so the
// component is directly testable and stays assignable to the `Dropdown` slot.
type CalendarDropdownProps = Pick<
  DropdownProps,
  'options' | 'value' | 'onChange' | 'disabled' | 'aria-label'
>

function CalendarDropdown({
  options = [],
  value,
  onChange,
  disabled,
  ...props
}: CalendarDropdownProps) {
  const nativeRef = React.useRef<HTMLSelectElement>(null)
  const selectedValue = value != null ? String(value) : undefined
  const current = options.find((option) => String(option.value) === selectedValue)
  const ariaLabel = props['aria-label']

  function handleValueChange(next: string) {
    const node = nativeRef.current
    // Set via the native value setter so React registers the change, then fire a
    // real change event for react-day-picker's handler.
    const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')
    if (node && descriptor?.set) {
      descriptor.set.call(node, next)
      node.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  return (
    <>
      <select
        ref={nativeRef}
        value={selectedValue}
        onChange={onChange}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <Select value={selectedValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger size="sm" aria-label={ariaLabel} className="w-auto gap-1">
          {current?.label}
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

export { Calendar, CalendarDayButton, CalendarDropdown }
