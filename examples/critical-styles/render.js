const { StaticShadowDom } = require('@johnloy/static-shadow-dom')

const htmlFragmentStr = `
  <div>String 1</div>
  <web-component foo="bar">
    <p>hey</p>
  </web-component>
  <web-component foo="baz"></web-component>
`

// Somewhere within these scripts, or their dependencies, customElements.define() must
// be called for the custom elements being rendered.
const scripts = ['./components/web-component.js']

;(async () => {
  const staticShadowDom = new StaticShadowDom({
    // Set the current working directory for resolving:
    // - scripts paths
    // - relative paths in the import-map, if present
    cwd: __dirname,

    // Get back the hast AST tree for further use, if desired
    returnAst: true,

    prettify: true,
  })

  const { html, criticalStyles } = await staticShadowDom.render(htmlFragmentStr, scripts)

  console.log(html)

  console.log(criticalStyles)
})()
