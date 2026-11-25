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

    test('reloads the page when a port is added, which JavaScript has not had a chance to use', async () => {
      const { page } = example
      await page.getByText('Pong from Elm worker to the main thread').waitFor()
      const reloaded = page.waitForEvent('load')
      // Elm drops a port that no code uses, so add one with its use
      await example.amend(
        'src/Worker.elm',
        '( model, pong ("Pong from Elm worker to " ++ from) )',
        '( model, Cmd.batch [ pong ("Pong from Elm worker to " ++ from), pongAgain from ] )\n\n\nport pongAgain : String -> Cmd msg',
      )
      await reloaded
      expect(await navigationType(page)).toBe('reload')
      await page.getByText('Pong from Elm worker to the main thread').waitFor()
    })

    test('reloads the page when the kind of program changes', async () => {
      const { page } = example
      await page.getByText('Browser.element bundled with Platform.worker').waitFor()
      const reloaded = page.waitForEvent('load')
      await example.amend(
        'src/WorkerCompanion.elm',
        'Browser.element\n        { init = \\_ -> ( (), Cmd.none )\n        , update = \\_ model -> ( model, Cmd.none )\n        , view = \\_ -> p [] [ text "Browser.element bundled with Platform.worker" ]',
        'Browser.document\n        { init = \\_ -> ( (), Cmd.none )\n        , update = \\_ model -> ( model, Cmd.none )\n        , view = \\_ -> { title = "Companion", body = [ p [] [ text "Browser.document bundled with Platform.worker" ] ] }',
      )
      await reloaded
      expect(await navigationType(page)).toBe('reload')
      await page.getByText('Browser.document bundled with Platform.worker').waitFor()
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
