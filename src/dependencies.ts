import { readFileSync } from 'fs'
import path from 'path'

import { isFile } from './compiler.js'

const MODULE_NAME = /^\p{Lu}[\p{L}\p{N}_]*(?:\.\p{Lu}[\p{L}\p{N}_]*)*/u

// Blanks out `-- line` and nested `{- block -}` comments, keeping line breaks and columns
const blankComments = (source: string): string => {
  let result = ''
  let depth = 0
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    const next = source[i + 1]
    if (depth === 0 && char === '-' && next === '-') {
      while (i < source.length && source[i] !== '\n') {
        result += ' '
        i++
      }
      if (i < source.length) result += '\n'
    } else if (char === '{' && next === '-') {
      depth++
      result += '  '
      i++
    } else if (depth > 0 && char === '-' && next === '}') {
      depth--
      result += '  '
      i++
    } else {
      result += depth > 0 && char !== '\n' ? ' ' : char
    }
  }
  return result
}

// Module names imported by an Elm module. Only reads its header, i.e. the module declaration and imports.
export const parseImports = (source: string): string[] => {
  // A top-level construct starts at column 0, and continues on indented lines
  const statements: string[] = []
  for (const line of blankComments(source.replace(/\r\n?/g, '\n')).split('\n')) {
    if (line.trim() === '') continue
    if (/^\s/.test(line)) {
      if (statements.length > 0) statements[statements.length - 1] += ` ${line.trim()}`
    } else {
      statements.push(line)
    }
  }

  const imports: string[] = []
  for (const statement of statements) {
    if (/^(?:(?:port|effect)\s+)?module\s/.test(statement)) continue
    const imported = statement.match(/^import\s+(.*)/)?.[1].match(MODULE_NAME)?.[0]
    // The first declaration ends the header
    if (!imported) break
    imports.push(imported)
  }
  return imports
}

const sourceDirectoriesOf = (elmJsonDirectory: string): string[] => {
  const elmJson = JSON.parse(readFileSync(path.join(elmJsonDirectory, 'elm.json'), 'utf8'))
  const directories: string[] = elmJson.type === 'package' ? ['src'] : (elmJson['source-directories'] ?? [])
  return directories.map((directory) => path.resolve(elmJsonDirectory, directory))
}

// Local Elm files the given module depends on, directly or indirectly. Imports of packages are skipped.
export const findLocalDependencies = (target: string, elmJsonDirectory: string | undefined): string[] => {
  if (!elmJsonDirectory) return []
  const sourceDirectories = sourceDirectoriesOf(elmJsonDirectory)

  const main = path.resolve(target)
  const visited = new Set([main])
  const queue = [main]
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    let source: string
    try {
      source = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const moduleName of parseImports(source)) {
      const relativePath = `${moduleName.split('.').join(path.sep)}.elm`
      const dependency = sourceDirectories
        .map((directory) => path.join(directory, relativePath))
        .find((candidate) => isFile(candidate))
      if (dependency && !visited.has(dependency)) {
        visited.add(dependency)
        queue.push(dependency)
      }
    }
  }
  visited.delete(main)
  return [...visited]
}
