const { stripIndents } = require('common-tags')

class RenderError extends Error {
  static codes = {
    INVALID_HTML_SOURCE_STRING: 0,
    INVALID_HTML_SOURCE_AST: 1,
    SCRIPTS_EXECUTION: 2,
  }

  static #messages = {
    [RenderError.codes.INVALID_HTML_SOURCE_STRING]: ({ rehypeParseError }) =>
      `Invalid HTML source string\n` +
      `↳ ${rehypeParseError.reason}\n` +
      `  line: ${rehypeParseError.line}\n` +
      `  column: ${rehypeParseError.column}\n` +
      `  info: ${rehypeParseError.info}\n`,

    [RenderError.codes.INVALID_HTML_SOURCE_AST]: ({ hastToHtmlError }) =>
      // eslint-disable-next-line prettier/prettier
      `Invalid hast HTML AST source\n` + 
      `↳ ${hastToHtmlError}`,

    [RenderError.codes.SCRIPTS_EXECUTION]: ({ originalError }) =>
      // eslint-disable-next-line prettier/prettier
      `Scripts execution error within JSDOM\n` + 
      `↳ ${originalError}`
  }

  get message() {
    return RenderError.#messages[this.#code](this.#props)
  }

  #code = null
  #props = {}

  constructor(code, props) {
    super()

    this.#code = code
    this.#props = props

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RenderError)
    }

    this.name = 'RenderError'
  }
}

module.exports = RenderError
