const { StaticShadowDom } = require('@johnloy/static-shadow-dom')
const data = require('./data.json')

const htmlSource = `<ssr-page></ssr-page>`

// Somewhere within these scripts, or their dependencies, customElements.define() must
// be called for the custom elements being rendered.
const scripts = ['./components/ssr-page.js', './components/ssr-section.js']

;(async () => {
  const staticShadowDom = new StaticShadowDom({
    // Set the current working directory for resolving:
    // - scripts paths
    // - relative paths in the import-map, if present
    cwd: __dirname,

    prettify: true,

    elements: ['ssr-page', 'ssr-section'],

    data,

    getElementProperties(el, { data }) {
      if (el.localName === 'ssr-page') {
        return data
      }
    },
  })

  const { html: htmlResult1 } = await staticShadowDom.render(htmlSource, scripts)

  console.log('\n', htmlResult1)
})()
