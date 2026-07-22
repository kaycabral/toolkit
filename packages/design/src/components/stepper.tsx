'use client'

import { CheckIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '../lib/cn'

type StepState = 'done' | 'active' | 'todo'

type StepperProps = React.ComponentProps<'nav'> & {
  steps: readonly string[]
  activeIndex: number
  onStepSelect?: (index: number) => void
}

function stepState(index: number, activeIndex: number): StepState {
  if (index < activeIndex) return 'done'
  if (index === activeIndex) return 'active'
  return 'todo'
}

function Stepper({ steps, activeIndex, onStepSelect, className, ...props }: StepperProps) {
  return (
    <nav
      data-slot="stepper"
      aria-label={`Passo ${activeIndex + 1} de ${steps.length}`}
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      <p data-slot="stepper-counter" className="text-muted-foreground text-xs font-medium">
        Passo {activeIndex + 1} de {steps.length}
      </p>
      <ol className="flex items-start gap-2">
        {steps.map((label, index) => {
          const state = stepState(index, activeIndex)
          const clickable = state === 'done' && onStepSelect !== undefined
          return (
            <li key={label} className="min-w-0 flex-1">
              <button
                type="button"
                data-slot="stepper-step"
                data-state={state}
                aria-current={state === 'active' ? 'step' : undefined}
                disabled={!clickable && state !== 'active'}
                onClick={clickable ? () => onStepSelect(index) : undefined}
                className={cn(
                  'group flex w-full flex-col gap-1.5 outline-none',
                  clickable ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'h-1 w-full rounded-full transition-colors',
                    state === 'todo' ? 'bg-muted' : 'bg-primary',
                    state === 'active' && 'bg-primary/70',
                    clickable && 'group-focus-visible:ring-ring/50 group-focus-visible:ring-3',
                  )}
                />
                <span
                  className={cn(
                    'flex items-center gap-1 truncate text-xs',
                    state === 'active' && 'text-foreground font-medium',
                    state === 'done' && 'text-muted-foreground group-hover:text-foreground',
                    state === 'todo' && 'text-muted-foreground/60',
                  )}
                >
                  {state === 'done' ? <CheckIcon aria-hidden className="size-3 shrink-0" /> : null}
                  <span className="truncate">{label}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export { Stepper }
