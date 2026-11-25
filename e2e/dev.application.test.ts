import type { Page } from 'playwright'
import { beforeEach, describe, expect, test } from 'vitest'
import { navigationType, useExample } from './example.js'

// Browser.application listens to popstate on window to tell the app that the URL has changed
const popstateListeners = async (page: Page) => {
  const cdp = await page.context().newCDPSession(page)
  const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' })
  const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId! })
  await cdp.detach()
  return listeners.filter(({ type }) => type === 'popstate').length
}

const example = useExample({ command: 'dev' })

describe('Browser.application', () => {
  beforeEach(async () => {
    await example.goto('/application.html')
  })

  test('seems to be working', async () => {
    await example.page.getByText('Your Elm App is working!').waitFor()
  })

  describe('HMR', () => {
    test('performs HMR for editing view', async () => {
      const { page } = example
      await page.getByLabel('Count').click()
      await page.getByText('Clicked 1 times').waitFor()
      await example.amend('src/Application.elm', 'navigate within the app', 'Replaced Message')
      await page.getByText('Replaced Message').waitFor()
      expect(await navigationType(page)).toBe('navigate')
      await page.getByText('Clicked 1 times').waitFor()
    })

    test('performs HMR for editing view after navigating within the app', async () => {
      const { page } = example
      await page.getByLabel('Count').click()
      await page.getByText('Move').click()
      await page.getByText('Fragment: moved').waitFor()
      await example.amend('src/Application.elm', 'navigate within the app', 'Replaced Message')
      await page.getByText('Replaced Message').waitFor()
      expect(await navigationType(page)).toBe('navigate')
      await page.getByText('Clicked 1 times').waitFor()
    })

    test('keeps handling URL changes after HMR', async () => {
      const { page } = example
      await example.amend('src/Application.elm', 'navigate within the app', 'Replaced Message')
      await page.getByText('Replaced Message').waitFor()
      await page.getByText('Move').click()
      await page.getByText('Fragment: moved').waitFor()
      // Rendering the swapped app again shows what its model has, not what the old app left on the page
      await page.getByLabel('Count').click()
      await page.getByText('Clicked 1 times').waitFor()
      expect(await page.getByText('Fragment: moved').count()).toBe(1)
      await page.goBack()
      await page.getByText('Fragment: none').waitFor()
      await page.getByLabel('Count').click()
      await page.getByText('Clicked 2 times').waitFor()
      expect(await page.getByText('Fragment: none').count()).toBe(1)
    })

    test('reloads the page when the swapped view fails with the kept state', async () => {
      const { page } = example
      await page.getByLabel('Count').click()
      await page.getByText('Clicked 1 times').waitFor()
      // Fails only with the state from before HMR, as init gives 0
      const reloaded = page.waitForEvent('load')
      await example.amend(
        'src/Application.elm',
        'text ("Clicked " ++ String.fromInt model.clicks ++ " times")',
        'text (if model.clicks == 1 then Debug.todo "view fails" else "Clicked " ++ String.fromInt model.clicks ++ " times")',
      )
      await reloaded
      await page.getByText('Clicked 0 times').waitFor()
      expect(await navigationType(page)).toBe('reload')
    })

    test('reloads the page when init gives another command', async () => {
      const { page } = example
      await page.getByLabel('Count').click()
      await page.getByText('Clicked 1 times').waitFor()
      const reloaded = page.waitForEvent('load')
      await example.amend(
        'src/Application.elm',
        '( { key = key, url = url, clicks = 0 }, Cmd.none )',
        '( { key = key, url = url, clicks = 0 }, Nav.replaceUrl key "?from-init" )',
      )
      await reloaded
      await page.waitForURL(/\?from-init$/)
      expect(await navigationType(page)).toBe('reload')
      await page.getByText('Clicked 0 times').waitFor()
    })

    test('leaves only the swapped app listening to URL changes, even without the key in its model', async () => {
      const { page } = example
      // Drop the key from the model, and the page reloads as init gives another state
      const reloaded = page.waitForEvent('load')
      await example.amend('src/Application.elm', [
        ['( model, Nav.pushUrl model.key (Url.toString url) )', '( model, Cmd.none )'],
        ['{ key : Nav.Key\n    , url : Url', '{ url : Url'],
        ['{ key = key, url = url, clicks = 0 }', '{ url = url, clicks = 0 }'],
      ])
      await reloaded
      await page.getByText('Fragment: none').waitFor()
      expect(await popstateListeners(page)).toBe(1)

      await example.amend('src/Application.elm', 'navigate within the app', 'Replaced Message')
      await page.getByText('Replaced Message').waitFor()
      expect(await navigationType(page)).toBe('reload')
      expect(await popstateListeners(page)).toBe(1)
    })

    test('keeps the app working while a compile error is shown, then performs HMR for the fix', async () => {
      const { page } = example
      await page.getByLabel('Count').click()
      await example.amend('src/Application.elm', '"navigate within the app"', '"navigate within the app" ++ 1')
      await page.locator('vite-error-overlay .window').waitFor()
      await page.keyboard.press('Escape')
      await page.getByText('Move').click()
      await page.getByText('Fragment: moved').waitFor()
      await example.amend('src/Application.elm', '"navigate within the app" ++ 1', '"Fixed Message"')
      await page.getByText('Fixed Message').waitFor()
      expect(await navigationType(page)).toBe('navigate')
      await page.getByText('Clicked 1 times').waitFor()
      expect(await page.getByText('Fragment: moved').count()).toBe(1)
    })
  })

  describe('assets', () => {
    test('renders an asset with asset tag', async () => {
      const image = example.page.getByAltText('without option')
      await image.waitFor()
      expect(await image.getAttribute('src')).toBe('/assets/logo.jpg')
    })

    test('renders an asset with inline option', async () => {
      const image = example.page.getByAltText('with inline option')
      await image.waitFor()
      expect(await image.getAttribute('src')).toMatch(/^data:image\/png;base64,/)
    })

    test('renders an asset with vite-plugin-helper', async () => {
      const image = example.page.getByAltText('with vite-plugin-helper')
      await image.waitFor()
      expect(await image.getAttribute('src')).toMatch(/^data:image\/png;base64,/)
    })

    test('shows how to call VitePluginHelper.asset on the overlay when it is given a non-literal', async () => {
      await example.amend(
        'src/Application.elm',
        'asset "/assets/logo.png?inline"',
        'asset ("/assets/" ++ "logo.png?inline")',
      )
      const overlay = example.page.locator('vite-error-overlay .window')
      await overlay.waitFor()
      expect(await overlay.textContent()).toContain('VitePluginHelper.asset takes only a string literal')
    })
  })
})
