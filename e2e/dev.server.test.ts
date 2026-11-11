import { describe, expect, test } from 'vitest'
import { useExample, writeElmOutsideRoot } from './example.js'

const example = useExample({ command: 'dev' })

describe('raw loading', () => {
  test('importing with ?raw is not blocked by the plugin', async () => {
    await example.goto('/raw.html')
    const meta = example.page.locator('head meta[name="elm:plugin"]')
    await expect.poll(() => meta.getAttribute('content')).toBe('module Raw exposing (main)')
  })
})

describe('server.fs.allow', () => {
  test('does not compile an Elm file outside of the allow list', async () => {
    const outside = await writeElmOutsideRoot()
    const paths = [`/src/Hello.elm?import&with=${encodeURIComponent(outside)}`, `/@fs${outside}?import`]
    for (const path of paths) {
      const response = await fetch(example.url(path))
      expect(response.status).not.toBe(200)
      expect(await response.text()).not.toContain('OUTSIDE-OF-ROOT')
    }
  })
})
