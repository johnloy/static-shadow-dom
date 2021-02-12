const { hydrateWc } = require('@drstrangediv/hydrate-wc')

const htmlStr = `
  <web-component foo="bar">
    <p>hey</p>
  </web-component>
  <div></div>
  <web-component foo="baz"></web-component>
`

const scripts = ['./web-components/web-component.js', './web-components/nested-component.js']

;(async () => {
  const { html, dom } = await hydrateWc(htmlStr, scripts, { cwd: __dirname })
  console.log(html)
})()
