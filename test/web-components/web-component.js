import { html, LitElement } from 'lit-element'
import './nested-component.js'

class WebComponentElement extends LitElement {
  constructor() {
    super()
  }

  render() {
    return html`
      <slot></slot>
      <div>
        <nested-component></nested-component>
        <p>${this.getAttribute('foo')}!</p>
      </div>
    `
  }
}

customElements.define('web-component', WebComponentElement)
