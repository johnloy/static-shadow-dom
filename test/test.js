const { staticShadow } = require('@drstrangediv/static-shadow')

const htmlStr1 = `
  <div>String 1</div>
  <web-component foo="bar">
    <p>hey</p>
  </web-component>
  <web-component foo="baz"></web-component>
`

const htmlStr2 = `
  <div>String 2</div>
  <web-component foo="bar">
    <p>hey</p>
  </web-component>
  <web-component foo="baz"></web-component>
`

const scripts = ['./web-components/web-component.js', './web-components/nested-component.js']

;(async () => {
  // const staticShadow = new StaticShadow()
  // staticShadow.render()

  const { html: htmlResult1, cleanup, rendererProcess } = await staticShadow(htmlStr1, scripts, {
    cwd: __dirname,
    cleanup: false,
  })

  console.log(htmlResult1)

  const { html: htmlResult2 } = await staticShadow(htmlStr2, scripts, {
    cwd: __dirname,
    rendererProcess,
  })

  console.log(htmlResult2)

  // cleanup()
})()
