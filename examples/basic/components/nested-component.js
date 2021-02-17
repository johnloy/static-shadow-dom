import { html, LitElement } from 'lit-element'

class NestedComponentElement extends LitElement {
  constructor() {
    super()
    // this.attachShadow({ mode: 'open' })
  }

  render() {
    return html`<p>This is nested!</p>`
  }
}

customElements.define('nested-component', NestedComponentElement)
