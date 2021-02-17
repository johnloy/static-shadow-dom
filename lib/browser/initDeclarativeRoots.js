;(function initDeclarativeShadowRoots(criticalStyles, root) {
  root.querySelectorAll('template[shadowroot]').forEach(template => {
    const mode = template.getAttribute('shadowroot')
    const shadowRoot = template.parentNode.attachShadow({ mode })
    if (template.parentNode.localName in criticalStyles) {
      const criticalStylesEl = document.createElement('style')
      criticalStylesEl.textContent = criticalStyles[template.parentNode.localName]
      shadowRoot.appendChild(criticalStylesEl)
    }
    shadowRoot.appendChild(template.content)
    initDeclarativeShadowRoots(criticalStyles, shadowRoot)
    template.remove()
  })
})(criticalStyles, document);