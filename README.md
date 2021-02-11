# static-wc

Render the shadowRoot of custom elements to static HTML

## Summary

## Install

## Usage

## API
<!-- api -->
### Functions

<dl>
<dt><a href="#staticWc">staticWc(htmlSource, scriptFiles, options)</a> ⇒ <code><a href="#JSDOM">JSDOM</a></code></dt>
<dd><p>Render web components within a string of HTML or hast AST tree
for the purposes of static site generation (SSG) or server-side
rendering (SSR) by injecting serialized declarative shadow roots.</p>
</dd>
</dl>

### Typedefs

<dl>
<dt><a href="#JSDOM">JSDOM</a> : <code>module:jsdom~JSDOM</code></dt>
<dd></dd>
</dl>

<a name="staticWc"></a>

### staticWc(htmlSource, scriptFiles, options) ⇒ [<code>JSDOM</code>](#JSDOM)
Render web components within a string of HTML or hast AST tree
for the purposes of static site generation (SSG) or server-side
rendering (SSR) by injecting serialized declarative shadow roots.

**Kind**: global function  
**Returns**: [<code>JSDOM</code>](#JSDOM) - - The jsdom.JSDOM instance used for rendering, for potential reuse  

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
