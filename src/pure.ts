// F2..F9 of Elm's runtime only wrap a function, so a minifier can drop the declarations nobody uses
// once they are marked as pure: https://github.com/hmsk/vite-plugin-elm/issues/837
export const annotatePure = (code: string): string =>
  code.replace(/^(var [\w$]+ = )(F[2-9]\()/gm, '$1/* @__PURE__ */ $2')
