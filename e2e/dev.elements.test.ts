import { beforeEach, describe, expect, test } from 'vitest'
import { navigationType, useExample } from './example.js'

const example = useExample({ command: 'dev' })

describe('multiple Browser.element', () => {
  beforeEach(async () => {
    await example.goto('/elements.html')
  })

  test('seems to be working', async () => {
    const { page } = example
    await page.getByText('Browser.element sample with combined importing').waitFor()
    await page.getByText('This message is rendered by Description').waitFor()
    await page.getByText('In the next major version;').waitFor()
  })

  describe('HMR', () => {
    test('performs HMR for editing view', async () => {
      const { page } = example
      await page.getByText('The above sentence').waitFor()
      await example.amend('src/Description.elm', 'The above sentence', 'The sentence above')
      await page.getByText('The sentence above').waitFor()
      expect(await navigationType(page)).toBe('navigate')
    })

    test('performs HMR for editing imported module', async () => {
      const { page } = example
      await page.getByText('3.0').waitFor()
      await example.amend('src/ActualContentForAnotherDescription.elm', '3.0', '4.0')
      await page.getByText('4.0').waitFor()
      expect(await navigationType(page)).toBe('navigate')
    })
  })
})
