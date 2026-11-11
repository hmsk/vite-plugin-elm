import { beforeEach, describe, expect, test } from 'vitest'
import { navigationType, useExample } from './example.js'

const example = useExample({ command: 'dev' })

describe('Browser.document', () => {
  beforeEach(async () => {
    await example.goto('/')
  })

  test('seems to be working', async () => {
    const { page } = example
    await page.getByText("I'm compiled Browser.document").waitFor()
    await page.getByLabel('Clickable').click()
    await page.getByText("I'm clicked").waitFor()
  })

  test('has a button for Elm Debugger', async () => {
    await example.page.locator('svg[width="24px"][height="24px"]').waitFor()
  })

  describe('HMR', () => {
    test('performs HMR for editing view', async () => {
      const { page } = example
      await page.getByLabel('Clickable').click()
      await example.amend('src/Hello.elm', 'See Browser.element sample', 'Replaced Message')
      await page.getByText('Replaced Message').waitFor()
      expect(await navigationType(page)).toBe('navigate')
      await page.getByText("I'm clicked").waitFor()
    })

    test('performs HMR for editing imported module', async () => {
      const { page } = example
      await page.getByLabel('Clickable').click()
      await example.amend('src/Message.elm', 'This message is from a dependency!', 'Dependency is updated')
      await page.getByText('Dependency is updated').waitFor()
      expect(await navigationType(page)).toBe('navigate')
      await page.getByText("I'm clicked").waitFor()
    })

    test('does not perform HMR but reload the page when editing initial state', async () => {
      const { page } = example
      await page.getByLabel('Clickable').click()
      await example.amend('src/Hello.elm', 'through vite-plugin-elm', 'via the plugin')
      await page.getByText('via the plugin').waitFor()
      expect(await navigationType(page)).toBe('reload')
      expect(await page.getByText("I'm clicked").count()).toBe(0)
    })

    test('shows a compile error from Elm on the overlay', async () => {
      await example.amend('src/Hello.elm', 'through vite-plugin-elm', 'through vite-plugin-elm" ++ 1 ++ "')
      // Locators reach into the shadow root of the overlay
      const overlay = example.page.locator('vite-error-overlay .window')
      await overlay.waitFor()
      const text = await overlay.textContent()
      expect(text).toContain('-- TYPE MISMATCH')
      expect(text).toContain('src/Hello.elm')
      expect(text).toContain('The (++) operator can append List and String values')
    })
  })
})
