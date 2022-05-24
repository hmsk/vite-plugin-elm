# vite-plugin-elm example project

Also used for integration tests.

## Setup

### Get a latest build of vite-plugin-elm

```sh
cd ../
npm i
npm run build
cd example/
```

or you can pick specific version from [published versions](https://www.npmjs.com/package/vite-plugin-elm?activeTab=versions).

Edit `package.json`, then run `npm i`

```diff
+  "vite-plugin-elm": "2.6.1",
-  "vite-plugin-elm": "file:../"
```

## Install dependencies

```sh
npm i
```

## Run dev server

```sh
npm run dev
```

- `/`: A sample page of `Browser.document`
- `/application.html`: A sample page of `Browser.application` with assets helpers
- `/elements.html`: A sample page of `Browser.element` by a combined multiple build

## Production build

```sh
npm run build
```

`/dist` gets whole production build's output.

### Try the build in local

```sh
npm run serve # then visit localhost:3938
```
