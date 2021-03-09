const { importModule } = require('../helpers')
const ingestHtml = require('./1-ingestHtml')
const setupDom = require('./2-setupDom')
const injectScripts = require('./3-injectScripts')
const injectHtml = require('./4-injectHtml')
const extractCriticalCss = require('./5-extractCriticalCss')
const renderDsdTemplates = require('./6-renderDsdTemplates')
const processResult = require('./7-processResult')

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
function render(htmlSource, scripts, options) {
  return new Promise((onRenderSuccess, onRenderFailure) => {
    ingestHtml(htmlSource)
      .then((htmlSourceMeta) => {
        const renderContext = {
          options,
          scripts,
          htmlSourceMeta,
          criticalStyles: {},
          onRenderSuccess,
          onRenderFailure,
        }

        const dom = setupDom({
          decorateWindow(window) {
            window.__bridge__ = window.__bridge__ || {}
            const bridge = window.__bridge__
            bridge.onRenderFailure = onRenderFailure
            bridge.whenAllDefined = htmlSourceMeta.whenAllDefined
            bridge.htmlSourceMeta = htmlSourceMeta
            bridge.renderContext = Object.assign(renderContext, {
              // Keep defined elements from past renders using the same renderer process
              definedElements: bridge.renderContext ? bridge.renderContext.definedElements : [],
              ssrElements: bridge.renderContext ? bridge.renderContext.ssrElements : [],
            })

            bridge.importModule = importModule.bind(null, renderContext)
            bridge.extractCriticalCss = extractCriticalCss
            bridge.renderDsdTemplates = renderDsdTemplates

            // setImmediate() used to ensure `dom` is defined
            setImmediate(() => {
              // This is invoked after all custom elements in the source are connected
              bridge.rendered = processResult.bind(null, renderContext)
            })
          },
          rejectRender: onRenderFailure,
        })

        renderContext.dom = dom

        injectScripts(renderContext)

        // Ensure HTML source is injected immediately after the whenDefined()
        // promises resolve for all custom elements, and before the QSA connection
        // observer begins handling element connections.
        htmlSourceMeta.whenAllDefined.done.then(() =>
          injectHtml(renderContext, htmlSourceMeta.htmlString)
        )
      })
      .catch((error) => onRenderFailure(error))
  })
}

module.exports = render
