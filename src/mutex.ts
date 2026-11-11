/**
 * Elm compiler keeps its cache in elm-stuff, which breaks when two compilations write it at once:
 * "It looks like some of the information cached in elm-stuff/ has been corrupted." or "resource busy (file is locked)"
 * So compilations run one at a time, in the order they ask for the lock.
 */
let last: Promise<void> = Promise.resolve()

export const acquireLock = async (): Promise<() => void> => {
  let release!: () => void
  const previous = last
  last = new Promise<void>((resolve) => {
    release = resolve
  })
  await previous
  return release
}
