const { toHast } = require('../helpers')
const prettier = require('prettier')

async function processResult(renderContext, resultHtml) {
  const { options, criticalStyles, onRenderSuccess, onRenderFailure } = renderContext

  let ast

  if (options.returnAst) {
    ast = await toHast(resultHtml)
  }

  let html

  // Strip marker comments added by lit-html
  html = resultHtml.replace(/\s*\n?<!--\s*-->(\s*\n?)/g, '$1')

  if (options.prettify) {
    html = prettier.format(html, { parser: 'html', printWidth: 300 })
  }

  const ret = { html, ast, criticalStyles }

  onRenderSuccess(ret)
}

module.exports = processResult
