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

    it('shows a compile error from Elm on the overlay', () => {
      cy.task('amendFile', {
        path: 'example/src/Hello.elm',
        target: 'through vite-plugin-elm',
        replacement: 'through vite-plugin-elm" ++ 1 ++ "',
      })
      cy.get('vite-error-overlay')
        .shadow()
        .should('contain.text', '-- TYPE MISMATCH')
        .and('contain.text', 'src/Hello.elm')
        .and('contain.text', 'The (++) operator can append List and String values')
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
          expect($img.attr('src')).to.match(/^data:image\/png;base64,/)
        })
    })

    it('renders an asset with vite-plugin-helper', () => {
      cy.get('[alt="with vite-plugin-helper"]')
        .should('be.visible')
        .and(($img) => {
          expect($img.attr('src')).to.match(/^data:image\/png;base64,/)
        })
    })

    describe('when VitePluginHelper.asset is given a non-literal', () => {
      const file = 'example/src/Application.elm'
      beforeEach(() => {
        cy.task('keepOriginal', file)
      })

      afterEach(() => {
        cy.task('restoreOriginal', file)
      })

      it('shows how to call it on the overlay', () => {
        cy.task('amendFile', {
          path: file,
          target: 'asset "/assets/logo.png?inline"',
          replacement: 'asset ("/assets/" ++ "logo.png?inline")',
        })
        cy.get('vite-error-overlay')
          .shadow()
          .should('contain.text', 'VitePluginHelper.asset takes only a string literal')
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

describe('Platform.worker', () => {
  beforeEach(() => {
    cy.visit(onDevelopmentBuild('/worker.html'))
  })

  it('seems to be working', () => {
    cy.contains('Pong from Elm worker to the main thread')
    cy.contains('Pong from Elm worker to a Web Worker')
    cy.contains('Browser.element bundled with Platform.worker')
  })

  describe('HMR', () => {
    const files = ['example/src/Worker.elm', 'example/src/WorkerCompanion.elm']
    beforeEach(() => {
      cy.task('keepOriginal', files)
    })

    afterEach(() => {
      cy.task('restoreOriginal', files)
    })

    it('performs HMR for editing a worker without touching the page', () => {
      cy.contains('Pong from Elm worker to the main thread')
      cy.task('amendFile', {
        path: 'example/src/Worker.elm',
        target: 'Pong from Elm worker',
        replacement: 'Pong from updated Elm worker',
      })
      cy.contains('Pong from updated Elm worker to the main thread')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_NAVIGATE)
      cy.contains('h1', 'Platform.worker sample')
      cy.contains('Browser.element bundled with Platform.worker')
    })

    it('performs HMR for editing an element bundled with a worker', () => {
      cy.contains('Browser.element bundled with Platform.worker')
      cy.task('amendFile', {
        path: 'example/src/WorkerCompanion.elm',
        target: 'bundled with',
        replacement: 'combined with',
      })
      cy.contains('Browser.element combined with Platform.worker')
      cy.window()
        .then((w) => w.performance.navigation.type)
        .should('eq', window.performance.navigation.TYPE_NAVIGATE)
      cy.contains('h1', 'Platform.worker sample')
      cy.contains('Pong from Elm worker to the main thread')
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

describe('server.fs.allow', () => {
  it('does not compile an Elm file outside of the allow list', () => {
    cy.task<string>('writeElmOutsideRoot').then((outside) => {
      const requests = [
        `/src/Hello.elm?import&with=${encodeURIComponent(outside)}`,
        `/@fs${outside.replace(/\\/g, '/')}?import`,
      ]
      for (const path of requests) {
        cy.request({ url: onDevelopmentBuild(path), failOnStatusCode: false }).then((response) => {
          expect(response.status).to.not.eq(200)
          expect(response.body).to.not.contain('OUTSIDE-OF-ROOT')
        })
      }
    })
  })
})
