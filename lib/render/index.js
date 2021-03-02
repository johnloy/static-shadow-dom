const { importModule } = require('../helpers')
const extractCriticalCss = require('./5-extractCriticalCss')
const ingestHtml = require('./1-ingestHtml')
const injectHtml = require('./4-injectHtml')
const injectScripts = require('./3-injectScripts')
const processResult = require('./7-processResult')
const renderDsdTemplates = require('./6-renderDsdTemplates')
const setupDom = require('./2-setupDom')

/**
 * Render the shadowRoot of custom elements in an HTML string or [hast
 * AST](https://github.com/syntax-tree/hast) to include a [declarative shadow
 * DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) `<template>` node
 * for use in static site generation (SSG) and server-side rendering (SSR).
 *
 * @param {string} htmlSource - A string of HTML or hast AST tree
 * @param {string[]} scripts - Paths for ES modules defining the web components used in htmlSource
 * @param {import('./StaticShadowDom').Options} options - Options. Default is `{}`
 * @ignore
 *
 * @returns {Promise<import('../StaticShadowDom').RenderResult>} - A promise resolving to an object
 *   with data about the render result
 */
async function render(htmlSource, scripts, options) {
  const htmlSourceMeta = ingestHtml(htmlSource)

  const renderContext = {
    options,
    scripts,
    htmlSourceMeta,
    criticalStyles: {},
  }

  return new Promise((doneCallback) => {
    const dom = setupDom({
      decorateWindow(window) {
        window.__bridge__ = window.__bridge__ || {}
        const bridge = window.__bridge__
        bridge.whenAllDefined = htmlSourceMeta.whenAllDefined
        bridge.htmlSourceMeta = htmlSourceMeta
        bridge.renderContext = {
          ...renderContext,
          // Keep defined elements from past renders using the same renderer process
          definedElements: bridge.renderContext ? bridge.renderContext.definedElements : [],
          ssrElements: bridge.renderContext ? bridge.renderContext.ssrElements : [],
        }

        bridge.importModule = importModule
        bridge.extractCriticalCss = extractCriticalCss
        bridge.renderDsdTemplates = renderDsdTemplates

        // setImmediate() used to ensure `dom` is defined
        setImmediate(() => {
          // This is invoked after all custom elements in the source are connected
          bridge.rendered = processResult.bind(null, renderContext, doneCallback)
        })
      },
    })

    renderContext.dom = dom

    injectScripts(renderContext)

    // Ensure HTML source is injected immediately after the whenDefined()
    // promises resolve for all custom elements, and before the QSA connection
    // observer begins handling element connections.
    htmlSourceMeta.whenAllDefined.done.then(() => injectHtml(options, htmlSourceMeta.htmlString))
  })
}

module.exports = render
