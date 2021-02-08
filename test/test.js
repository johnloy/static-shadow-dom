const { staticWc } = require('@drstrangediv/static-wc')

const html = `
  <web-component foo="bar">
    <p>hey</p>
  </web-component>
  <div></div>
  <web-component foo="baz"></web-component>
`

const scripts = ['./web-components/web-component.js', './web-components/nested-component.js']

;(async () => {
  await staticWc(html, scripts, { cwd: __dirname })
})()
