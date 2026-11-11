import { beforeEach, describe, expect, test } from 'vitest'
import { useExample } from './example.js'

describe.each<{ name: string; env: Record<string, string> }>([
  { name: 'vite build', env: {} },
  // The example's vite.config.ts runs elm-optimize-level-2 through `postprocess`
  { name: 'vite build with elm-optimize-level-2', env: { EOL2: 'true' } },
])('$name', ({ env }) => {
  const example = useExample({ command: 'preview', env })

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

    test('does not have a button for Elm Debugger', async () => {
      const { page } = example
      await page.getByText("I'm compiled Browser.document").waitFor()
      expect(await page.locator('svg[width="24px"][height="24px"]').count()).toBe(0)
    })
  })

  describe('Browser.application', () => {
    beforeEach(async () => {
      await example.goto('/application')
    })

    test('seems to be working', async () => {
      await example.page.getByText('Your Elm App is working!').waitFor()
    })

    describe('assets', () => {
      test('renders an asset with asset tag', async () => {
        const image = example.page.getByAltText('without option')
        await image.waitFor()
        expect(await image.getAttribute('src')).toMatch(/^\/assets\/logo-.+\.jpg$/)
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
    })
  })

  describe('multiple Browser.element', () => {
    test('seems to be working', async () => {
      const { page } = example
      await example.goto('/elements')
      await page.getByText('Browser.element sample with combined importing').waitFor()
      await page.getByText('This message is rendered by Description').waitFor()
      await page.getByText('In the next major version;').waitFor()
    })
  })

  describe('Platform.worker', () => {
    test('seems to be working', async () => {
      const { page } = example
      await example.goto('/worker')
      await page.getByText('Pong from Elm worker to the main thread').waitFor()
      await page.getByText('Pong from Elm worker to a Web Worker').waitFor()
      await page.getByText('Browser.element bundled with Platform.worker').waitFor()
    })
  })

  describe('raw loading', () => {
    test('importing with ?raw is not blocked by the plugin', async () => {
      await example.goto('/raw')
      const meta = example.page.locator('head meta[name="elm:plugin"]')
      await expect.poll(() => meta.getAttribute('content')).toBe('module Raw exposing (main)')
    })
  })
})
