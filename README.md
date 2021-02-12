# static-wc

Render the shadowRoot of custom elements in an HTML string or [hast AST](https://github.com/syntax-tree/hast) to include a [declarative shadow DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) `<template>` node for use in static site generation (SSG) and server-side rendering (SSR).

Learn more about Declarative Shadow DOM:
- [web.dev blog post](https://web.dev/declarative-shadow-dom/)
- [Explainer](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md)
- [WhatWG discussion](https://github.com/whatwg/dom/issues/831)

## Examples

```javascript
// my-component.js
class MyComponentElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <p>Hello...</p>
      <slot></slot>
    `
  }
}

customElements.define('my-component', MyComponentElement)
```

```javascript
// A node esm module (cjs also supported) in your build script...
import { staticWc } from '@drstrangediv/static-wc'

const htmlStr = `
  <my-component>
   <p>Hello!</p> 
  </my-component>
`

// Relative to `cwd` option
const scripts = ['./src/components/my-component.js']

;(async () => {
  const { dom, html, ast } = staticWc(htmlStr, scripts, {
    cwd: process.cwd(), // /Users/me/projects/my-website
    cleanupDom: false, // Keep the jsdom.JSDOM for reuse
  })

  console.log(dom)

  console.log(html)
  /*
    Prints:
    -------
    <my-component>
      <template shadowroot="open">
        <p>Hello...</p>
        <slot></slot> 
      </template>
      <p>...world!</p> 
    </my-component>
  */

 console.log(ast)

})()
```

## Install

```sh
npm i -D @drstrangediv/static-wc
```

## Usage

### Use with LitElement
### Reuse the jsdom.JSDOM instance for rendering multiple inputs

## API

<!-- api -->
### Functions

<dl>
<dt><a href="#staticWc">staticWc(htmlSource, scriptFiles, options)</a> ⇒ <code><a href="#JSDOM">JSDOM</a></code></dt>
<dd><p>Render the shadowRoot of custom elements in an HTML string or <a href="https://github.com/syntax-tree/hast">hast
AST</a> to include a <a href="https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md">declarative shadow
DOM</a> <code>&lt;template&gt;</code> node
for use in static site generation (SSG) and server-side rendering (SSR).</p>
</dd>
</dl>

### Typedefs

<dl>
<dt><a href="#JSDOM">JSDOM</a> : <code>module:jsdom~JSDOM</code></dt>
<dd></dd>
</dl>

<a name="staticWc"></a>

### staticWc(htmlSource, scriptFiles, options) ⇒ [<code>JSDOM</code>](#JSDOM)
Render the shadowRoot of custom elements in an HTML string or [hast
AST](https://github.com/syntax-tree/hast) to include a [declarative shadow
DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) `<template>` node
for use in static site generation (SSG) and server-side rendering (SSR).

**Kind**: global function  
**Returns**: [<code>JSDOM</code>](#JSDOM) - The [jsdom.JSDOM](https://github.com/jsdom/jsdom#basic-usage) instance used for rendering, for
  potential reuse  

| Param | Type | Description |
| --- | --- | --- |
| htmlSource | <code>string</code> | A string of HTML or hast AST tree |
| scriptFiles | <code>Array.&lt;string&gt;</code> | Paths for ES modules defining the web components used in htmlSource |
| options | <code>Object</code> | Options |

<a name="staticWc..cleanup"></a>

#### staticWc~cleanup()
Remove browser globals added to the node environment

**Kind**: inner method of [<code>staticWc</code>](#staticWc)  
<a name="JSDOM"></a>

### JSDOM : <code>module:jsdom~JSDOM</code>
**Kind**: global typedef  

<!-- /api -->

## Contributing

## Authors

## License
