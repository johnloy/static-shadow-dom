const { StaticShadowDom } = require('@johnloy/static-shadow-dom')
const htmlFragmentAst = require('./html-fragment-ast')

const htmlFragmentStr1 = `
  <div>String 1</div>
  <web-component foo="bar">
    <p>hey</p>
  </web-component>
  <web-component foo="baz"></web-component>
`

const htmlFragmentStr2 = `
  <div>String 2</div>
  <web-component foo="bar">
    <p>hey</p>
  </web-component>
  <web-component foo="baz"></web-component>
`

// Somewhere within these scripts, or their dependencies, customElements.define() must
// be called for the custom elements being rendered.
const scripts = ['./components/web-component.js', './components/nested-component.js']

;(async () => {
  const staticShadowDom = new StaticShadowDom({
    // Set the current working directory for resolving:
    // - scripts paths
    // - relative paths in the import-map, if present
    cwd: __dirname,

    // Use an import map
    importMap: true,

    // Get back the hast AST tree for further use, if desired
    returnAst: true,

    prettify: true,

    nestedElements: true,
  })

  const { html: htmlResult1 } = await staticShadowDom.render(htmlFragmentStr1, scripts, {
    // Keep the renderer child process alive for subsequent renders
    cleanup: false,
  })

  console.log('\n', htmlResult1)

  const { html: htmlResult2 } = await staticShadowDom.render(htmlFragmentStr2, scripts)

  console.log('\n---\n\n', htmlResult2)

  const { html: htmlResult3 } = await staticShadowDom.render(htmlFragmentAst, scripts)

  console.log('\n---\n\n', htmlResult3)

  // Must explicitly call StaticShadowDom#cleanup if the `cleanup: false` option was used
  // on the first call to StaticShadowDom#render.
  staticShadowDom.cleanup()
})()
