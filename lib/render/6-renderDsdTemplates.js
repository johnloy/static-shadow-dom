async function renderDsdTemplates(el, window) {
  const bridge = window.__bridge__
  try {
    await Promise.resolve()
    const nestedCustomElements = el.shadowRoot.querySelectorAll(
      bridge.renderContext.definedElements.join(',')
    )
    if (nestedCustomElements.length) {
      await Promise.all(
        Array.from(nestedCustomElements).map(async (el) => await renderDsdTemplates(el, window))
      )
    }
    el.insertAdjacentHTML(
      'afterbegin',
      `
        <template shadowroot="open">
        ${el.shadowRoot.innerHTML}
        </template>
      `
    )
  } catch (error) {
    // TODO: Handle errors
  }
}

module.exports = renderDsdTemplates
