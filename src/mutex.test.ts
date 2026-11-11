import { describe, expect, test } from 'vitest'
import { acquireLock } from './mutex.js'

describe('acquireLock', () => {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  test('gives the lock to one holder at a time, in order', async () => {
    let holders = 0
    let most = 0
    const order: string[] = []
    const job = async (name: string, ms: number) => {
      const release = await acquireLock()
      holders++
      most = Math.max(most, holders)
      order.push(name)
      await sleep(ms)
      holders--
      release()
    }

    const first = job('A', 20)
    const second = job('B', 40)
    // Asks while B holds the lock as the last one in the queue
    await sleep(30)
    await Promise.all([first, second, job('C', 10)])

    expect(most).toBe(1)
    expect(order).toEqual(['A', 'B', 'C'])
  })

  test('lets the next holder in after a holder releases twice', async () => {
    const release = await acquireLock()
    release()
    release()
    const next = await acquireLock()
    next()
  })
})
