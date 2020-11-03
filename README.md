# vite-plugin-elm

[![npm](https://img.shields.io/npm/v/vite-plugin-elm.svg?style=for-the-badge)](https://www.npmjs.com/package/vite-plugin-elm)

A plugin enables you to import a Markdown file as various formats on your [vite](https://github.com/vitejs/vite) project.

## Setup

```
npx i -D vite-plugin-elm
```

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

Visit `/example` dir to play with an actual vite project.

## License

MIT
