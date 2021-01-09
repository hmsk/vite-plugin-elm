# vite-plugin-elm

[![npm](https://img.shields.io/npm/v/vite-plugin-elm.svg?style=for-the-badge)](https://www.npmjs.com/package/vite-plugin-elm) [![npm](https://img.shields.io/npm/v/vite-plugin-elm/vite-1.svg?style=for-the-badge)](https://www.npmjs.com/package/vite-plugin-elm/v/vite-1)

A plugin enables you to import a Markdown file as various formats on your [vite](https://github.com/vitejs/vite) project.

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

Then you can write

```ts
import { Elm } from './Hello.elm'

Elm.Hello.init({
  node: document.getElementById('root'),
  flags: "Initial Message"
})
```

Visit `/example` dir to play with an actual vite project. And [this working website](https://github.com/hmsk/hmsk.me) may help you to learn how to use.

## Acknowledgement

- [klazuka/elm-hot](https://github.com/klazuka/elm-hot) for a helpful referrence of the HMR implementation
- [ChristophP/elm-esm](https://github.com/ChristophP/elm-esm/issues/2) for publishing IIFE -> ESM logic

## License

[MIT](/LICENSE)
