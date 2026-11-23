// @vitest-environment jsdom
/// <reference lib="dom" />
import { afterEach, describe, expect, it } from 'vitest'

import { expectNoA11yViolations } from './a11y'

function mount(html: string): Element {
  const el = document.createElement('div')
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('expectNoA11yViolations', () => {
  it('resolves for accessible markup', async () => {
    await expectNoA11yViolations(mount('<button type="button">Salvar</button>'))
  })

  it('rejects when axe finds a violation (img without alt)', async () => {
    await expect(expectNoA11yViolations(mount('<img src="x.png">'))).rejects.toThrow(/image-alt/)
  })
})
