// Types of importing Elm files through vite-plugin-elm, e.g. `/// <reference types="vite-plugin-elm/client" />`

declare module '*.elm' {
  /**
   * A port of a running Elm program. Elm gives `send` to a port from JavaScript, and `subscribe` and `unsubscribe` to
   * a port to JavaScript. Both are typed here, as the types of Elm don't reach JavaScript, so annotate what Elm sends
   */
  interface ElmPort {
    send(value: unknown): void
    subscribe<T = unknown>(callback: (value: T) => void): void
    unsubscribe<T = unknown>(callback: (value: T) => void): void
  }

  /** A running Elm program */
  interface ElmApp {
    ports: Record<string, ElmPort>
  }

  interface ElmInitOptions {
    /** The node that Browser.element and Html replace. Browser.document and Browser.application take the body */
    node?: Element | null
    flags?: unknown
  }

  interface ElmProgram {
    init(options?: ElmInitOptions): ElmApp
  }

  /** Programs by the names of their modules, nested at dots, e.g. `Elm.Pages.Home` for `Pages.Home` */
  type ElmNamespace = { [name: string]: ElmNamespace & ElmProgram }

  export const Elm: ElmNamespace
}
