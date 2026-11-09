import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { findLocalDependencies, parseImports } from './dependencies.js'

describe('parseImports', () => {
  it('reads imports with aliases and exposing lists', () => {
    const source = `module Main exposing (main)

import Html exposing (Html, div)
import Html.Attributes as Attr
import Page.Home
import Dict exposing
    ( Dict
    , empty
    )

main = div [] []
`
    expect(parseImports(source)).toEqual(['Html', 'Html.Attributes', 'Page.Home', 'Dict'])
  })

  it('handles port and effect modules, and multi-line module declarations', () => {
    expect(
      parseImports('port module Main exposing\n    ( main\n    )\n\nimport A\n\nport out : String -> Cmd msg\n'),
    ).toEqual(['A'])
    expect(
      parseImports(
        'effect module Fx where { command = MyCmd } exposing (MyCmd)\n\nimport Task\nimport B.C\n\ntype MyCmd = X\n',
      ),
    ).toEqual(['Task', 'B.C'])
  })

  it('reads imports without a module declaration', () => {
    expect(parseImports('import Html\n\nmain = Html.text "hi"\n')).toEqual(['Html'])
  })

  it('ignores imports in comments', () => {
    const source = `module Main exposing (main)
{-| Doc comment
import Fake.InDoc
-}

{- {- nested -}
import Fake.Nested
-}
import Real.One -- import Fake.InLine
{- x -}
import Real.Two
-- import Fake.Line
import Real.Three

main = 1
`
    expect(parseImports(source)).toEqual(['Real.One', 'Real.Two', 'Real.Three'])
  })

  it('handles CRLF and an import split over lines', () => {
    expect(
      parseImports('module Main exposing (main)\r\n\r\nimport\r\n    A.B\r\nimport C {- x -}\r\nimport D\r\n'),
    ).toEqual(['A.B', 'C', 'D'])
  })

  it('stops at the first declaration', () => {
    const source = `module Main exposing (main)

import A

text = """
import NotAModule
"""

import B
`
    expect(parseImports(source)).toEqual(['A'])
  })

  it('reads non-ASCII module names', () => {
    expect(parseImports('module Main exposing (main)\nimport Ünïcode.Módulo\nmain = 1\n')).toEqual(['Ünïcode.Módulo'])
  })
})

describe('findLocalDependencies', () => {
  let root: string
  const write = (file: string, content: string) => {
    const filePath = path.join(root, file)
    mkdirSync(path.dirname(filePath), { recursive: true })
    writeFileSync(filePath, content)
    return filePath
  }

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'vite-plugin-elm-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('finds local modules in source directories recursively, skipping packages', () => {
    write('elm.json', JSON.stringify({ type: 'application', 'source-directories': ['src', 'shared'] }))
    const main = write(
      'src/Main.elm',
      'module Main exposing (main)\nimport Html\nimport Page.Home\nimport Common\nmain = 1\n',
    )
    const home = write(
      'src/Page/Home.elm',
      'module Page.Home exposing (view)\nimport Common\nimport Page.Parts\nview = 1\n',
    )
    const parts = write('src/Page/Parts.elm', 'module Page.Parts exposing (x)\nx = 1\n')
    const common = write('shared/Common.elm', 'module Common exposing (x)\nimport Page.Home\nx = 1\n')

    expect(findLocalDependencies(main, root).sort()).toEqual([home, parts, common].sort())
  })

  it('uses src for a package', () => {
    write('elm.json', JSON.stringify({ type: 'package' }))
    const main = write('src/Main.elm', 'module Main exposing (main)\nimport Helper\nmain = 1\n')
    const helper = write('src/Helper.elm', 'module Helper exposing (x)\nx = 1\n')

    expect(findLocalDependencies(main, root)).toEqual([helper])
  })

  it('returns nothing without elm.json', () => {
    const main = write('Main.elm', 'module Main exposing (main)\nimport Helper\nmain = 1\n')
    write('Helper.elm', 'module Helper exposing (x)\nx = 1\n')

    expect(findLocalDependencies(main, undefined)).toEqual([])
  })
})
