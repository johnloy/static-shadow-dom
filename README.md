# static-shadow-dom

Transform custom elements in an HTML string or [hast AST](https://github.com/syntax-tree/hast) to include a [declarative shadow DOM](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md) `<template>` first child node, for custom element hydration when using static site generation (SSG) and server-side rendering (SSR).

Learn more about Declarative Shadow DOM:

- [web.dev blog post](https://web.dev/declarative-shadow-dom/)
- [Explainer](https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md)
- [WhatWG discussion](https://github.com/whatwg/dom/issues/831)

### :question: Why would you want to do this?

- **SEO**: A major reason to use SSG and SSR is to provide indexable text in HTML documents. Statically rendering shadow roots can expose text normally only present in the DOM after JS initializes.

- **Avoid FOUC:** In conjunction with inlined critical styles, declarative shadow DOM enables nearly-immediate rendering of a styled shadow DOM. Without this, slow-loading scripts/modules defining custom elements can delay paints producing final styling. 

- **Minimize Cumulative Layout Shift:** One of the new [Web Vitals](https://web.dev/vitals/) user-centric metrics promoted by Google, [Cumulative Layout Shift (CLS)](https://web.dev/cls/) _"...helps quantify how often users experience unexpected layout shifts"_, such as those that might occur because styles are applied after initial page load, causing visual elements to move around (e.g. clickable things). Improving CLS, by the way, has potential to in turn [help with SEO ranking](https://www.searchenginejournal.com/cumulative-layout-shift/) too.

### :information_source: Declarative Shadow DOM requires a polyfill!

While you can currently enable declarative shadow DOM in Chrome by enabling it using an [experimental web platform feature flag](https://web.dev/declarative-shadow-dom/#detection-support), you'll most likely want to include a polyfill in the HTML of all pages using declarative shadow DOM.

```javascript
// Place before the closing </body> tag
document.querySelectorAll('template[shadowroot]').forEach(template => {
  const mode = template.getAttribute('shadowroot');
  const shadowRoot = template.parentNode.attachShadow({ mode });
  shadowRoot.appendChild(template.content);
  template.remove();
});
```

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
    // jsdom.JSDOM object
    dom,
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
### Classes

<dl>
<dt><a href="#StaticShadowDom">StaticShadowDom</a></dt>
<dd><p>Creates a child process used for rendering</p>
</dd>
</dl>

### Typedefs

<dl>
<dt><a href="#Options">Options</a> : <code>Object</code></dt>
<dd><p><a href="#StaticShadowDom+render">StaticShadowDom#render()</a> options</p>
</dd>
<dt><a href="#RenderResult">RenderResult</a> : <code>Object</code></dt>
<dd><p>An object containing data about the hydration result, including
  the HTML string</p>
</dd>
<dt><a href="#JSDOM">JSDOM</a> : <code>module:jsdom~JSDOM</code></dt>
<dd></dd>
<dt><a href="#cleanup">cleanup</a> ⇒ <code>void</code></dt>
<dd></dd>
</dl>

<a name="StaticShadowDom"></a>

### StaticShadowDom
Creates a child process used for rendering

**Kind**: global class  

* [StaticShadowDom](#StaticShadowDom)
    * [new StaticShadowDom(options)](#new_StaticShadowDom_new)
    * [.rendererProcess](#StaticShadowDom+rendererProcess)
    * [.render(html, scripts, userOptions)](#StaticShadowDom+render) ⇒ <code>Promise.&lt;module:StaticShadowDom~RenderResult&gt;</code>

<a name="new_StaticShadowDom_new"></a>

#### new StaticShadowDom(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>module:StaticShadowDom~Options</code> | Options |

<a name="StaticShadowDom+rendererProcess"></a>

#### staticShadowDom.rendererProcess
The Node `child_process` used for rendering.

**Kind**: instance property of [<code>StaticShadowDom</code>](#StaticShadowDom)  
<a name="StaticShadowDom+render"></a>

#### staticShadowDom.render(html, scripts, userOptions) ⇒ <code>Promise.&lt;module:StaticShadowDom~RenderResult&gt;</code>
Render the ShadowDOM

**Kind**: instance method of [<code>StaticShadowDom</code>](#StaticShadowDom)  
**Returns**: <code>Promise.&lt;module:StaticShadowDom~RenderResult&gt;</code> - - Render result  

| Param | Type | Description |
| --- | --- | --- |
| html | <code>string</code> | Html string |
| scripts | <code>Array.&lt;string&gt;</code> | Array of scripts |
| userOptions | <code>module:StaticShadowDom~Options</code> | Options |

<a name="Options"></a>

### Options : <code>Object</code>
[StaticShadowDom#render()](#StaticShadowDom+render) options

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| cwd | <code>string</code> | Current working directory from which provided script paths should be resolved |
| cleanup | <code>boolean</code> | Whether to automatically clean the renderer child process |
| containerElId | <code>string</code> | The ID of the container DOM element used for rendering the   HTML fragment |

<a name="RenderResult"></a>

### RenderResult : <code>Object</code>
An object containing data about the hydration result, including
  the HTML string

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| html | <code>string</code> | The transformed HTML fragment, as string |

<a name="JSDOM"></a>

### JSDOM : <code>module:jsdom~JSDOM</code>
**Kind**: global typedef  
<a name="cleanup"></a>

### cleanup ⇒ <code>void</code>
**Kind**: global typedef  

<!-- /api -->

## Contributing

## Authors

- [John Loy][author]

## License

[MIT][license] © [John Loy][author]

<!-- Definitions -->

[license]: license

[author]: https://github.com/johnloy/