import { beforeEach, describe, expect, test } from 'vitest'
import { navigationType, useExample } from './example.js'

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
