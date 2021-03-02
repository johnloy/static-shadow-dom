const globals = require('globals')
const jsdom = require('jsdom')
const { SSR_RENDER_METHOD_NAMES } = require('../constants')

/**
 * @external JSDOM
 * @see https://github.com/jsdom/jsdom#basic-usage
 */

/** @typedef {import('jsdom').JSDOM} JSDOM */

const HTML_DOC_WRAPPER =
  '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'

// Keep jsdom's dom around for the duration of the child process
let _dom

const nodeGlobals = Object.getOwnPropertyNames(global)
const browserGlobals = Object.keys(globals.browser).filter((g) => !nodeGlobals.includes(g))

/**
 * Return a new or reused jsdom.JSDOM instance after copying browser globals to Node's `global`.
 *
 * @param {{ decorateWindow: (window: jsdom.window) => void }} options - Jsdom options
 * @returns {JSDOM} - A jsdom.JSDOM instance
 */
function setupDom({ decorateWindow }) {
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

    const origDefine = dom.window.customElements.define
    dom.window.customElements.define = function define(...args) {
      const tagName = args[0]
      if (
        SSR_RENDER_METHOD_NAMES.some(
          (methodName) => typeof args[1].prototype[methodName] === 'function'
        )
      ) {
        dom.window.__bridge__.renderContext.ssrElements.push(tagName)
      }
      dom.window.__bridge__.renderContext.definedElements.push(tagName)

      origDefine.call(this, ...args)
    }

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

module.exports = setupDom
