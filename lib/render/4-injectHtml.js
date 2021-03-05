function injectHtml(renderContext, htmlSource) {
  const { options } = renderContext
  let containerEl = document.getElementById(options.containerElId)

  if (!containerEl) {
    containerEl = document.createElement('div')
    containerEl.id = options.containerElId
    document.body.append(containerEl)
  }

  renderContext.renderContainerEl = containerEl
  containerEl.innerHTML = htmlSource
}

module.exports = injectHtml
