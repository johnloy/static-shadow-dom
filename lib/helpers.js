const { BRIDGE_NAME } = require('./constants')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { OptionsError, RenderError } = require('./errors')
const { SSR_RENDER_METHOD_NAMES, SSR_ELEMENT_ATTRIBUTE_NAMES } = require('./constants')
const dotProp = require('dot-prop')
const parse = require('rehype-parse')
const toHtml = require('hast-util-to-html')
const unified = require('unified')

function deserializeJs(jsStr) {
  return eval('(' + jsStr + ')')
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

function getSSRAttribute(el) {
  return el.getAttributeNames().find((attrName) => SSR_ELEMENT_ATTRIBUTE_NAMES.includes(attrName))
}

function hasSSRRenderMethod(el) {
  return SSR_RENDER_METHOD_NAMES.some(
    (methodName) => typeof el.constructor.prototype[methodName] === 'function'
  )
}

async function importModule(renderContext, specifier) {
  let resolvedPath = specifier
  if (!/^[./]/.test(specifier)) {
    resolvedPath = (await nodeResolve().resolveId(specifier, __filename)).id
  }
  let exports
  try {
    exports = await import(resolvedPath)
  } catch (error) {
    // console.log('>>>', error)
    // console.log(new RenderError(RenderError.codes.SCRIPTS_EXECUTION, { originalError: error }))
    renderContext.onRenderFailure(
      new RenderError(RenderError.codes.SCRIPTS_EXECUTION, { originalError: error })
    )
  }
  return exports
}

function isOptionsElement(window, tagName) {
  return (renderContextGet('options.renderElements', window) || []).includes(tagName)
}

// TODO: Memoize this
function isSSRCustomElement(window, el) {
  return !!getSSRAttribute(el) || hasSSRRenderMethod(el) || isOptionsElement(window, el.localName)
}

function renderContextGet(propPath, window) {
  return dotProp.get(window[BRIDGE_NAME].renderContext, propPath)
}

async function toHast(htmlStr) {
  const vfile = await unified()
    .use(parse, {
      fragment: true,
      emitParseErrors: true,
    })
    .use(function collectAstWithErrors() {
      this.Compiler = compiler
      function compiler(tree, vfile) {
        const parseErrorMessage = vfile.messages.find((m) => m.source && m.source === 'parse-error')
        if (parseErrorMessage) {
          const error = new Error('HTML parse error')
          error.vfileMessage = parseErrorMessage
          throw error
        }
        return tree
      }
    })
    .process(htmlStr)
  return vfile.result
}

function validateOptions(options) {
  if (typeof options.cleanup !== 'boolean') {
    throw new OptionsError(OptionsError.codes.CLEANUP)
  }

  if (typeof options.cwd !== 'string') {
    throw new OptionsError(OptionsError.codes.CWD)
  }

  if (
    options.getElementProperties !== undefined &&
    typeof options.getElementProperties !== 'function'
  ) {
    throw new OptionsError(OptionsError.codes.GET_ELEMENT_PROPERTIES)
  }

  if (options.getRenderFinished !== undefined && typeof options.getRenderFinished !== 'function') {
    throw new OptionsError(OptionsError.codes.GET_RENDER_FINISHED)
  }

  if (!['boolean', 'string'].includes(typeof options.importMap)) {
    throw new OptionsError(OptionsError.codes.IMPORT_MAP)
  }

  if (typeof options.prettify !== 'boolean') {
    throw new OptionsError(OptionsError.codes.PRETTIFY)
  }

  if (!Array.isArray(options.renderElements)) {
    throw new OptionsError(OptionsError.codes.RENDER_ELEMENTS)
  }

  if (typeof options.returnAst !== 'boolean') {
    throw new OptionsError(OptionsError.codes.RETURN_AST)
  }
}

module.exports = {
  deserializeJs,
  getElementProperties,
  getRenderReady,
  getSSRAttribute,
  importModule,
  isOptionsElement,
  isSSRCustomElement,
  renderContextGet,
  toHast,
  toHtml,
  validateOptions,
}
