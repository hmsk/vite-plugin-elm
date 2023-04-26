const PRODUCTION_BUILD_SERVER = 'http://localhost:8938'

const onProductionBuild = (path: string) => new URL(path, PRODUCTION_BUILD_SERVER).toString()

describe('Browser.document', () => {
  beforeEach(() => {
    cy.visit(onProductionBuild('/'))
  })

  it('seems to be working', () => {
    cy.contains("I'm compiled Browser.document")
    cy.get('[aria-label="Clickable"]').click()
    cy.contains("I'm clicked")
  })

  it('does not have a button for Elm Debugger', () => {
    cy.get('svg[width="24px"][height="24px"]').should('not.exist')
  })
})

describe('Browser.application', () => {
  beforeEach(() => {
    cy.visit(onProductionBuild('/application'))
  })

  it('seems to be working', () => {
    cy.contains('Your Elm App is working!')
  })

  describe('assets', () => {
    it('renders an asset with asset tag', () => {
      cy.get('[alt="without option"]')
        .should('be.visible')
        .and(($img) => {
          expect($img.attr('src')).to.be.match(/\/assets\/logo-\d+\.jpg/)
        })
    })

    it('renders an asset with inline option', () => {
      cy.get('[alt="with inline option"]')
        .should('be.visible')
        .and(($img) => {
          expect($img.attr('src').length).to.be.greaterThan(100)
        })
    })

    it('renders an asset with vite-plugin-helper', () => {
      cy.get('[alt="with vite-plugin-helper"]')
        .should('be.visible')
        .and(($img) => {
          expect($img.attr('src').length).to.be.greaterThan(100)
        })
    })
  })
})

describe('multiple Browser.element', () => {
  before(() => {
    cy.visit(onProductionBuild('/elements'))
  })

  it('seems to be working', () => {
    cy.contains('Browser.element sample with combined importing')
    cy.contains('This message is rendered by Description')
    cy.contains('In the next major version;')
  })
})

describe('raw loading', () => {
  before(() => {
    cy.visit(onProductionBuild('/raw'))
  })

  it('importing with ?raw is not blocked by the plugin', () => {
    cy.get('head meta[name="elm:plugin"]').should('have.attr', 'content', 'module Raw exposing (main)')
  })
})
