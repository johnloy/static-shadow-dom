import './nested-component.js'

class WebComponentElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    this.updateComplete = new Promise((resolve) => {
      setTimeout(() => {
        this.update()
        resolve()
      }, 1000)
    })
  }

  update() {
    this.shadowRoot.innerHTML = `
      <p>Async update</p>
    `
  }
}

customElements.define('web-component', WebComponentElement)
