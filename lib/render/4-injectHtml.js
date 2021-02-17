function injectHtml(options, htmlSource) {
  let containerEl = document.getElementById(options.containerElId)

  if (!containerEl) {
    containerEl = document.createElement('div')
    containerEl.id = options.containerElId
    document.body.append(containerEl)
  }

  containerEl.innerHTML = htmlSource
}

module.exports = injectHtml
