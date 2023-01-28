const DEVELOPMENT_BUILD_SERVER = 'http://localhost:8936'

const onDevelopmentBuild = (path: string) => new URL(path, DEVELOPMENT_BUILD_SERVER).toString()

describe('Browser.document', () => {
  describe('static', () => {
    beforeEach(() => {
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
      cy.visit(onDevelopmentBuild('/'))
      cy.task('keepOriginal', files)
    })

    afterEach(() => {
      cy.task('restoreOriginal', files)
    })

    it('performs HMR for editing view', () => {
      cy.get('[aria-label="Clickable"]').click()
      cy.task('amendFile', {
        path: 'example/src/Hello.elm',
        target: 'See Browser.element sample',
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
        target: 'This message is from a dependency!',
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
        target: 'through vite-plugin-elm',
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

describe('Browser.application', () => {
  beforeEach(() => {
    cy.visit(onDevelopmentBuild('/application.html'))
  })

  it('seems to be working', () => {
    cy.contains('Your Elm App is working!')
  })

  describe('assets', () => {
    it('renders an asset with asset tag', () => {
      cy.get('[alt="without option"]')
        .should('be.visible')
        .and(($img) => {
          expect($img.attr('src')).to.be.eq('/assets/logo.jpg')
        })
    })

    it('renders an asset with inline option', () => {
      cy.get('[alt="with inline option"]')
        .should('be.visible')
        .and(($img) => {
          expect($img.attr('src')).to.be.eq('/assets/logo.png?inline')
        })
    })

    it('renders an asset with vite-plugin-helper', () => {
      cy.get('[alt="with vite-plugin-helper"]')
        .should('be.visible')
        .and(($img) => {
          expect($img.attr('src')).to.be.eq('/assets/logo.png?inline')
        })
    })
  })
})

describe('multiple Browser.element', () => {
  beforeEach(() => {
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
      cy.visit(onDevelopmentBuild('/elements.html'))
      cy.task('keepOriginal', files)
    })

    afterEach(() => {
      cy.task('restoreOriginal', files)
    })

    it('performs HMR for editing view', () => {
      cy.task('amendFile', {
        path: 'example/src/Description.elm',
        target: 'The above sentence',
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
        target: '3.0',
        replacement: '4.0',
      })
      cy.contains('4.0')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_NAVIGATE)
    })
  })
})

describe('raw loading', () => {
  before(() => {
    cy.visit(onDevelopmentBuild('/raw.html'))
  })

  it('importing with ?raw is not blocked by the plugin', () => {
    cy.get('head meta[name="elm:plugin"]').should('have.attr', 'content', 'module Raw exposing (main)')
  })
})
