const { toHast } = require('../helpers')
const prettier = require('prettier')

async function processResult(renderContext, doneCallback, resultHtml) {
  const { options, criticalStyles } = renderContext

  let ast

  if (options.returnAst) {
    ast = toHast(resultHtml)
  }

  let html

  // Strip marker comments added by lit-html
  html = resultHtml.replace(/\s*\n?<!--\s*-->(\s*\n?)/g, '$1')

  if (options.prettify) {
    html = prettier.format(html, { parser: 'html', printWidth: 300 })
  }

  const ret = { html, ast, criticalStyles }

  doneCallback(ret)
}

module.exports = processResult
