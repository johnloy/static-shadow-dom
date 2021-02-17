const { nodeResolve } = require('@rollup/plugin-node-resolve')
const parse = require('rehype-parse')
const toHtml = require('hast-util-to-html')
const unified = require('unified')

exports.toHast = unified().use(parse, { fragment: true }).parse

exports.toHtml = toHtml

exports.importModule = async function (specifier) {
  let resolvedPath = specifier
  if (!/^[./]/.test(specifier)) {
    resolvedPath = (await nodeResolve().resolveId(specifier, __filename)).id
  }
  return import(resolvedPath)
}
