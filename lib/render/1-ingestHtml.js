const { RenderError } = require('../errors')
const { toHast, toHtml } = require('../helpers')
const isPotentialCustomElementName = require('is-potential-custom-element-name')
const unistUtilIs = require('unist-util-is')
const unistUtilVisit = require('unist-util-visit')

const isNodeCustomElement = unistUtilIs.convert((node) => {
  return node.type === 'element' && isPotentialCustomElementName(node.tagName)
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

async function ingestHtml(htmlSource) {
  let ast = htmlSource
  let htmlString = htmlSource

  if (typeof htmlSource === 'string') {
    try {
      ast = await toHast(htmlString)
    } catch (error) {
      throw new RenderError(RenderError.codes.INVALID_HTML_SOURCE_STRING, {
        rehypeParseError: {
          reason: error.vfileMessage.reason,
          line: error.vfileMessage.line,
          column: error.vfileMessage.column,
          info: error.vfileMessage.url,
        },
      })
    }
  } else {
    try {
      htmlString = toHtml(ast, { allowDangerousHtml: true })
    } catch (error) {
      throw new RenderError(RenderError.codes.INVALID_HTML_SOURCE_AST, {
        hastToHtmlError: error,
      })
    }
  }

  const customElementNames = new Set()
  let customElementOcurrences = 0

  unistUtilVisit(ast, isNodeCustomElement, (node) => {
    customElementOcurrences += 1
    customElementNames.add(node.tagName)
  })

  const whenAllDefined = createDefinedTracker(customElementNames.size)

  return {
    ast,
    customElementNames: [...customElementNames],
    customElementOcurrences,
    htmlString,
    whenAllDefined,
  }
}

module.exports = ingestHtml
