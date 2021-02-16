const { nodeResolve } = require('@rollup/plugin-node-resolve')
const globals = require('globals')
const isPotentialCustomElementName = require('is-potential-custom-element-name')
const jsdom = require('jsdom')
const parse = require('rehype-parse')
const path = require('path')
const prettier = require('prettier')
const unified = require('unified')
const unistUtilIs = require('unist-util-is')
const unistUtilVisit = require('unist-util-visit')
const toHtml = require('hast-util-to-html')

/**
 * @external JSDOM
 * @see https://github.com/jsdom/jsdom#basic-usage
 */

/** @typedef {import('jsdom').JSDOM} JSDOM */

const HTML_DOC_WRAPPER =
  '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'

let _dom

const nodeGlobals = Object.getOwnPropertyNames(global)
const browserGlobals = Object.keys(globals.browser).filter((g) => !nodeGlobals.includes(g))

const htmlStringToHast = unified().use(parse, { fragment: true }).parse

const isNodeCustomElement = unistUtilIs.convert(
  (node) => node.type === 'element' && isPotentialCustomElementName(node.tagName)
)

async function getHTMLSourceMeta(htmlSource) {
  let ast = htmlSource
  let htmlString = htmlSource

  if (typeof htmlSource === 'string') {
    ast = htmlStringToHast(htmlSource)
  } else {
    htmlString = toHtml(ast, { allowDangerousHtml: true })
  }

  const customElementNames = new Set()
  let customElementOcurrences = 0

  unistUtilVisit(ast, isNodeCustomElement, (node) => {
    customElementOcurrences += 1
    customElementNames.add(node.tagName)
  })

  // TODO: Get this from the htmlSource
  // const customElementNames = ['web-component']
  return {
    ast,
    htmlString,
    customElementNames: [...customElementNames],
    customElementOcurrences,
  }
}

function createDefinedTracker(customElementNames) {
  return {
    total: customElementNames.length,
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

async function importModule(specifier) {
  let resolvedPath = specifier
  if (!/^[./]/.test(specifier)) {
    resolvedPath = (await nodeResolve().resolveId(specifier, __filename)).id
  }
  return import(resolvedPath)
}

function setupDOM({ decorateWindow }) {
  let dom
  if (_dom) {
    decorateWindow(_dom.window)
    dom = _dom
  } else {
    _dom = dom = new jsdom.JSDOM(HTML_DOC_WRAPPER, {
      runScripts: 'dangerously',
      url: 'https://local.dev/',
      virtualConsole: new jsdom.VirtualConsole().sendTo(console),
      beforeParse: decorateWindow,
    })

    for (const key of browserGlobals) {
      global[key] = dom.window[key]
    }

    // Relay properties set on `window` to Node `global`
    const windowProxy = new Proxy(dom.window, {
      set(obj, prop, value) {
        global[prop] = value
        Reflect.set(obj, prop, value)
        return true
      },
    })

    global.window = windowProxy
  }

  return dom
}

function injectHTMLSource(options, htmlSource) {
  let containerEl = document.getElementById(options.containerElId)

  if (!containerEl) {
    containerEl = document.createElement('div')
    containerEl.id = options.containerElId
    document.body.append(containerEl)
  }

  containerEl.innerHTML = htmlSource
}

function render({ options, scriptFiles, htmlSourceMeta, dom }) {
  const { customElementNames } = htmlSourceMeta

  const moduleCodeInject = `
    ;(async function() {
      const currentScript = document.currentScript
      const QSAO = (await importModule('qsa-observer')).default

      function observeConnections() {
        const { observer } = QSAO({
          query: [${customElementNames.map((n) => `'${n}'`).join(',')}],
          async handle(element, connected, selector) {
            const event = connected ? 'connected' : 'disconnected';
            if (event === 'connected') {

              // Wait for LitElement-based elements to render
              // https://lit-element.polymer-project.org/guide/lifecycle#performupdate
              await Promise.resolve()
              window.customElementOcurrences -= 1

              if (element.shadowRoot) {
                window.extractCriticalStyles(element)
                element.insertAdjacentHTML('afterbegin',\`
                  <template shadowroot="open">
                  \${element.shadowRoot.innerHTML}
                  </template>
                \`)
              }

              if (window.customElementOcurrences === 0) {
                observer.disconnect()
                const containerEl = document.getElementById('${options.containerElId}')
                const htmlStr = containerEl.innerHTML
                Promise.resolve().then(() => window.rendered(htmlStr))
                containerEl.innerHTML = ''
                currentScript.remove()
              }
            }
          }
        })
      }

      window.whenAllDefined.done.then(observeConnections)

      ${scriptFiles.reduce((injectCode, filePath) => {
        const resolvedPath = path.resolve(options.cwd, filePath)
        injectCode = injectCode + `\nimportModule('${resolvedPath}');`
        return injectCode
      }, '')}

      ${customElementNames.reduce((injectCode, elName) => {
        injectCode =
          injectCode +
          `
            if (customElements.get('${elName}')) {
              window.whenAllDefined.defined('${elName}')
            } else {
              await customElements.whenDefined('${elName}')
              window.whenAllDefined.defined('${elName}')
            }
        `
        return injectCode
      }, '')}
    })()
    `

  const { document } = dom.window
  const script = document.createElement('script')
  script.textContent = moduleCodeInject
  document.body.append(script)
}

function onRendered(options, dom, criticalStyles, doneCallback, renderedHTML) {
  // Strip marker comments added by lit-html
  let html = renderedHTML.replace(/\s*\n?<!--\s*-->(\s*\n?)/g, '$1')

  if (options.prettify) {
    html = prettier.format(html, { parser: 'html', printWidth: 150 })
  }

  const ret = { html, criticalStyles }

  if (options.returnAst) {
    ret.ast = htmlStringToHast(renderedHTML)
  }

  doneCallback(ret)
}

/**
 * @callback cleanup
 * @returns {void}
 */

/**
 * Render the shadowRoot of custom elements in an HTML string or [hast
 * AST](https://github.com/syntax-tree/hast) to include a [declarative shadow
 * DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) `<template>` node
 * for use in static site generation (SSG) and server-side rendering (SSR).
 *
 * @param {string} htmlSource - A string of HTML or hast AST tree
 * @param {string[]} scriptFiles - Paths for ES modules defining the web components used in htmlSource
 * @param {import('./StaticShadowDom').Options} options - Options. Default is `{}`
 * @ignore
 *
 * @returns {Promise<import('./StaticShadowDom').RenderResult>} - A promise resolving to an object
 *   with data about the hydration result
 */
async function run(htmlSource, scriptFiles, options) {
  const htmlSourceMeta = await getHTMLSourceMeta(htmlSource)

  return new Promise((doneCallback) => {
    const { customElementNames, customElementOcurrences } = htmlSourceMeta

    const whenAllDefined = createDefinedTracker(customElementNames)

    // Ensure HTML source is injected immediately after the whenDefined()
    // promises resolve for all custom elements.
    whenAllDefined.done.then(() => injectHTMLSource(options, htmlSourceMeta.htmlString))

    const criticalStyles = {}

    function extractCriticalStyles(el) {
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
      ;[...el.shadowRoot.children].slice(-1 * count).forEach((el) => el.remove())

      if (!(el.localName in criticalStyles)) {
        const extracted = Array.of(el.constructor.criticalStyles)
          .filter((i) => i)
          .flat()
          .reduce((string, style) => {
            string += String(style)
            return string
          }, '')
        criticalStyles[el.localName] = prettier.format(extracted, { parser: 'css' })
      }
    }

    const dom = setupDOM({
      decorateWindow: function (window) {
        window.importModule = importModule
        window.whenAllDefined = whenAllDefined
        window.customElementOcurrences = customElementOcurrences
        window.extractCriticalStyles = extractCriticalStyles

        // setImmediate() used to ensure `dom` is defined
        setImmediate(() => {
          // This is invoked after all custom elements in the source are connected
          window.rendered = onRendered.bind(null, options, dom, criticalStyles, doneCallback)
        })
      },
    })

    return render({ options, scriptFiles, htmlSourceMeta, dom })
  })
}

process.on('message', async (message) => {
  if (message.type === 'render') {
    const { html, scripts, options } = message
    const result = await run(html, scripts, options)

    process.send({
      type: 'done',
      ...result,
    })
  }
})

// Necessary to notify the parent process that this process
// is ready to receive message.
process.send('ready')
