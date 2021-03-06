const ErrorStackParser = require('error-stack-parser')

class OptionsError extends Error {
  static codes = {
    DEFAULT: 1,
    CLEANUP: 2,
    CWD: 3,
    GET_ELEMENT_PROPERTIES: 4,
    GET_RENDER_FINISHED: 5,
    IMPORT_MAP: 6,
    IMPORT_MAP_PATH: 7,
    NOT_OBJECT: 8,
    PRETTIFY: 9,
    RENDER_ELEMENTS: 10,
    RETURN_AST: 11,
  }

  static #messages = {
    [OptionsError.codes.DEFAULT]: 'One or more options are invalid',
    [OptionsError.codes.CLEANUP]: 'Expected option "cleanup" to be a boolean',
    [OptionsError.codes.CWD]: 'Expected option "cwd" to be a path string',
    [OptionsError.codes.GET_ELEMENT_PROPERTIES]:
      'Expected option "getElementProperties" to be function or path string',
    [OptionsError.codes.GET_RENDER_FINISHED]:
      'Expected option "getRenderFinished" to be a function or path string',
    [OptionsError.codes.IMPORT_MAP]: 'Expected option "importMap" to be a boolean or path string',
    [OptionsError.codes.IMPORT_MAP_PATH]:
      'A file does not exist at the path provided for option "importMap"',
    [OptionsError.codes.NOT_OBJECT]: 'Expected options to be an object',
    [OptionsError.codes.PRETTIFY]: 'Expected option "prettify" to be a boolean',
    [OptionsError.codes.RENDER_ELEMENTS]:
      'Expected option "renderElements" to be an array of strings',
    [OptionsError.codes.RETURN_AST]: 'Expected option "returnAst" to be a boolean',
  }

  constructor(code) {
    super(OptionsError.#messages[code] || OptionsError.#messages[OptionsError.codes.DEFAULT])
    const stackFrames = ErrorStackParser.parse(this)

    if (stackFrames[0].functionName === 'new StaticShadowDom') {
      Object.assign(this, stackFrames[1])
    } else if (stackFrames[1].functionName === 'new StaticShadowDom') {
      Object.assign(this, stackFrames[2])
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OptionsError)
    }

    this.name = 'OptionsError'
  }
}

module.exports = OptionsError
