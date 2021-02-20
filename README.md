# static-shadow-dom

Transform custom elements in an HTML string or [hast AST](https://github.com/syntax-tree/hast) (if you already have the AST) to include a [declarative shadow DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) `<template>` first child node, for custom element hydration when using static site generation (SSG) and server-side rendering (SSR).

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

- **Avoid FOUC:** In conjunction with inlined critical styles, declarative shadow DOM enables nearly-immediate rendering of a styled shadow DOM. Without this, slow-loading scripts/modules defining custom elements can delay paints producing final styling.

- **SEO**: A major reason to use SSG and SSR is to provide indexable text in HTML documents. Statically rendering shadow roots can expose text normally only present in the DOM after JS initializes.

- **Minimize Cumulative Layout Shift:** One of the new [Web Vitals](https://web.dev/vitals/) user-centric metrics promoted by Google, [Cumulative Layout Shift (CLS)](https://web.dev/cls/) _"...helps quantify how often users experience unexpected layout shifts"_, such as those that might occur because styles are applied after initial page load, causing visual elements to move around (e.g. clickable things). Improving CLS, by the way, has potential to in turn [help with SEO ranking](https://www.searchenginejournal.com/cumulative-layout-shift/) too.

### 🚨 Not ready for production!

This package is a work in progress, and has not yet been robustly tested for the large variety of scenarios possible when mixing html-inlined scripts, external scripts, and external ES modules. Use at your own risk.

Also, before using, be sure to read about [caveats](#caveats).


## Examples

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

## Install

```sh
npm i -D @johnloy/static-shadow-dom
```

## API

<!-- api -->

<a name="StaticShadowDom"></a>

#### `new StaticShadowDom(options)`

Creates a child process used for rendering

**Kind**: global class

- [StaticShadowDom](#StaticShadowDom)
  - [new StaticShadowDom(options)](#new_StaticShadowDom_new)
  - [.rendererProcess](#StaticShadowDom+rendererProcess)
  - [.render(html, scripts, userOptions)](#StaticShadowDom+render) ⇒ <code>Promise.&lt;module:StaticShadowDom~RenderResult&gt;</code>

<a name="new_StaticShadowDom_new"></a>

| Param   | Type                                        | Description |
| ------- | ------------------------------------------- | ----------- |
| options | <code>module:StaticShadowDom~Options</code> | Options     |

<a name="StaticShadowDom+rendererProcess"></a>

#### staticShadowDom.rendererProcess

The Node `child_process` used for rendering.

**Kind**: instance property of [<code>StaticShadowDom</code>](#StaticShadowDom)  
<a name="StaticShadowDom+render"></a>

#### staticShadowDom.render(html, scripts, userOptions) ⇒ <code>Promise.&lt;module:StaticShadowDom~RenderResult&gt;</code>

Render the ShadowDOM

**Kind**: instance method of [<code>StaticShadowDom</code>](#StaticShadowDom)  
**Returns**: <code>Promise.&lt;module:StaticShadowDom~RenderResult&gt;</code> - - Render result

| Param       | Type                                        | Description      |
| ----------- | ------------------------------------------- | ---------------- |
| html        | <code>string</code>                         | Html string      |
| scripts     | <code>Array.&lt;string&gt;</code>           | Array of scripts |
| userOptions | <code>module:StaticShadowDom~Options</code> | Options          |

<a name="Options"></a>

### Options : <code>Object</code>

[StaticShadowDom#render()](#StaticShadowDom+render) options

**Kind**: global typedef  
**Properties**

| Name          | Type                 | Description                                                                   |
| ------------- | -------------------- | ----------------------------------------------------------------------------- |
| cwd           | <code>string</code>  | Current working directory from which provided script paths should be resolved |
| cleanup       | <code>boolean</code> | Whether to automatically clean the renderer child process                     |
| containerElId | <code>string</code>  | The ID of the container DOM element used for rendering the HTML fragment      |

<a name="RenderResult"></a>

### RenderResult : <code>Object</code>

An object containing data about the hydration result, including
the HTML string

**Kind**: global typedef  
**Properties**

| Name | Type                | Description                              |
| ---- | ------------------- | ---------------------------------------- |
| html | <code>string</code> | The transformed HTML fragment, as string |

<a name="JSDOM"></a>

### JSDOM : <code>module:jsdom~JSDOM</code>

**Kind**: global typedef  
<a name="cleanup"></a>

### cleanup ⇒ <code>void</code>

**Kind**: global typedef

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
