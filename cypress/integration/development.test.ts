const DEVELOPMENT_BUILD_SERVER = 'http://localhost:8936'

const onDevelopmentBuild = (path: string) => new URL(path, DEVELOPMENT_BUILD_SERVER).toString()

describe('Browser.element', () => {
  before(() => {
    cy.visit(onDevelopmentBuild('/'))
  })

  it('seems to be working', () => {
    cy.contains("I'm compiled Browser.element")
    cy.get('[aria-label="Clickable"]').click()
    cy.contains('Woooo')
  })
})
