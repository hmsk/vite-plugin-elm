# vite-plugin-elm

[![npm](https://img.shields.io/npm/v/vite-plugin-elm.svg?style=for-the-badge)](https://www.npmjs.com/package/vite-plugin-elm)
[![npm next channel](https://img.shields.io/npm/v/vite-plugin-elm/next?style=for-the-badge&color=yellow)](https://www.npmjs.com/package/vite-plugin-elm/v/next)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/hmsk/vite-plugin-elm/main.yml?branch=main&style=for-the-badge)](https://github.com/hmsk/vite-plugin-elm/actions/workflows/main.yml)

A plugin that enables us to compile an Elm [application](https://package.elm-lang.org/packages/elm/browser/latest/Browser#application), [document](https://package.elm-lang.org/packages/elm/browser/latest/Browser#document), or [element](https://package.elm-lang.org/packages/elm/browser/latest/Browser#element) within your [Vite](https://github.com/vitejs/vite) project. In development, [hot module replacement](https://vitejs.dev/guide/features.html#hot-module-replacement) works to some extent.

```ts
import { Elm } from './MyApplication.elm'

Elm.MyApplication.init()
```

## Setup

```
npm i -D vite-plugin-elm
```

In `vite.config.(js|ts)`:

```ts
import { defineConfig } from 'vite'
import elmPlugin from 'vite-plugin-elm'

export default defineConfig({
  plugins: [elmPlugin()]
})
```

Then you can import a `.elm` file and run it like:

```ts
import { Elm } from './Hello.elm'

// Mount "Hello" Browser.{element,document} on #root
Elm.Hello.init({
  node: document.getElementById('root'),
  flags: "Initial Message"
})
```

You can explore the [`/example`](/example) directory to experiment with an actual Vite project. Additionally, [this functional website](https://github.com/hmsk/hmsk.me) can serve as a helpful resource to learn how to use it effectively.

## Options

### `debug` (Default: `process.env.NODE_ENV !== 'production'`)

You can control the debug mode of Elm, which toggles the Elm Debugger, by providing a boolean value.

![image](https://user-images.githubusercontent.com/85887/120060168-fd7d8600-c00a-11eb-86cd-4125fe06dc59.png)

```ts
elmPlugin({ debug: false })
```

When set to `false`, it disables debug mode in both development and production. Conversely, setting it to `true` enables debug mode even in production. It's important to note that **when the production build has debug mode enabled, Elm's compiler optimizations do not take place**.

### `optimize` (Default: `!debug && process.env.NODE_ENV === 'production'`)

You can control build optimization by providing a boolean value, which can be useful for using [`Debug`](https://package.elm-lang.org/packages/elm/core/latest/Debug) functions in your Elm code.

```ts
elmPlugin({ debug: false, optimize: false })
```

When set to `true`, it optimizes the build and prohibits the usage of Debug Elm functions. If you specify the optimize attribute, you must indicate whether debugging is needed. This is because you might want to have debug traces for the purpose of observing all actions, not necessarily for debugging specific issues.

## Static Assets Handling

This plugin supports importing assets by using a specific tag `[VITE_PLUGIN_ELM_ASSET:<path to asset>]` to leverage [Vite's asset handling](https://vitejs.dev/guide/assets.html#importing-asset-as-ur). When your Elm code contains a tag, this plugin replaces that string with the imported asset. It's important to note that the string should be a standalone string without any concatenation.

```elm
Html.img [ Html.Attributes.src "[VITE_PLUGIN_ELM_ASSET:/assets/logo.jpg]" ] []
```

### Helper package

We can simplify the tagging process by using the Elm package `elm-vite-plugin-helper`:

```sh
elm install hmsk/elm-vite-plugin-helper
```

```elm
import VitePluginHelper

Html.img [ Html.Attributes.src <| VitePluginHelper.asset "/assets/logo.png?inline" ] []
```

## Combine multiple main files (Experimental)

By passing importing paths via the `with` URL-ish parameter(s), the plugin compiles multiple main files in a single compilation process. This results in a single Elm export that contains multiple properties, each corresponding to a given main file. This feature helps reduce the bundle size when compared to importing each file separately because common modules and Elm core code are not repeated.

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
