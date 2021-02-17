const prettier = require('prettier')

function extractCriticalCss(el, window) {
  const bridge = window.__bridge__
  const childrenReversed = [...el.shadowRoot.children].reverse().map((el) => el.localName)
  let count = 0
  while (childrenReversed.length) {
    if (childrenReversed[0] === 'style') {
      childrenReversed.shift()
      count++
      continue
    }
    break
  }

  // Strip continguous <style> elements at the end of el.shadowRoot.children
  // as these are likely inserted by LitElement in the absence of support for
  // constructible stylesheets
  if (count) {
    Array.from(el.shadowRoot.children)
      .slice(-1 * count)
      .forEach((el) => el.remove())
  }

  if (!(el.localName in bridge.renderContext.criticalStyles)) {
    const extracted = Array.of(el.constructor.criticalStyles)
      .filter((i) => i)
      .flat()
      .reduce((string, style) => {
        string += String(style)
        return string
      }, '')
    bridge.renderContext.criticalStyles[el.localName] = prettier.format(extracted, {
      parser: 'css',
    })
  }
}

module.exports = extractCriticalCss
