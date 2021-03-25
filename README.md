# vite-plugin-elm

[![npm](https://img.shields.io/npm/v/vite-plugin-elm.svg?style=for-the-badge)](https://www.npmjs.com/package/vite-plugin-elm) [![npm](https://img.shields.io/npm/v/vite-plugin-elm/vite-1.svg?style=for-the-badge)](https://www.npmjs.com/package/vite-plugin-elm/v/vite-1)

A plugin enables you to compile an Elm [application](https://package.elm-lang.org/packages/elm/browser/latest/Browser#application)/[document](https://package.elm-lang.org/packages/elm/browser/latest/Browser#element)/[element](https://package.elm-lang.org/packages/elm/browser/latest/Browser#element) on your [vite](https://github.com/vitejs/vite) project.

```ts
import { Elm } from './MyApplication.elm'

Elm.MyApplication.init();
```

## Setup

```
npx i -D vite-plugin-elm
```

<details>
  <summary>For vite v1</summary>

```
npx i -D vite-plugin-elm@vite-1
```

</details>

Update `vite.config.(js|ts)`

```ts
import elmPlugin from 'vite-plugin-elm'

module.exports = {
  plugins: [elmPlugin()]
}
```

Then you can import `.elm` file like:

```ts
import { Elm } from './Hello.elm'
```

then

```ts
// mount "Hello" Browser.{element,document} on #root
Elm.Hello.init({
  node: document.getElementById('root'),
  flags: "Initial Message"
})
```

See [`/example`](/example) dir to play with an actual vite project. And [this working website](https://github.com/hmsk/hmsk.me) may help you to learn how to use.

## Acknowledgement

- [klazuka/elm-hot](https://github.com/klazuka/elm-hot) for a helpful referrence of the HMR implementation
- [ChristophP/elm-esm](https://github.com/ChristophP/elm-esm/issues/2) for publishing IIFE -> ESM logic

## License

[MIT](/LICENSE)
