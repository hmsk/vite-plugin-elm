import { beforeEach, describe, expect, test } from 'vitest'
import { navigationType, useExample } from './example.js'

const example = useExample({ command: 'dev' })

describe('Platform.worker', () => {
  beforeEach(async () => {
    await example.goto('/worker.html')
  })

  test('seems to be working', async () => {
    const { page } = example
    await page.getByText('Pong from Elm worker to the main thread').waitFor()
    await page.getByText('Pong from Elm worker to a Web Worker').waitFor()
    await page.getByText('Browser.element bundled with Platform.worker').waitFor()
  })

  describe('HMR', () => {
    test('performs HMR for editing a worker without touching the page', async () => {
      const { page } = example
      await page.getByText('Pong from Elm worker to the main thread').waitFor()
      await example.amend('src/Worker.elm', 'Pong from Elm worker', 'Pong from updated Elm worker')
      await page.getByText('Pong from updated Elm worker to the main thread').waitFor()
      expect(await navigationType(page)).toBe('navigate')
      await page.locator('h1', { hasText: 'Platform.worker sample' }).waitFor()
      await page.getByText('Browser.element bundled with Platform.worker').waitFor()
    })

    test('performs HMR for editing an element bundled with a worker', async () => {
      const { page } = example
      await page.getByText('Browser.element bundled with Platform.worker').waitFor()
      await example.amend('src/WorkerCompanion.elm', 'bundled with', 'combined with')
      await page.getByText('Browser.element combined with Platform.worker').waitFor()
      expect(await navigationType(page)).toBe('navigate')
      await page.locator('h1', { hasText: 'Platform.worker sample' }).waitFor()
      await page.getByText('Pong from Elm worker to the main thread').waitFor()
    })
  })
})
