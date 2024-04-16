import { expect, it } from 'vitest'
import { parseOptions } from './pluginOptions.js'

it('returns "a"', () => {
  expect(parseOptions()).toBe('a')
})
