const { toHast, toHtml } = require('../helpers')
const isPotentialCustomElementName = require('is-potential-custom-element-name')
const unistUtilIs = require('unist-util-is')
const unistUtilVisit = require('unist-util-visit')
const { SSR_ELEMENT_ATTRIBUTE_NAMES } = require('../constants')

const isSSRCustomElement = unistUtilIs.convert((node) => {
  return (
    node.type === 'element' &&
    isPotentialCustomElementName(node.tagName) &&
    Object.keys(node.properties).some((attr) => SSR_ELEMENT_ATTRIBUTE_NAMES.includes(attr))
  )
})

function createDefinedTracker(total) {
  return {
    total,
    defined() {
      this.total = this.total - 1
      if (this.total === 0) {
        this.done.resolve()
      }
    },
    done: (function () {
      const deferredMethods = {}
      return Object.assign(
        new Promise((resolve, reject) => Object.assign(deferredMethods, { resolve, reject })),
        deferredMethods
      )
    })(),
  }
}

function ingestHtml(htmlSource) {
  let ast = htmlSource
  let htmlString = htmlSource

  if (typeof htmlSource === 'string') {
    ast = toHast(htmlSource)
  } else {
    htmlString = toHtml(ast, { allowDangerousHtml: true })
  }

  const customElementNames = new Set()
  let customElementOcurrences = 0

  unistUtilVisit(ast, isSSRCustomElement, (node) => {
    customElementOcurrences += 1
    customElementNames.add(node.tagName)
  })

  const whenAllDefined = createDefinedTracker(customElementNames.size)

  return {
    ast,
    htmlString,
    customElementNames: [...customElementNames],
    customElementOcurrences,
    whenAllDefined,
  }
}

module.exports = ingestHtml
