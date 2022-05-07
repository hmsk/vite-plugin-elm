const DEVELOPMENT_BUILD_SERVER = 'http://localhost:8936'

const onDevelopmentBuild = (path: string) => new URL(path, DEVELOPMENT_BUILD_SERVER).toString()

describe('Browser.document', () => {
  describe('static', () => {
    before(() => {
      cy.visit(onDevelopmentBuild('/'))
    })

    it('seems to be working', () => {
      cy.contains("I'm compiled Browser.document")
      cy.get('[aria-label="Clickable"]').click()
      cy.contains("I'm clicked")
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
      cy.get('[aria-label="Clickable"]').click()
      cy.task('amendFile', {
        path: 'example/src/Hello.elm',
        targetRegex: 'See Browser.element sample',
        replacement: 'Replaced Message',
      })
      cy.contains('Replaced Message')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_NAVIGATE)
      cy.contains("I'm clicked")
    })

    it('performs HMR for editing imported module', () => {
      cy.get('[aria-label="Clickable"]').click()
      cy.task('amendFile', {
        path: 'example/src/Message.elm',
        targetRegex: 'This message is from a dependency!',
        replacement: 'Dependency is updated',
      })
      cy.contains('Dependency is updated')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_NAVIGATE)
      cy.contains("I'm clicked")
    })

    it('does not perform HMR but reload the page when editing initial state', () => {
      cy.get('[aria-label="Clickable"]').click()
      cy.task('amendFile', {
        path: 'example/src/Hello.elm',
        targetRegex: 'through vite-plugin-elm',
        replacement: 'via the plugin',
      })
      cy.contains('via the plugin')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_RELOAD)
      cy.contains("I'm clicked").should('not.exist')
    })
  })
})

describe('multiple Browser.element', () => {
  before(() => {
    cy.visit(onDevelopmentBuild('/elements.html'))
  })

  it('seems to be working', () => {
    cy.contains('Browser.element sample with combined importing')
    cy.contains('This message is rendered by Description')
    cy.contains('In the next major version;')
  })

  describe('HMR', () => {
    const files = ['example/src/Description.elm', 'example/src/ActualContentForAnotherDescription.elm']
    beforeEach(() => {
      cy.task('keepOriginal', files)
    })

    afterEach(() => {
      cy.task('restoreOriginal', files)
    })

    it('performs HMR for editing view', () => {
      cy.task('amendFile', {
        path: 'example/src/Description.elm',
        targetRegex: 'The above sentence',
        replacement: 'The sentence above',
      })
      cy.contains('The sentence above')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_NAVIGATE)
    })

    it('performs HMR for editing imported module', () => {
      cy.task('amendFile', {
        path: 'example/src/ActualContentForAnotherDescription.elm',
        targetRegex: '3.0',
        replacement: '4.0',
      })
      cy.contains('4.0')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_NAVIGATE)
    })
  })
})
