import { describe, expectTypeOf, test } from 'vitest'
import { Elm } from './example/src/Hello.elm'
import { Elm as Combined } from './example/src/Description.elm?with=./AnotherDescription.elm'

describe('client.d.ts', () => {
  test('types the programs of an imported Elm file', () => {
    expectTypeOf(Elm.Hello.init).toBeFunction()
    expectTypeOf(Elm.Pages.Home.init).toBeFunction()
    expectTypeOf(Combined.AnotherDescription.init).toBeFunction()
  })

  test('takes a node and flags to init', () => {
    Elm.Hello.init()
    Elm.Hello.init({ node: document.getElementById('root'), flags: { message: 'Hi' } })
    // @ts-expect-error A node is an element
    Elm.Hello.init({ node: '#root' })
  })

  test('types ports of a running program', () => {
    const app = Elm.Hello.init()
    app.ports.fromElm.subscribe((value) => expectTypeOf(value).toBeUnknown())
    app.ports.fromElm.subscribe((message: string) => expectTypeOf(message).toBeString())
    app.ports.toElm.send('message')
    // @ts-expect-error A callback takes what Elm sends
    app.ports.fromElm.subscribe('not a callback')
  })
})
