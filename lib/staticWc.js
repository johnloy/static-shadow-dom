const { init: esLexerInit, parse: esLexerParse } = require('es-module-lexer')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const fs = require('fs')
const globals = require('globals')
const jsdom = require('jsdom')
const path = require('path')
const stripComments = require('strip-comments')
const prettier = require('prettier')

const nodeGlobals = Object.getOwnPropertyNames(global)
const browserGlobals = Object.keys(globals.browser).filter((g) => !nodeGlobals.includes(g))

const importModule = async (specifier) => {
  const resolvedPath = (await nodeResolve().resolveId(specifier, __filename)).id
  return import(resolvedPath)
}

function prepareEmbeddedWcCode(modulePath, cwd) {
  let newModuleCode
  const moduleCode = fs.readFileSync(path.resolve(cwd, modulePath), 'utf-8')
  const [imports] = esLexerParse(moduleCode)

  for (const importSpec of imports) {
    const specifier = moduleCode.slice(importSpec.s, importSpec.e)
    const importStatement = moduleCode.slice(importSpec.ss, importSpec.se)
    const namedImportMatch = importStatement.match(/import\s+\{(.*)\}/)

    if (namedImportMatch) {
      const namedImports = namedImportMatch[1].split(/\s*,\s*/)
      const importStatementReplacement = `const { ${namedImports.join(
        ', '
      )} } = await window.importModule('${specifier}', window)\n`
      newModuleCode = moduleCode.replace(importStatement, importStatementReplacement)
    }
  }
  return newModuleCode
}

/**
 * @typedef {import("jsdom").JSDOM} JSDOM
 */

/**
 * Render web components within a string of HTML or hast AST tree
 * for the purposes of static site generation (SSG) or server-side
 * rendering (SSR) by injecting serialized declarative shadow roots.
 *
 * @param {string} htmlSource - A string of HTML or hast AST tree
 * @param {string[]} scriptFiles - Paths for ES modules defining the web components used in htmlSource
 * @param {{ cwd: string }} options - Options
 * @returns {JSDOM} - The jsdom.JSDOM instance used for rendering, for potential reuse
 */
async function staticWc(htmlSource, scriptFiles, options = { cwd: process.cwd() }) {
  // TODO: Get this from the htmlSource
  const customElementNames = ['web-component']
  let customElementOcurrences = 2

  await esLexerInit

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
        const moduleCode = prepareEmbeddedWcCode(wcModulePath, options.cwd)
        injectCode =
          injectCode +
          `
          ;(async function(){
            ${moduleCode}
            await customElements.whenDefined('${wcName}')
            window.whenAllDefined.defined('${wcName}')
          })()
        `
        return injectCode
      }, '')}
    })()
    `

  const whenAllDefined = {
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

  whenAllDefined.done.then(function () {
    const containerEl = document.createElement('div')
    containerEl.id = 'container'
    containerEl.innerHTML = htmlSource
    document.body.append(containerEl)
  })

  const startHTML = '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'

  const virtualConsole = new jsdom.VirtualConsole()
  virtualConsole.sendTo(console)

  const dom = new jsdom.JSDOM(startHTML, {
    runScripts: 'dangerously',
    url: 'https://local.dev/',
    virtualConsole: virtualConsole,
    beforeParse(window) {
      window.importModule = importModule
      window.whenAllDefined = whenAllDefined
      window.customElementOcurrences = customElementOcurrences
      window.rendered = function (renderedHTML) {
        console.log(
          stripComments(prettier.format(renderedHTML, { parser: 'html' }), {
            language: 'html',
            preserveNewlines: false,
          }).trim()
        )
        cleanup()
      }
    },
  })

  for (const key of browserGlobals) {
    global[key] = dom.window[key]
  }

  const windowProxy = new Proxy(dom.window, {
    set(obj, prop, value) {
      global[prop] = value
      Reflect.set(obj, prop, value)
      return true
    },
  })

  global.window = windowProxy

  const { document } = dom.window

  const script = document.createElement('script')
  script.textContent = moduleCodeInject
  document.body.append(script)

  /**
   * Remove browser globals added to the node environment
   */
  function cleanup() {
    for (const key of browserGlobals) {
      delete global[key]
    }

    delete global.window
  }

  return dom
}

module.exports = {
  staticWc,
}
