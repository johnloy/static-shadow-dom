const { isSSRCustomElement, getSSRAttribute, getElementProperties } = require('../helpers')
const { SSR_ELEMENT_ATTRIBUTE_NAMES } = require('../constants')

async function renderDsdTemplates(el, window) {
  const bridge = window.__bridge__
  try {
    if (isSSRCustomElement(window, el)) {
      const properties = getElementProperties(el, window)
      Object.assign(el, properties)
    }

    await Promise.resolve()

    const nestedCustomElements = el.shadowRoot.querySelectorAll(
      `${bridge.renderContext.ssrElements.join(',')}, ${SSR_ELEMENT_ATTRIBUTE_NAMES.map(
        (name) => `[${name}]`
      ).join(',')}`
    )

    if (nestedCustomElements.length) {
      await Promise.all(
        Array.from(nestedCustomElements).map(async (el) => await renderDsdTemplates(el, window))
      )
    }

    if (isSSRCustomElement(window, el)) {
      el.insertAdjacentHTML(
        'afterbegin',
        `
          <template shadowroot="open">
          ${el.shadowRoot.innerHTML}
          </template>
        `
      )

      const ssrAttribute = getSSRAttribute(el)
      if (ssrAttribute) {
        el.removeAttribute(ssrAttribute)
      }
    }
  } catch (error) {
    // TODO: Handle errors
  }
}

module.exports = renderDsdTemplates
