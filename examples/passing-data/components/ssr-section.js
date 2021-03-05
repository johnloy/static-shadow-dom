import { html, LitElement } from 'lit-element'

class SsrSectionElement extends LitElement {
  static get properties() {
    return {
      sectionTitle: { type: String },
      items: { type: Array },
    }
  }

  constructor() {
    super()

    this.sectionTitle = ''
    this.items = []
  }

  // render_ssr() {
  //   return `<p>This is nested</p>`
  // }

  render() {
    return html`
      <section>
        <h2>${this.sectionTitle}</h2>
        <ul>
          ${this.items.map((item) => html` <li>${item}</li> `)}
        </ul>
      </section>
    `
  }
}

customElements.define('ssr-section', SsrSectionElement)
