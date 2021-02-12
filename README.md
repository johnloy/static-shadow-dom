# hydrate-wc

Transform/render custom elements in an HTML string or [hast AST](https://github.com/syntax-tree/hast) to include a [declarative shadow DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) `<template>` node for use in static site generation (SSG) and server-side rendering (SSR).

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
import { hydrateWc } from '@drstrangediv/static-wc'

const htmlStr = `
  <my-component>
   <p>Hello!</p> 
  </my-component>
`

// Relative to `cwd` option
const scripts = ['./src/components/my-component.js']

;(async () => {
  const { dom, html, ast } = await hydrateWc(htmlStr, scripts, {
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
<dt><a href="#hydrateWc">hydrateWc(htmlSource, scriptFiles, [userOptions])</a> ⇒ <code>Promise.&lt;Partial.&lt;HydrationResult&gt;&gt;</code></dt>
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
<dt><a href="#Options">Options</a> : <code>Object</code></dt>
<dd><p><a href="#hydrateWc">hydrateWc()</a> options</p>
</dd>
<dt><a href="#cleanup">cleanup</a> ⇒ <code>void</code></dt>
<dd></dd>
<dt><a href="#HydrationResult">HydrationResult</a> : <code>Object</code></dt>
<dd><p>An object containing data about the hydration result,
  including the HTML string</p>
</dd>
</dl>

<a name="hydrateWc"></a>

### hydrateWc(htmlSource, scriptFiles, [userOptions]) ⇒ <code>Promise.&lt;Partial.&lt;HydrationResult&gt;&gt;</code>

Render the shadowRoot of custom elements in an HTML string or [hast
AST](https://github.com/syntax-tree/hast) to include a [declarative shadow
DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) `<template>` node
for use in static site generation (SSG) and server-side rendering (SSR).

**Kind**: global function  
**Returns**: <code>Promise.&lt;Partial.&lt;HydrationResult&gt;&gt;</code> - - A promise resolving to an object with data about
the hydration result

| Param         | Type                              | Default         | Description                                                         |
| ------------- | --------------------------------- | --------------- | ------------------------------------------------------------------- |
| htmlSource    | <code>string</code>               |                 | A string of HTML or hast AST tree                                   |
| scriptFiles   | <code>Array.&lt;string&gt;</code> |                 | Paths for ES modules defining the web components used in htmlSource |
| [userOptions] | [<code>Options</code>](#Options)  | <code>{}</code> | Options. Default is `{}`                                            |

<a name="JSDOM"></a>

### JSDOM : <code>module:jsdom~JSDOM</code>

**Kind**: global typedef  
<a name="Options"></a>

### Options : <code>Object</code>

[hydrateWc()](#hydrateWc) options

**Kind**: global typedef  
**Properties**

| Name          | Type                 | Description                                                                                          |
| ------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| cwd           | <code>string</code>  | Current working directory from which provided script paths should be resolved                        |
| cleanupDom    | <code>boolean</code> | Whether to automatically clean up browser globals copied to the current Node process `global` object |
| containerElId | <code>string</code>  | The ID of the container DOM element used for rendering the HTML fragment                             |

<a name="cleanup"></a>

### cleanup ⇒ <code>void</code>

**Kind**: global typedef  
<a name="HydrationResult"></a>

### HydrationResult : <code>Object</code>

An object containing data about the hydration result,
including the HTML string

**Kind**: global typedef  
**Properties**

| Name    | Type                             | Description                                                     |
| ------- | -------------------------------- | --------------------------------------------------------------- |
| dom     | <code>JSON</code>                | The jsdom.JSDOM instance used for transformation                |
| html    | <code>string</code>              | The transformed HTML fragment, as string                        |
| cleanup | [<code>cleanup</code>](#cleanup) | A function to remove jsdom browser globals from Node's `global` |

<!-- /api -->

## Contributing

## Authors

## License
