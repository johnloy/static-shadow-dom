const { nodeResolve } = require('@rollup/plugin-node-resolve')
const parse = require('rehype-parse')
const toHtml = require('hast-util-to-html')
const unified = require('unified')
const { SSR_RENDER_METHOD_NAMES, SSR_ELEMENT_ATTRIBUTE_NAMES } = require('./constants')
const dotProp = require('dot-prop')

const toHast = unified().use(parse, { fragment: true }).parse

const BRIDGE_NAME = '__bridge__'

function renderContextGet(propPath, window) {
  // console.log('>>> ', window[BRIDGE_NAME].renderContext)
  return dotProp.get(window[BRIDGE_NAME].renderContext, propPath)
}

async function importModule(specifier) {
  let resolvedPath = specifier
  if (!/^[./]/.test(specifier)) {
    resolvedPath = (await nodeResolve().resolveId(specifier, __filename)).id
  }
  return import(resolvedPath)
}

function getSSRAttribute(el) {
  return el.getAttributeNames().find((attrName) => SSR_ELEMENT_ATTRIBUTE_NAMES.includes(attrName))
}

function hasSSRRenderMethod(el) {
  return SSR_RENDER_METHOD_NAMES.some(
    (methodName) => typeof el.constructor.prototype[methodName] === 'function'
  )
}

function getElementProperties(el, window) {
  const optionsFn = renderContextGet('options.getElementProperties', window)

  if (!optionsFn) return

  if (optionsFn && typeof optionsFn !== 'function') {
    throw new Error('Expected a geteElementProperties option of type Function')
  }

  const renderContainerEl = renderContextGet('renderContainerEl', window)
  const data = renderContextGet('options.data', window)

  const ancestorElements = [
    ...(function* (e) {
      while ((e = e.parentElement)) {
        yield e
      }
    })(el),
  ]

  let hostElement
  let siblingElements = []

  if (ancestorElements.length) {
    const topmostAncestor = ancestorElements[ancestorElements.length - 1]
    const maybeShadowRoot = topmostAncestor.getRootNode()

    hostElement = maybeShadowRoot.host || renderContainerEl

    const s = [...ancestorElements[0].children]
    siblingElements = [s.slice(0, s.indexOf(el)), s.slice(s.indexOf(el) + 1)]
  }

  return optionsFn(el, {
    data,
    ancestorElements,
    hostElement,
    previousSiblingElements: siblingElements[0],
    nextSiblingElements: siblingElements[1],
  })
}

function getRenderReady(el, window) {
  const optionsFn = renderContextGet('options.getRenderReady', window)

  if (!optionsFn) return

  if (optionsFn && typeof optionsFn !== 'function') {
    throw new Error('Expected a getRenderReady option of type Function')
  }

  return optionsFn(el)
}

function isOptionsElement(window, tagName) {
  return (renderContextGet('options.elements', window) || []).includes(tagName)
}

// TODO: Memoize this
function isSSRCustomElement(window, el) {
  return !!getSSRAttribute(el) || hasSSRRenderMethod(el) || isOptionsElement(window, el.localName)
}

function deserializeJs(jsStr) {
  return eval('(' + jsStr + ')')
}

module.exports = {
  toHast,
  toHtml,
  importModule,
  isSSRCustomElement,
  getSSRAttribute,
  renderContextGet,
  getElementProperties,
  deserializeJs,
  isOptionsElement,
  getRenderReady,
}
