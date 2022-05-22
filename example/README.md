# vite-plugin-elm example project

Also used for integration tests.

## Setup


### Get a latest build of vite-plugin-elm

```
cd ../
npm i
npm run build
cd example/
```

or you can pick specific version from published versions.

Edit `package.json`, then run `npm i`

```
+  "vite-plugin-elm": "2.6.1",
-  "vite-plugin-elm": "file:../"
```

## Run dev server

```
npm run dev
```

- `/`: A sample page of `Browser.document`
- `/application.html`: A sample page of `Browser.application` with assets helpers
- `/elements.html`: A sample page of `Browser.elements` by a combined multiple build

## Production build

```
npm run build
```

`/dist` gets whole production build's output.

### Try the build in local

```
npm run server # then visit localhost:3938
```
