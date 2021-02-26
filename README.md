# static-shadow-dom
### 🚨 Not ready for production!

This package is a work in progress, and has not yet been robustly tested for the large variety of scenarios possible when mixing html-inlined scripts, external scripts, and external ES modules. Use at your own risk.

Also, before using, be sure to read about [caveats](#caveats).

---

Transform custom elements in an HTML string or [hast AST](https://github.com/syntax-tree/hast) (if you already have the AST) to include a [declarative shadow DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) (DSD) `<template>` first child node, for custom element hydration when using static site generation (SSG) and server-side rendering (SSR).

In other words...

<details>
  <summary>...HTML like this...</summary>
  
  ```html
  <my-tabs>
    <my-tab
      id="tab-1"
      aria-controls="tab-panel-1">Tab 1</my-tab>
    <my-tab
      id="tab-2"
      aria-controls="tab-panel-2" active>Tab 2</my-tab>
    <my-tab
      id="tab-3"
      aria-controls="tab-panel-2" >Tab 3</my-tab>
    <my-tab-panel
      id="tab-panel-1"
      aria-labelledby="tab-1"><p>Tab panel 1</p></my-tab-panel>
    <my-tab-panel
      id="tab-panel-2"
      aria-labelledby="tab-2" active><p>Tab panel 2</p></my-tab-panel>
    <my-tab-panel 
      id="tab-panel-3"
      aria-labelledby="tab-3"><p>Tab panel 3</p></my-tab-panel>
  </my-tabs>
  ```
  
</details>

<details>
  <summary>...will be transformed to something like this:</summary>

  ```html
  <my-tabs>
    <my-tab id="tab-1" aria-controls="tab-panel-1">
      <template shadowroot="open">
        <button
          role="tab"
          aria-selected="false"
          tabindex="-1"><slot></slot></button>
      </template>
      Tab 1
    </my-tab>
    <my-tab id="tab-2" aria-controls="tab-panel-2">
      <template shadowroot="open">
        <button
          role="tab"
          aria-selected="true"
          tabindex="0"><slot></slot></button>
      </template>
      Tab 2
    </my-tab>
    <my-tab id="tab-3" aria-controls="tab-panel-3">
      <template shadowroot="open">
        <button
          role="tab"
          aria-selected="false"
          tabindex="-1"><slot></slot></button>
      </template>
      Tab 3
    </my-tab>
    <my-tab-panel
      id="tab-panel-1"
      aria-labelledby="tab-1">
      <template shadowroot="open">
        <div role="tabpanel" aria-selected="false">
          <slot></slot>
        </div>
      </template>
      <p>Tab panel 1</p>
    </my-tab-panel>
    <my-tab-panel
      id="tab-panel-2"
      aria-labelledby="tab-2" active>
      <template shadowroot="open">
        <div role="tabpanel" aria-selected="true">
          <slot></slot>
        </div>
      </template>
      <p>Tab panel 2</p>
    </my-tab-panel>
    <my-tab-panel
      id="tab-panel-3"
      aria-labelledby="tab-3">
      <template shadowroot="open">
        <div role="tabpanel" aria-selected="false">
          <slot></slot>
        </div>
      </template>
      <p>Tab panel 3</p>
    </my-tab-panel>
  </my-tabs>
  ```
    
</details>


Learn more about Declarative Shadow DOM:

- [web.dev blog post](https://web.dev/declarative-shadow-dom/)
- [Explainer](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md)
- [WhatWG discussion](https://github.com/whatwg/dom/issues/831)

### :question: Why would you want to do this?

- **Avoid [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content):** In conjunction with inlined critical styles, declarative shadow DOM enables nearly-immediate rendering of a styled shadow DOM. Without this, slow-loading scripts/modules defining custom elements can delay paints producing final styling.

- **SEO**: A major reason to use SSG and SSR is to provide indexable text in HTML documents. Statically rendering shadow roots can expose text normally only present in the DOM after JS initializes.

- **Minimize Cumulative Layout Shift:** One of the new [Web Vitals](https://web.dev/vitals/) user-centric metrics promoted by Google, [Cumulative Layout Shift (CLS)](https://web.dev/cls/) _"...helps quantify how often users experience unexpected layout shifts"_, such as those that might occur because styles are applied after initial page load, causing visual elements to move around (e.g. clickable things). Improving CLS, by the way, has potential to in turn [help with SEO ranking](https://www.searchenginejournal.com/cumulative-layout-shift/) too.

---

## Contents

  - [Install](#install)
  - [Usage](#usage)
    - [Basic](#basic)
    - [Designating elements for static rendering](#designating-elements-for-static-rendering)
    - [Explictly specifying the DSD HTML content](#explictly-specifying-the-dsd-html-content)
    - [Controlling when the shadow DOM is considered rendered](#controlling-when-the-shadow-dom-is-considered-rendered)
    - [Use with LitElement](#use-with-litelement)
    - [Use with an import map](#use-with-an-import-map)
    - [Reuse the renderer child process for multiple renders](#reuse-the-renderer-child-process-for-multiple-renders)
  - [API](#api)
  - [Caveats](#caveats)
  - [Contributing](#contributing)
  - [Authors](#authors)
  - [License](#license)

---

## Install

```sh
npm i -D @johnloy/static-shadow-dom
```

## Usage 

### Basic

```javascript
// my-component.js
class MyComponentElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    // Uh-oh, I won't be in the initial HTML payload!
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
import { StaticShadowDom } from '@johnloy/static-shadow-dom'

const htmlStr = `
  <my-component>
   <p>Hello!</p> 
  </my-component>
`

// Relative to `cwd` option
const scripts = ['./src/components/my-component.js']

;(async () => {
  const renderer = new StaticShadowDom()

  const {
    // string
    html,
    // hast AST object
    ast,
  } = await renderer.render(htmlStr, scripts, {
    // Set the current working directory for resolving:
    // - scripts paths
    // - relative paths in the import-map, if present
    cwd: process.cwd(),

    // Use an import map
    importMap: true,

    // Get back the hast AST tree for further use, if desired
    returnAst: true,

    // Format the html string using Prettier
    prettify: true,
  })

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
  /*
    Prints:
    -------
    {
      type: 'root',
      children: [...]
    }
  */
})()
```

### Designating elements for static rendering

Rendering a declarative shadow DOM doesn't necessarily make sense for every custom element. For example, the light DOM of some custom elements might suffice for the purposes of critical styles for first paint and SEO. Some custom elements might also not even have a visual aspect.

Consequently, you will need to explicitly opt into static rendering of the DSD.

By default, any custom element in the provided HTML source having a `static` boolean attribute will be transformed to include the DSD. This applies as well to custom elements nested in the shadow DOM of top-level `static` elements, and recursively down through DOM descendants.

In cases where an attribute named `static` is already used by a custom element and would conflict with `static-shadow-dom`, you can specificy alternative attribute names in [render options](#options).

```html
<not-rendered></not-rendered>
<is-rendered static></is-rendered>
```

### Explictly specifying the DSD HTML content

### Controlling when the shadow DOM is considered rendered

### Use with LitElement

### Use with an import map

### Reuse the renderer child process for multiple renders

## API

<!-- api -->

<a name="StaticShadowDom"></a>

### `new StaticShadowDom(options) ⇒ staticShadowDom`

Spawn a renderer [child process](https://nodejs.org/api/child_process.html), available at [`StaticShadowDom.rendererProcess`](#staticshadowdom_rendererprocess). Throughout its lifetime, across potentially multiple calls to `staticShadowDom.render()`, it will create and re-use a single [jsdom.JSDOM](https://github.com/jsdom/jsdom#customizing-jsdom) instance.

**Arguments**

- `options` — Default options to use for subsequent calls to `render()`. These same options can be specified à la carte when calling `render()` to override defaults.

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
        <th>Default</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>cwd</th>
        <td><pre>string</pre></td>
        <td>Current working directory from which provided script paths should be resolved. Also used as the current location of the import map, if used, for resolving relative paths within.</td>
        <td>
        <a href="https://nodejs.org/api/process.html#process_process_cwd"><pre language="javascript">process.cwd()</pre></a>
        </td>
      </tr>
      <tr>
        <th>importMap</th>
        <td><pre>boolean|string</pre></td>
        <td>The `id` attribute to use for the root jsdom element inside of which rendering occurs. In most cases, the default shouldn't conflict with elements in source HTML for rendering, but overriding.</td>
        <td>`false`</td>
      </tr>
      <tr>
        <td colspan="4">...[render options](#options)</td>
      </tr>
    </tbody>
  </table>

---

### staticShadowDom.render(<br>&nbsp;&nbsp;&nbsp;&nbsp;html: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;scripts: string[],<br>&nbsp;&nbsp;&nbsp;&nbsp;options: object<br>) ⇒ `Promise<RenderResult>`

Transform the given `html` source to include declarative shadow DOM `<template>` first child nodes in each custom element tag to be statically rendered. 

The `.innerHTML`/`.content` of that node will by default match the content of the `shadowRoot` DocumentFragment at the time of the next execution of the event loop (aka next task) following the host element's connection to the DOM. This allows sufficient time for synchronous manipulations of `shadowRoot` contents using the `connectedCallback()` element lifecycle method.

If an element to be rendered extends LitElement, or simply has an `updateComplete` property returning a promise, then that promise is awaited before the `shadowRoot` contents are read and injected into the declarative shadow DOM `<template>`.

**Arguments**

- `html` — Default options to use for subsequent calls to `render()`. These same options can be specified à la carte when calling `render()` to override defaults.

- `scripts` — Default options to use for subsequent calls to `render()`. These same options can be specified à la carte when calling `render()` to override defaults.

- <a name="options"></a>`options` — Rendering options.

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
        <th>Default</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>cleanup</th>
        <td><pre>boolean</pre></td>
        <td>The `id` attribute to use for the root jsdom element inside of which rendering occurs. In most cases, the default shouldn't conflict with elements in source HTML for rendering, but overriding.</td>
        <td>`true`</td>
      </tr>
      <tr>
        <th>renderBoolAttribute</th>
        <td><pre>string|string[]</pre></td>
        <td>The `id` attribute to use for the root jsdom element inside of which rendering occurs. In most cases, the default shouldn't conflict with elements in source HTML for rendering, but overriding.</td>
        <td>`static`</td>
      </tr>
      <tr>
        <th>returnAst</th>
        <td><pre>boolean</pre></td>
        <td>The `id` attribute to use for the root jsdom element inside of which rendering occurs. In most cases, the default shouldn't conflict with elements in source HTML for rendering, but overriding.</td>
        <td>`false`</td>
      </tr>
      <tr>
        <th>returnStats</th>
        <td><pre>boolean</pre></td>
        <td>The `id` attribute to use for the root jsdom element inside of which rendering occurs. In most cases, the default shouldn't conflict with elements in source HTML for rendering, but overriding.</td>
        <td>`false`</td>
      </tr>
      <tr>
        <th>prettify</th>
        <td><pre>boolean|PrettierConfig</pre></td>
        <td>The `id` attribute to use for the root jsdom element inside of which rendering occurs. In most cases, the default shouldn't conflict with elements in source HTML for rendering, but overriding.</td>
        <td><pre language="javascript">ssd-container</pre></td>
      </tr>
    </tbody>
  </table>


<a name="RenderResult"></a>

#### RenderResult : `Object`

An object containing data about the render result, most importantly the HTML and critical CSS strings.

**Properties**

| Name | Type                | Description                              |
| ---- | ------------------- | ---------------------------------------- |
| html | <code>string</code> | The transformed HTML fragment, as string |

---

<a name="staticshadowdom_rendererprocess"></a>

### staticShadowDom.rendererProcess

The forked Node [child process](https://nodejs.org/api/child_process.html) used for rendering.

---


<!-- /api -->

## Caveats

- In order for ES module imports to work correctly for packages, you (currently) need to either use bare module specifiers and locally install the packages using npm/yarn or use relative url specifiers like `../node_modules/lit-element/lit-element.js` (`.js` extension required)
- YMMV when supplying HTML with a complicated mixture of html-inlined scripts, external scripts, and external ES modules
- This tool depends on [Node.js >= 13 ESM loader hooks](https://nodejs.org/api/esm.html#esm_loaders), which are currently experimental

### :information_source: Declarative Shadow DOM requires a polyfill!

While you can currently enable declarative shadow DOM in Chrome by enabling it using an [experimental web platform feature flag](https://web.dev/declarative-shadow-dom/#detection-support), you'll most likely want to include a polyfill in the HTML of all pages using declarative shadow DOM.

```javascript
// Place before the closing </body> tag
document.querySelectorAll('template[shadowroot]').forEach((template) => {
  const mode = template.getAttribute('shadowroot')
  const shadowRoot = template.parentNode.attachShadow({ mode })
  shadowRoot.appendChild(template.content)
  template.remove()
})
```
## Contributing

## Authors

- [John Loy][author]

## License

[MIT][license] © [John Loy][author]

<!-- Definitions -->

[license]: license
[author]: https://github.com/johnloy/
