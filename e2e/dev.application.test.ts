import { beforeEach, describe, expect, test } from 'vitest'
import { useExample } from './example.js'

const example = useExample({ command: 'dev' })

describe('Browser.application', () => {
  beforeEach(async () => {
    await example.goto('/application.html')
  })

  test('seems to be working', async () => {
    await example.page.getByText('Your Elm App is working!').waitFor()
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
