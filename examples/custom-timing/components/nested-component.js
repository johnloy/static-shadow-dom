class NestedComponentElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    setTimeout(() => {
      this.update()
    }, 0)
  }

  update() {
    this.shadowRoot.innerHTML = '<p>Nested</p>'
  }
}

customElements.define('nested-component', NestedComponentElement)
