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
      // The new initial state shows up before the page reloads too
      const reloaded = page.waitForEvent('load')
      await example.amend('src/Hello.elm', 'through vite-plugin-elm', 'via the plugin')
      await reloaded
      await page.getByText('via the plugin').waitFor()
      expect(await navigationType(page)).toBe('reload')
      expect(await page.getByText("I'm clicked").count()).toBe(0)
    })

    test('compiles again when elm.json changes, like by `elm install`', async () => {
      const { page } = example
      await page.getByLabel('Clickable').click()
      // elm/json is only an indirect dependency, so Elm doesn't let Hello.elm import it
      await example.amend('src/Hello.elm', 'import Message', 'import Json.Encode\nimport Message')
      await example.amend(
        'src/Hello.elm',
        'text "This page works with Browser.document"',
        'text (Json.Encode.encode 0 (Json.Encode.string "Encoded with elm/json"))',
      )
      const overlay = page.locator('vite-error-overlay .window')
      await overlay.waitFor()
      expect(await overlay.textContent()).toContain('elm/json')

      await example.amend(
        'elm.json',
        '"hmsk/elm-vite-plugin-helper": "1.0.1"\n        },\n        "indirect": {\n            "elm/json": "1.1.3",',
        '"hmsk/elm-vite-plugin-helper": "1.0.1",\n            "elm/json": "1.1.3"\n        },\n        "indirect": {',
      )
      await page.getByText('"Encoded with elm/json"').waitFor()
      expect(await navigationType(page)).toBe('navigate')
      await page.getByText("I'm clicked").waitFor()
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
