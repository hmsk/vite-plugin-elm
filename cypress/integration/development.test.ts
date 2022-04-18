const DEVELOPMENT_BUILD_SERVER = 'http://localhost:8936'

const onDevelopmentBuild = (path: string) => new URL(path, DEVELOPMENT_BUILD_SERVER).toString()

describe('Browser.element', () => {
  describe('static', () => {
    before(() => {
      cy.visit(onDevelopmentBuild('/'))
    })

    it('seems to be working', () => {
      cy.contains("I'm compiled Browser.element")
      cy.get('[aria-label="Clickable"]').click()
      cy.contains('Woooo')
    })

    it('has a button for Elm Debugger', () => {
      cy.get('svg[width="24px"][height="24px"]').should('be.visible')
    })
  })

  describe('HMR', () => {
    const files = ['example/src/Hello.elm', 'example/src/Message.elm']
    beforeEach(() => {
      cy.task('keepOriginal', files)
      cy.visit(onDevelopmentBuild('/'))
    })

    afterEach(() => {
      cy.task('restoreOriginal', files)
    })

    it('performs HMR for editing view', () => {
      cy.task('amendFile', {
        path: 'example/src/Hello.elm',
        targetRegex: 'See Browser.Application sample',
        replacement: 'Replaced Message',
      })
      cy.contains('Replaced Message')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_NAVIGATE)
    })

    it.only('performs HMR for editing imported module', () => {
      cy.task('amendFile', {
        path: 'example/src/Message.elm',
        targetRegex: 'This message is from a dependency!',
        replacement: 'Dependency is updated',
      })
      cy.contains('Dependency is updated')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_NAVIGATE)
    })

    it('does not perform HMR but reload the page when editing initial state', () => {
      cy.task('amendFile', {
        path: 'example/src/Hello.elm',
        targetRegex: 'through vite-plugin-elm',
        replacement: 'via the plugin',
      })
      cy.contains('via the plugin')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_RELOAD)
    })
  })
})
