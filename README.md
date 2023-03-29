# vite-plugin-elm

[![npm](https://img.shields.io/npm/v/vite-plugin-elm.svg?style=for-the-badge)](https://www.npmjs.com/package/vite-plugin-elm)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/hmsk/vite-plugin-elm/main.yml?branch=main&style=for-the-badge)](https://github.com/hmsk/vite-plugin-elm/actions/workflows/main.yml)

A plugin enables you to compile an Elm [application](https://package.elm-lang.org/packages/elm/browser/latest/Browser#application)/[document](https://package.elm-lang.org/packages/elm/browser/latest/Browser#document)/[element](https://package.elm-lang.org/packages/elm/browser/latest/Browser#element) on your [Vite](https://github.com/vitejs/vite) project. [Hot module replacement](https://vitejs.dev/guide/features.html#hot-module-replacement) works roughly in development.

```ts
import { Elm } from './MyApplication.elm'

Elm.MyApplication.init()
```

## Setup

```
npm i -D vite-plugin-elm
```

Update `vite.config.(js|ts)`

```ts
import { defineConfig } from 'vite'
import elmPlugin from 'vite-plugin-elm'

export default defineConfig({
  plugins: [elmPlugin()]
})
```

Then you can import `.elm` file like:

```ts
import { Elm } from './Hello.elm'
```

then

```ts
// Mount "Hello" Browser.{element,document} on #root
Elm.Hello.init({
  node: document.getElementById('root'),
  flags: "Initial Message"
})
```

See [`/example`](/example) dir to play with an actual Vite project. And [this working website](https://github.com/hmsk/hmsk.me) may help you to learn how to use.

## Plugin Options

### `debug` (Default: `process.env.NODE_ENV !== 'production'`)

By giving a boolean, can control debug mode of Elm (means toggle Elm Debugger)

![image](https://user-images.githubusercontent.com/85887/120060168-fd7d8600-c00a-11eb-86cd-4125fe06dc59.png)

```ts
import { defineConfig } from 'vite'
import elmPlugin from 'vite-plugin-elm'

export default defineConfig({
  plugins: [elmPlugin({ debug: false })]
})
```

When it's `false`, disables debug mode in both development and production. Conversely, enables debug mode even in production by `true`. **When production build gets debug mode, Elm's compile optimization doesn't happen**.

### `optimize` (Default: `!debug && process.env.NODE_ENV === 'production'`)

By giving a boolean, can control build optimization, useful to use `Debug` [elm functions](https://package.elm-lang.org/packages/elm/core/latest/Debug)

```ts
import { defineConfig } from 'vite'
import elmPlugin from 'vite-plugin-elm'

export default defineConfig({
  plugins: [elmPlugin({ debug: false, optimize: false })]
})
```

When true, optimize build and forbid usage of `Debug` elm functions.
When specify optimize attribute, had to tell if need to debug or not. It's not why you want to make debug traces you want to see all actions.

## Static Assets Handling

This plugin supports importing assets by giving a particular tag `[VITE_PLUGIN_ELM_ASSET:<path to asset>]` to leverage [Vite's asset handling](https://vitejs.dev/guide/assets.html#importing-asset-as-url).
When Elm code has a string, this plugin replaces it with an imported asset. That string should be just a string without any concatenation.

```elm
Html.img [ Html.Attributes.src "[VITE_PLUGIN_ELM_ASSET:/assets/logo.jpg]" ] []
```

### Helper package

By using a Elm package `elm-vite-plugin-helper`, you can shorten such the tagging:

```
elm install hmsk/elm-vite-plugin-helper
```

```elm
import VitePluginHelper

Html.img [ Html.Attributes.src <| VitePluginHelper.asset "/assets/logo.png?inline" ] []
```

## Combine multiple main files (Experimental from `2.7.0-beta.1`)

By passing importing path via `with` URL-ish parameter(s), the plugin compiles multiple main files in a single compilation process. That generates a single `Elm` export which has multiple properties for each given main files. This way reduces bundle size comparing to a total size of importing each file separately since common modules/Elm core codes are not repeated.

```ts
// `Elm.App` and `Elm.Another`, both can work as like importing individually.
import { Elm } from './App.elm?with=./Another.elm'

Elm.App.init({
  node: document.getElementById('rootForApp'),
})
Elm.Another.init({
  node: document.getElementById('rootForAnother'),
})
```

For 3+ main files:

```ts
import { Elm } from './App.elm?with=./Another.elm&with=./YetAnother.elm'
```

## Acknowledgement

- [klazuka/elm-hot](https://github.com/klazuka/elm-hot) for a helpful referrence of the HMR implementation
- [ChristophP/elm-esm](https://github.com/ChristophP/elm-esm/issues/2) for publishing IIFE -> ESM logic

## License

[MIT](/LICENSE)
