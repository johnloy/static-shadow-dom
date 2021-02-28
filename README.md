# static-shadow-dom

### 🚨 Not ready for production!

This package is a work in progress, and has not yet been robustly tested or published to npm.

Also, before using, be sure to read about [caveats](#caveats).

---

Transform custom elements in an HTML fragment to include a [declarative shadow DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) (DSD) `<template>` first child node, for web component hydration following static site generation (SSG) and server-side rendering (SSR).

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
      <button role="tab" aria-selected="false" tabindex="-1"><slot></slot></button>
    </template>
    Tab 1
  </my-tab>
  <my-tab id="tab-2" aria-controls="tab-panel-2">
    <template shadowroot="open">
      <button role="tab" aria-selected="true" tabindex="0"><slot></slot></button>
    </template>
    Tab 2
  </my-tab>
  <my-tab id="tab-3" aria-controls="tab-panel-3">
    <template shadowroot="open">
      <button role="tab" aria-selected="false" tabindex="-1"><slot></slot></button>
    </template>
    Tab 3
  </my-tab>
  <my-tab-panel id="tab-panel-1" aria-labelledby="tab-1">
    <template shadowroot="open">
      <div role="tabpanel" aria-selected="false">
        <slot></slot>
      </div>
    </template>
    <p>Tab panel 1</p>
  </my-tab-panel>
  <my-tab-panel id="tab-panel-2" aria-labelledby="tab-2" active>
    <template shadowroot="open">
      <div role="tabpanel" aria-selected="true">
        <slot></slot>
      </div>
    </template>
    <p>Tab panel 2</p>
  </my-tab-panel>
  <my-tab-panel id="tab-panel-3" aria-labelledby="tab-3">
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

- **Avoid [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content):** In conjunction with inlined critical styles, declarative shadow DOM enables nearly-immediate rendering of a styled shadow DOM. Without this, slow-loading scripts/modules defining custom elements can delay crucial first styled paints.

- **SEO**: A major reason to use SSG and SSR is to provide indexable text in HTML documents to search spiders. Statically rendering shadow roots can expose text normally only present in the DOM after JS initializes.

- **Minimize Cumulative Layout Shift:** One of the new [Web Vitals](https://web.dev/vitals/) user-centric metrics promoted by Google, [Cumulative Layout Shift (CLS)](https://web.dev/cls/) _"...helps quantify how often users experience unexpected layout shifts"_, such as those that might occur because styles are applied after initial page load, causing visual elements to move around (e.g. clickable things). Improving CLS, by the way, has potential to in turn [help with SEO ranking](https://www.searchenginejournal.com/cumulative-layout-shift/) too.

### Features

- Not dependent on a particular [approach or library basis](https://webcomponents.dev/blog/all-the-ways-to-make-a-web-component/) for defining custom elements
- Render the DSD only in custom [elements for which it makes sense](#designating-elements-for-static-rendering) (⚠️ requires explicitly declaring them)
- Recursively render the DSD for nested custom elements (e.g. `<outer-el><inner-el></inner-el></outer-el>`)
- Optionally [control the DSD HTML separately](#explictly-specifying-the-dsd-html-content), rather than using the `innerHTML` of the shadow DOM
- Optionally [control the timing](#controlling-when-the-dsd-html-is-considered-ready) of when the HTML of the DSD is considered ready (learn about the default timing)
- [Extract critical styles](#extract-critical-styles) from custom element classes for inlining in served HTML documents (⚠️ requires explicitly declaring them)

---

## Contents

- [Install](#install)
- [Usage](#usage)
  - [Basic](#basic)
  - [Designating elements for static rendering](#designating-elements-for-static-rendering)
  - [Explictly specifying the DSD HTML content](#explictly-specifying-the-dsd-html-content)
  - [Controlling when the DSD HTML is considered ready](#controlling-when-the-dsd-html-is-considered-ready)
  - [Use with LitElement](#use-with-litelement)
  - [Setting properties on rendered custom elements](#setting-properties-on-rendered-custom-elements)
  - [Extract critical styles](#extract-critical-styles)
  - [Use with an import map](#use-with-an-import-map)
  - [Reuse the renderer child process for multiple renders](#reuse-the-renderer-child-process-for-multiple-renders)
- [API](#api)
- [Caveats](#caveats)
- [Ideas for the future…](#ideas-for-the-future)
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
<details>
  <summary>Details</summary>

  Rendering a declarative shadow DOM doesn't necessarily make sense for every custom element. For example, the light DOM of some custom elements might suffice for the purposes of first paint critical styles and/or SEO. Some custom elements might also not even have a visual aspect.

  Consequently, you need to explicitly opt into static rendering of the DSD when using `static-shadow-dom`.

  By default, any custom element in the provided HTML source having a `static` or `ssr` boolean attribute will be transformed to include the DSD. This applies as well to custom elements nested in the shadow DOM of top-level `static` elements, and recursively down through DOM descendants.

  In cases where an attribute named `static` or `ssr` is already used by a custom element and would conflict with `static-shadow-dom`, you can specificy alternative attribute names via the `optInAttribute` [render option](#options).

  ```html
  <not-rendered></not-rendered>
  <is-rendered static></is-rendered>
  ```

  Additionally, you can supply a list of custom element names, via the `elements` [render option](#options), whose DSD should be rendered. This might be useful in cases where you don't directly control the definition of the custom element.

  ```javascript
  ;(async () => {
    const renderer = new StaticShadowDom()

    const { html } = await renderer.render(html, scripts, {
      // Using https://shoelace.style/components/dropdown
      elements: ['sl-dropdown', 'sl-button', 'sl-menu', 'sl-menu-item', 'sl-menu-divider'],
    })
  })()
  ```
</details>


### Explictly specifying the DSD HTML content

<details>
  <summary>Details</summary>
  
  In some cases, a complex loading skeleton for example, you might want the DSD to render a UI distinct enough from the normal UI produced by the shadow DOM that it makes sense to supply the DSD HTML separately. To do this, define a `renderStatic` static method on the custom element class. The string returned from this will be directly used as the `innerHTML` of the DSD `<template>` for the element.

  ```javascript
  class MyElement extends HTMLElement {
    static renderStatic() {
      return `
        <div class="loading-skeleton">
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
        </div
      `
    }
  }
  ```

  A static method is used, as this allows relatively easy augmentation of existing custom element definitions, for examples those from vendor libraries. Just assign the `renderStatic` method as an _own_ property of the element constructor class.

  ```javascript
  // FancyVendorElement is imported and defined elsewhere…
  FancyVendorElement.renderStatic = function () {
    return `
      <div class="loading-skeleton">
        <div class="item"></div>
        <div class="item"></div>
        <div class="item"></div>
        <div class="item"></div>
      </div
    `
  }
  ```

  Direct support is provided as well for lit-html templates returning a TemplateResult instance. Support for other similar declarative template libraries, like [jtml](https://www.npmjs.com/package/@github/jtml), [lighterhtml](https://github.com/WebReflection/lighterhtml)/[µhtml](https://www.npmjs.com/package/uhtml), and [FAST Element](https://www.fast.design/docs/fast-element/declaring-templates), might be added as well in the future.

  ```javascript
  import { LitElement, html } from 'lit-element'

  class MyElement extends LitElement {
    static renderStatic() {
      return html`
        <div class="loading-skeleton">
          ${Array(4).fill(html`<div class="item"></div>`)}
        </div
      `
    }
  }
  ```
</details>

### Controlling when the DSD HTML is considered ready

<details>
  <summary>Details</summary>
  
  By default, the `shadowRoot.innerHTML` or optional `renderStatic()` string is read and used as the DSD contents for a given custom element instance inside a microtask at the beginning of the next turn of the event loop, aka the next "task", following element connection to the DOM. This is to generally align with the render scheduling strategy used by LitElement. In other words, a bit of time is allowed for the `shadowRoot` to be initially populated with a descendant DOM tree.

  If an element extends LitElement, it will have an `updateComplete` property holding a Promise which will additionally be awaited before `shadowRoot.innerHTML` is read. This ensures the async work LitElement does to produce the first render fully completes.

  If an element does not extend LitElement, as long as it has a similar `updateComplete` Promise property, that will be awaited as well.

  For more fine-grained control of timing, supply a `firstRenderReady()` callback function in render options. This function will be invoked with its `this` context set to the element currently being rendered, as well as a single argument also referencing the element itself. In case there are multiple custom elements whose DSDs are being rendered (likely), use normal conditional control flow constructs (e.g. `if/else`, `switch`) within this callback to schedule specific timings.

  This callback should return a promise, which will be awaited like `updateComplete`, but instead of it in cases where an `updateComplete` property exists on the element. If the callback promise resolves to `false`, however, and the element also has an `updateComplete` property, that will still be awaited as a fallback.

  Use this callback to inspect the element for whatever properties or state help determine initial `shadowRoot/renderStatic()` render completion, and then resolve the returned promise on fulfillment of these conditions. For example, an element might take a `src` attribute referencing a file that needs to be fetched and used to produce the first render.

  **Define a custom element requiring special timing:**
  ```javascript
  class ImgSizeElement extends HTMLElement {
    constructor() {
      super()
      this.sizePromise = fetch(this.getAttribute('src')).then((res) =>
        res.headers.get('content-length')
      )
      this.attachShadow({ mode: 'open' })
    }
    connectedCallback() {
      this.sizePromise.then((size) => {
        this.shadowRoot.innerHTML = `<span>${parseInt(size, 10)} Bytes</span>`
      })
    }
  }

  customElements.define('img-size', ImgSizeElement)
  ```

  **Supply a `firstRenderReady()` callback customizing timing:**
  ```javascript
  const htmlSource = `<img-size src="./images/logo.png"></img-size>`
  const scripts = ['../components/img-size.js']

  ;(async () => {
    const renderer = new StaticShadowDom()

    const { html } = await renderer.render(htmlSource, scripts, {
      async firstRenderReady(el) {
        if (el.localName === 'img-size') {
          await el.sizePromise
          await Promise.resolve() // Allow innerHTML to be appended
        }
      },
    })
  })()
  ```
</details>

### Use with LitElement

<details>
  <summary>Details</summary>
  
  Custom elements extending LitElement render their DSD using `static-shadow-dom` no differently than others, in general, but actually using them in conjunction with DSD in the browser might require special handling.

  LitElement 2.0 automatically attaches a shadowRoot to element instances, which can cause a DOMException when DSD is used for LitElement-based elements in browsers without true support for DSD (those needing a polyfill; all except Chrome with a [feature flag enabled](https://web.dev/declarative-shadow-dom/#detection-support)).

  > Failed to execute 'attachShadow' on 'Element': Shadow root cannot be created on a host which already hosts a shadow tree.

  Browsers with full support for DSD should not raise this exception, in order to maintain backwards compatibility with elements developed prior to the advent of DSD. For other browsers, however, you will need to override LitElement's `createRenderRoot()` instance method definition.

  **Patch the method for all elements extending LitElement:**

  ```javascript
  import { LitElement } from 'lit-element'

  LitElement.prototype.createRenderRoot = function () {
    if (!this.shadowRoot) {
      return this.attachShadow({ mode: 'open' })
    }
    return this.shadowRoot
  }
  ```

  **Use a base element class extending LitElement:**

  ```javascript
  import { LitElement } from 'lit-element'

  class BaseElement extends LitElement {
    createRenderRoot() {
      if (!this.shadowRoot) {
        return this.attachShadow({ mode: 'open' })
      }
      return this.shadowRoot
    }
  }

  class MyElement extends LitElement {
    // No need to override createRenderRoot on a case-by-case basis
  }

  class MyOtherElement extends LitElement {
    // No need to override createRenderRoot on a case-by-case basis
  }
  ```
</details>


### Setting properties on rendered custom elements

<details>
  <summary>Expand</summary>

  Normally, the only way of passing data to custom elements through HTML is declaratively via attributes, and attributes value types are always strings. When performing SSG or SSR, however, it might be convenient to additionally set properties on an element whose values are not just strings. For example, you might want to pass a `props` object, and use that in a way similar to how one might for a React component.

  To do this, supply an `elementProperties()` callback function in render options. This function will be invoked with its `this` context set to the constructor of the element currently being rendered, as well as a single argument also referencing the element constructor. In case there are multiple custom elements whose DSDs are being rendered (likely), use normal conditional control flow constructs (e.g. `if/else`, `switch`) within this callback to set properties appropriate for each.

  This callback _must_ return an object (or `undefined`), the properties of which will be copied to instances of custom elements whose DSDs are to be rendered.

  **Custom element definition:**

  ```javascript
  class MyElement extends HTMLElement {
    // ...
    connectedCallback() {
      // Properties will be set prior to connectedCallback()
      this.shadowRoot.innerHTML = `
        <div>
          ${Array(this.repeat)
            .map(() => `<p>${this.message}</p>`)
            .join('\n')}
        </div>
      `
    }
  }
  ```

  **Providing properties as a data object:**

  ```javascript
  // Below is a super-simplified example. This technique is more appropriate when
  // a complex data structure needs to be used for rendering and it would be
  // cumbersome to pass all the data as attributes.

  // Get this from a database, static site generator, CMS, etc.
  const myElementData = {
    message: 'Luke! Use the platform.',
    repeat: 4,
  }

  ;(async () => {
    const renderer = new StaticShadowDom()

    const { html } = await renderer.render(html, scripts, {
      elementProperties(Ctor) {
        if (Ctor.name === 'MyElement') {
          return myElementData
        }
        return // Other elements get nothin'!!!
      },
    })
  })()
  ```

  **HTML output of `StaticShadowDom#render()`:**

  ```html
  <my-element>
    <template shadowroot="open">
      <div>
        <p>Luke! Use the platform.</p>
        <p>Luke! Use the platform.</p>
        <p>Luke! Use the platform.</p>
        <p>Luke! Use the platform.</p>
      </div>
    </template>
  </my-element>
  <script>
    Object.assign(document.currentScript.previousElementSibling, {
      message: 'Luke! Use the platform.',
      repeat: 4,
    })
  </script>
  ```
</details>

### Extract critical styles

WIP

### Use with an import map

WIP

### Reuse the renderer child process for multiple renders

WIP

**********

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
        <td colspan="4">...<a href="#options">render options</a></td>
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
        <th>optInAttribute</th>
        <td><pre>string|string[]</pre></td>
        <td>The `id` attribute to use for the root jsdom element inside of which rendering occurs. In most cases, the default shouldn't conflict with elements in source HTML for rendering, but overriding.</td>
        <td>`static`</td>
      </tr>
      <tr>
        <th>elements</th>
        <td><pre>string[]</pre></td>
        <td>The `id` attribute to use for the root jsdom element inside of which rendering occurs. In most cases, the default shouldn't conflict with elements in source HTML for rendering, but overriding.</td>
        <td>`static`</td>
      </tr>
      <tr>
        <th>firstRenderReady</th>
        <td><pre>(el: HTMLElement) =><br>  Promise<void|boolean></pre></td>
        <td>The `id` attribute to use for the root jsdom element inside of which rendering occurs. In most cases, the default shouldn't conflict with elements in source HTML for rendering, but overriding.</td>
        <td>`static`</td>
      </tr>
      <tr>
        <th>elementProperties</th>
        <td><pre>(ctor: Function) =><br>  object|undefined</pre></td>
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

### staticShadowDom.rendererProcess

The forked Node [child process](https://nodejs.org/api/child_process.html) used for rendering.

<!-- /api -->

**********

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

## Ideas for the future…

- Support clusters of StaticShadowDom renderer child processes, managed through a resource pool, to enable performant scalable SSR by removing the latency overhead of initializing jsdom

- Explicit support, with test suites, for the most popular custom element definition approaches and base libraries

## Contributing

## Authors

- [John Loy][author]

## License

[MIT][license] © [John Loy][author]

<!-- Definitions -->

[license]: license
[author]: https://github.com/johnloy/
