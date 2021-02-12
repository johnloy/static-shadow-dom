const { nodeResolve } = require('@rollup/plugin-node-resolve')
const globals = require('globals')
const jsdom = require('jsdom')
const path = require('path')
const stripComments = require('strip-comments')
const prettier = require('prettier')

/**
 * @external JSDOM
 * @see https://github.com/jsdom/jsdom#basic-usage
 */

/** @typedef {import('jsdom').JSDOM} JSDOM */

const HTML_DOC_WRAPPER =
  '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'

const DEFAULT_CONTAINER_EL_ID = 'container'

/**
 * @typedef {Object} Options - [hydrateWc()]{@link hydrateWc} options
 * @property {string} cwd - Current working directory from which provided script paths should be resolved
 * @property {boolean} cleanupDom - Whether to automatically clean up browser globals copied to the
 *   current Node process `global` object
 * @property {string} containerElId - The ID of the container DOM element used for rendering the
 *   HTML fragment
 */

const DEFAULT_OPTIONS = {
  cwd: process.cwd(),
  cleanupDom: true,
  containerElId: DEFAULT_CONTAINER_EL_ID,
}

const nodeGlobals = Object.getOwnPropertyNames(global)
const browserGlobals = Object.keys(globals.browser).filter((g) => !nodeGlobals.includes(g))

function getHTMLSourceMeta(htmlSource) {
  // TODO: Get this from the htmlSource
  const customElementNames = ['web-component']
  let customElementOcurrences = 2
  return {
    htmlString: htmlSource,
    customElementNames,
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
  const virtualConsole = new jsdom.VirtualConsole()
  virtualConsole.sendTo(console)

  const dom = new jsdom.JSDOM(HTML_DOC_WRAPPER, {
    runScripts: 'dangerously',
    url: 'https://local.dev/',
    virtualConsole: virtualConsole,
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

  return dom
}

function injectHTMLSource(options, htmlSource) {
  const containerEl = document.createElement('div')
  containerEl.id = options.containerElId
  containerEl.innerHTML = htmlSource
  document.body.append(containerEl)
}

function render({ options, scriptFiles, htmlSourceMeta, dom }) {
  const { customElementNames } = htmlSourceMeta

  const wcModuleFilesIndex = scriptFiles
    .map((filePath) => {
      const maybeCEName = path.parse(filePath).name
      if (customElementNames.includes(maybeCEName)) {
        return [maybeCEName, filePath]
      }
    })
    .filter((i) => i)

  const moduleCodeInject = `
    ;(async function() {
      const QSAO = (await importModule('qsa-observer')).default

      function observeConnections() {
        const { drop, flush, observer, parse } = QSAO({
          query: [${customElementNames.map((n) => `'${n}'`).join(',')}],
          async handle(element, connected, selector) {
            const event = connected ? 'connected' : 'disconnected';
            // Wait for LitElement-based elements to render
            await Promise.resolve()
            window.customElementOcurrences -= 1

            if (element.shadowRoot) {
              element.insertAdjacentHTML('afterbegin',\`
                <template shadowroot="open">
                \${element.shadowRoot.innerHTML}
                </template>
              \`)
            }

            if (window.customElementOcurrences === 0) {
              const containerEl = document.getElementById('container')
              window.rendered(containerEl.innerHTML)
            }
          }
        })
      }

      window.whenAllDefined.done.then(observeConnections)

      ${wcModuleFilesIndex.reduce((injectCode, [wcName, wcModulePath]) => {
        const resolvedPath = path.resolve(options.cwd, wcModulePath)
        injectCode =
          injectCode +
          `
          ;(async function(){
            await importModule('${resolvedPath}')
            await customElements.whenDefined('${wcName}')
            window.whenAllDefined.defined('${wcName}')
          })()
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

function onRendered(options, dom, doneCallback, renderedHTML) {
  // Strip comments added by lit-html
  const html = stripComments(prettier.format(renderedHTML, { parser: 'html' }), {
    language: 'html',
    preserveNewlines: false,
  }).trim()

  const ret = { html }

  if (options.cleanupDom) {
    cleanupDOM(dom)
  } else {
    Object.assign(ret, { dom, cleanup: cleanupDOM.bind(null, dom) })
  }

  doneCallback(ret)
}

function cleanupDOM(dom) {
  for (const key of browserGlobals) {
    delete global[key]
  }
  delete global.window
  dom.window.close()
}

/**
 * @callback cleanup
 * @returns {void}
 */

/**
 * @typedef {Object} HydrationResult - An object containing data about the hydration result,
 *   including the HTML string
 * @property {JSON} dom - The jsdom.JSDOM instance used for transformation
 * @property {string} html - The transformed HTML fragment, as string
 * @property {cleanup} cleanup - A function to remove jsdom browser globals from Node's `global`
 */

/**
 * Render the shadowRoot of custom elements in an HTML string or [hast
 * AST](https://github.com/syntax-tree/hast) to include a [declarative shadow
 * DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) `<template>` node
 * for use in static site generation (SSG) and server-side rendering (SSR).
 *
 * @param {string} htmlSource - A string of HTML or hast AST tree
 * @param {string[]} scriptFiles - Paths for ES modules defining the web components used in htmlSource
 * @param {Options} [userOptions={}] - Options. Default is `{}`
 * @returns {Promise<Partial<HydrationResult>>} - A promise resolving to an object with data about
 *   the hydration result
 */
async function hydrateWc(htmlSource, scriptFiles, userOptions = {}) {
  return new Promise((doneCallback) => {
    const options = { ...DEFAULT_OPTIONS, ...userOptions }

    const htmlSourceMeta = getHTMLSourceMeta(htmlSource)

    const { customElementNames, customElementOcurrences } = htmlSourceMeta

    const whenAllDefined = createDefinedTracker(customElementNames)

    // Ensure HTML source is injected immediately after the whenDefined()
    // promises resolve for all custom elements.
    whenAllDefined.done.then(() => injectHTMLSource(options, htmlSource))

    const dom = setupDOM({
      decorateWindow: function (window) {
        window.importModule = importModule
        window.whenAllDefined = whenAllDefined
        window.customElementOcurrences = customElementOcurrences

        // setImmediate() used to ensure `dom` is defined
        setImmediate(() => {
          // This is invoked after all custom elements in the source are connected
          window.rendered = onRendered.bind(null, options, dom, doneCallback)
        })
      },
    })

    return render({ options, scriptFiles, htmlSourceMeta, dom })
  })
}

module.exports = {
  hydrateWc,
}
