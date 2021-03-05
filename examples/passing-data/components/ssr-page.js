import { html, LitElement } from 'lit-element'
import './ssr-section.js'

class SsrPageElement extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      sections: { type: Array },
    }
  }

  constructor() {
    super()

    this.title = ''
    this.sections = []
  }

  render() {
    return html`
      <h1>${this.title}</h1>
      ${this.sections.map(
        (section, i) =>
          html`<ssr-section
            id=${`section-${i}`}
            sectionTitle=${section.sectionTitle}
            .items=${section.items}
          ></ssr-section>`
      )}
    `
  }
}

customElements.define('ssr-page', SsrPageElement)
