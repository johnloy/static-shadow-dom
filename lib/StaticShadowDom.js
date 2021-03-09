const { DEFAULT_OPTIONS } = require('./constants')
const { OptionsError } = require('./errors')
const { validateOptions } = require('./helpers')
const childProcess = require('child_process')
const path = require('path')
const serializeJs = require('serialize-javascript')
const unistUtilIs = require('unist-util-is')
const fs = require('fs')

/**
 * @typedef {Object} Options - [StaticShadowDom#render()]{@link StaticShadowDom#render} options
 * @property {string} cwd - Current working directory from which provided script paths should be resolved
 * @property {boolean} cleanup - Whether to automatically clean the renderer child process
 * @property {boolean | string} importMap - Whether to use an import map to augment module imports
 *   resolution HTML fragment
 * @property {(
 *   el: HTMLElement,
 *   context: {
 *     data: object
 *     hostElement: HTMLElement
 *     ancestorElements: HTMLElement[]
 *     previousSiblingElements: HTMLElement[]
 *     nextSiblingElements: HTMLElement[]
 *   }
 * ) => object} getElementProperties - Dsfsdf
 */

/**
 * @typedef {Object} RenderResult - An object containing data about the hydration result, including
 *   the HTML string
 * @property {string} html - The transformed HTML fragment, as string
 */

/** Creates a child process used for rendering */
class StaticShadowDom {
  /** @param {any} options - Options */
  constructor(options = {}) {
    if (typeof options !== 'object') {
      throw new OptionsError(OptionsError.codes.NOT_OBJECT)
    }

    this.options = { ...DEFAULT_OPTIONS, ...options }

    validateOptions(this.options)

    let importMapPath =
      typeof options.importMap === 'string'
        ? options.importMap
        : options.importMap === true
        ? path.join(options.cwd, 'static-shadow-dom.importmap')
        : undefined

    if (importMapPath && !path.isAbsolute(importMapPath)) {
      importMapPath = path.resolve(options.cwd, importMapPath)
    }

    if (importMapPath && !fs.existsSync(importMapPath)) {
      throw new OptionsError(OptionsError.codes.IMPORT_MAP_PATH)
    }

    /** The Node `child_process` used for rendering. */
    this.rendererProcess = childProcess.fork(path.resolve(__dirname, './renderer.js'), {
      cwd: options.cwd,
      env: {
        NODE_LOADER_CONFIG: path.join(__dirname, './node-loader.mjs'),
        IMPORT_MAP_PATH: importMapPath,
      },
      execArgv: ['--no-warnings', '--experimental-loader', '@node-loader/core'],
      argv0: 'StaticShadowDom',
      serialization: 'advanced',
    })

    this.rendererProcess.on('exit', (exitCode) => {
      // TODO: Handle child process error/exit
    })

    this.#rendererReady = new Promise((ready) => {
      this.rendererProcess.once('message', ready)
    })
  }

  #rendererReady

  #onRendererMessage(message) {
    if (message.type === 'done') {
      const ret = {
        html: message.html,
        ast: message.ast,
        criticalStyles: message.criticalStyles,
      }

      if (this.options.cleanup) {
        this.cleanup()
      }
      this.doneCallback(ret)
      return
    }
    if (message.type === 'error') {
      this.errorCallback(message.error)
    }
  }

  cleanup() {
    this.rendererProcess.disconnect()
  }

  /**
   * Render declarative shadow DOM <template> nodes for give HTML source.
   *
   * @param {string | import('hast').Root} html - Html string or hast AST
   * @param {string[]} scripts - Array of scripts defining custom elements
   * @param {Options} userOptions - Options
   * @returns {Promise<RenderResult>} - An object with data about the render result
   */
  async render(html, scripts, userOptions = {}) {
    this.options = { ...this.options, ...userOptions }

    // This is necessary to support es2015 object method shorthand when
    // using serializeJs()
    if (this.options.getRenderReady) {
      let getRenderReadyFnStr = this.options.getRenderReady.toString()
      if (!getRenderReadyFnStr.startsWith('function')) {
        getRenderReadyFnStr = `function ${getRenderReadyFnStr}`
        this.options.getRenderReady = eval(`(${getRenderReadyFnStr})`)
      }
    }

    if (!this.rendererProcess.connected) {
      throw new Error('The renderer child process has already been disconnected')
    }

    if (typeof html !== 'string' && !unistUtilIs(html)) {
      this.cleanup()
      this.rendererProcess.kill()
      throw new TypeError('Expected a string or hast AST for first argument (html source)')
    }

    await this.#rendererReady

    this.rendererProcess.once('message', this.#onRendererMessage.bind(this))

    return new Promise((resolve, reject) => {
      this.doneCallback = resolve
      this.errorCallback = reject
      this.rendererProcess.send({
        type: 'render',
        html,
        scripts,
        options: serializeJs(this.options, { unsafe: true }),
      })
    })
  }
}

module.exports = StaticShadowDom
