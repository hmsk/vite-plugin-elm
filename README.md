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
npm i -D vite-plugin-elm elm
```

The plugin runs `elm` from the closest `node_modules/.bin`, looking up from the directory having `elm.json`, or from `PATH`. See [`pathToElm`](#pathtoelm) to use another one.

`npm i -D elm` installs the latest Elm. Its version has to match `elm-version` in your `elm.json`, so for a project on Elm 0.19.1, install `elm@0.19.1-6` or update `elm-version`.

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

### Supported versions

| vite-plugin-elm | Vite         | Elm              | Node.js                       |
| --------------- | ------------ | ---------------- | ----------------------------- |
| v4              | 6, 7 and 8   | 0.19.1 to 0.19.3 | `^20.19.0 \|\| >=22.12.0`     |
| v3              | 5 (6–8 work) | 0.19.1           | Same as the Vite version used |

For Vite 5, install v3: `npm i -D vite-plugin-elm@3`.

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

### `pathToElm`

The `elm` binary to run, as a path or a command name. It can be another CLI as long as it works like `elm make` including `--report=json`. A relative path is resolved from the directory having `elm.json`.

```ts
elmPlugin({ pathToElm: './bin/elm' })
```

### `postprocess`

A function to transform the compiled JavaScript, for example to optimize it further with [elm-optimize-level-2](https://github.com/mdgriffith/elm-optimize-level-2). It receives the output of `elm make` and returns JavaScript of the same shape, before the plugin turns it into an ES module.

```ts
import { transform } from 'elm-optimize-level-2'

elmPlugin({
  // The second argument enables `--optimize-speed`
  postprocess: (compiled) => transform(compiled, true),
})
```

It runs on the dev server too, so you may want to set it only for production builds like [`/example/vite.config.ts`](/example/vite.config.ts) does. [Static assets handling](#static-assets-handling) and [combining multiple main files](#combine-multiple-main-files-experimental) work with elm-optimize-level-2.

### `compiler`

You can replace `elm make` with your own function. `compile` receives the paths of the main `.elm` files and returns the compiled JavaScript as the Elm compiler outputs it (not as an ES module).

```ts
elmPlugin({
  compiler: {
    compile: async (targets: string[]) => compileSomehow(targets),
  },
})
```

When `compiler` is given, `debug`, `optimize` and `pathToElm` are ignored, and [`postprocess`](#postprocess) runs on its output. To use elm-optimize-level-2, prefer `postprocess`: its `run` function compiles only the first of the given files, so [combining multiple main files](#combine-multiple-main-files-experimental) doesn't work with it.

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

`VitePluginHelper.asset` takes only a string literal as well. Vite resolves assets at build time, so a path built from variables or `++` stops the compilation with an error.

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

## Web Workers

[`Platform.worker`](https://package.elm-lang.org/packages/elm/core/latest/Platform#worker) programs work both on the main thread and in [Web Workers](https://vitejs.dev/guide/features.html#web-workers). Vite builds Web Workers with their own list of plugins, so add the plugin to `worker.plugins` as well:

```ts
export default defineConfig({
  plugins: [elmPlugin()],
  worker: {
    format: 'es',
    plugins: () => [elmPlugin()],
  },
})
```

## Migrating from v3

- Use Vite 6, 7 or 8, and Node.js `^20.19.0 || >=22.12.0`.
- Install `elm` in your project, or have it in `PATH`. The plugin no longer depends on [node-elm-compiler](https://github.com/rtfeldman/node-elm-compiler) and runs `elm` by itself.
- `nodeElmCompilerOptions` is removed. Replace `nodeElmCompilerOptions.pathToElm` with [`pathToElm`](#pathtoelm). The other options of node-elm-compiler have no replacement.
- Compile errors are reported in the format of the Elm CLI, with colors in the terminal, and point at the file and line on Vite's overlay.
- If you use elm-optimize-level-2 through `compiler`, move to [`postprocess`](#postprocess) to keep static assets and combined main files working.

## Acknowledgement

- [klazuka/elm-hot](https://github.com/klazuka/elm-hot) for a helpful referrence of the HMR implementation
- [ChristophP/elm-esm](https://github.com/ChristophP/elm-esm/issues/2) for publishing IIFE -> ESM logic, which this plugin used until v3

## License

[MIT](/LICENSE)
