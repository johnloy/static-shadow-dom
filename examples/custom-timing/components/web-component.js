import { html, LitElement, css } from 'lit-element'

const sharedCssResult = css`
  p {
    color: blue;
  }
`

class WebComponentElement extends LitElement {
  static get criticalStyles() {
    return [
      sharedCssResult,
      css`
        ::slotted(h1) {
          color: red;
        }
      `,
    ]
  }

  static get styles() {
    return [
      sharedCssResult,
      css`
        h2 {
          color: green;
        }
      `,
    ]
  }

  render() {
    return html`
      <style>
        .foo {
          color: pink;
        }
      </style>
      <slot></slot>
      <div>
        <p>${this.getAttribute('foo')}!</p>
      </div>
    `
  }
}

customElements.define('web-component', WebComponentElement)
