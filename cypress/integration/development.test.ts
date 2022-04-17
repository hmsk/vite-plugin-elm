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
    beforeEach(() => {
      cy.task('keepOriginal', 'example/src/Hello.elm')
      cy.visit(onDevelopmentBuild('/'))
    })

    afterEach(() => {
      cy.task('restoreOriginal', 'example/src/Hello.elm')
    })

    it('performs HMR for editing view', () => {
      cy.task('amendFile', {
        path: 'example/src/Hello.elm',
        targetRegex: 'See Browser.Application sample',
        replacement: 'Replaced Message',
      })
      cy.contains('Replaced Message')
      expect(window.performance.navigation.type).to.eq(window.performance.navigation.TYPE_NAVIGATE)
    })
  })
})
