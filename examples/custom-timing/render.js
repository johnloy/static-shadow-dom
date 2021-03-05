const { StaticShadowDom } = require('@johnloy/static-shadow-dom')

const htmlFragmentStr = `
  <web-component></web-component>
  <nested-component></nested-component>
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

    elements: ['web-component', 'nested-component'],

    prettify: true,

    getRenderReady(el) {
      if (el.localName === 'nested-component') {
        return new Promise((resolve) => {
          setTimeout(resolve, 500)
        })
      }
    },
  })

  const { html } = await staticShadowDom.render(htmlFragmentStr, scripts)

  console.log(html)
})()
