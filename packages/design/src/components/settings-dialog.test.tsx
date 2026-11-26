import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useHashSection } from '../hooks/use-hash-section'
import { SettingsDialog, type SettingsDialogSection } from './settings-dialog'

type Key = 'profile' | 'billing'

function Icon({ className }: { className?: string }) {
  return <svg className={className} />
}

const SECTIONS: readonly SettingsDialogSection<Key>[] = [
  { key: 'profile', label: 'Profile', description: 'Your name and photo.', icon: Icon },
  { key: 'billing', label: 'Billing' },
]

describe('SettingsDialog', () => {
  it('opens on the first section by default and switches sections (uncontrolled)', async () => {
    const onValueChange = vi.fn()
    render(
      <SettingsDialog defaultOpen sections={SECTIONS} onValueChange={onValueChange}>
        body
      </SettingsDialog>,
    )
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByText('Your name and photo.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Profile' })).toHaveAttribute('aria-current', 'page')

    await userEvent.click(screen.getByRole('button', { name: 'Billing' }))
    expect(onValueChange).toHaveBeenCalledWith('billing')
    expect(screen.getByRole('heading', { name: 'Billing' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Billing' })).toHaveAttribute('aria-current', 'page')
  })

  it('follows the controlled value and custom title', () => {
    render(
      <SettingsDialog open sections={SECTIONS} value="billing" title="Settings" navLabel="Sections">
        body
      </SettingsDialog>,
    )
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Billing' })).toHaveAttribute('aria-current', 'page')
  })

  it('reports close through onOpenChange', async () => {
    const onOpenChange = vi.fn()
    render(<SettingsDialog open onOpenChange={onOpenChange} sections={SECTIONS} />)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('has no a11y violations', async () => {
    render(
      <SettingsDialog defaultOpen sections={SECTIONS}>
        <p>content</p>
      </SettingsDialog>,
    )
    await expectNoA11yViolations(document.body)
  })
})

describe('useHashSection', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('reads the section from the hash and ignores unknown keys', () => {
    window.history.replaceState(null, '', '/page?x=1#settings/billing')
    const { result } = renderHook(() => useHashSection<Key>('settings', ['profile', 'billing']))
    expect(result.current.section).toBe('billing')

    act(() => {
      window.location.hash = '#settings/nope'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(result.current.section).toBeNull()

    act(() => {
      window.location.hash = '#settings/'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(result.current.section).toBeNull()

    act(() => {
      window.location.hash = '#other/profile'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(result.current.section).toBeNull()
  })

  it('open rewrites the hash and close clears it keeping path and query', () => {
    window.history.replaceState(null, '', '/page?x=1')
    const { result } = renderHook(() => useHashSection('settings'))
    expect(result.current.section).toBeNull()

    act(() => result.current.open('profile'))
    expect(result.current.section).toBe('profile')
    expect(window.location.hash).toBe('#settings/profile')

    act(() => result.current.close())
    expect(result.current.section).toBeNull()
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      '/page?x=1',
    )
  })

  it('drives a SettingsDialog end to end', async () => {
    window.history.replaceState(null, '', '/#settings/billing')
    function App() {
      const { section, open, close } = useHashSection<Key>('settings', ['profile', 'billing'])
      return (
        <SettingsDialog
          open={section !== null}
          onOpenChange={(o) => (o ? undefined : close())}
          sections={SECTIONS}
          value={section ?? 'profile'}
          onValueChange={open}
        />
      )
    }
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Billing' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Profile' }))
    expect(window.location.hash).toBe('#settings/profile')
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(window.location.hash).toBe('')
    expect(React.isValidElement(<App />)).toBe(true)
  })
})
