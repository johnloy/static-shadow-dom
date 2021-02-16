const childProcess = require('child_process')
const unistUtilIs = require('unist-util-is')
const path = require('path')

/**
 * @typedef {Object} Options - [StaticShadowDom#render()]{@link StaticShadowDom#render} options
 * @property {string} cwd - Current working directory from which provided script paths should be resolved
 * @property {boolean} cleanup - Whether to automatically clean the renderer child process
 * @property {string} containerElId - The ID of the container DOM element used for rendering the
 * @property {boolean | string} - Whether to use an import map to augment module imports resolution
 *   HTML fragment
 */

/**
 * @typedef {Object} RenderResult - An object containing data about the hydration result, including
 *   the HTML string
 * @property {string} html - The transformed HTML fragment, as string
 */

const DEFAULT_CONTAINER_EL_ID = 'container'

const DEFAULT_OPTIONS = {
  cwd: process.cwd(),
  cleanup: true,
  containerElId: DEFAULT_CONTAINER_EL_ID,
  importMap: false,
}

/** Creates a child process used for rendering */
class StaticShadowDom {
  /** @param {Options} options - Options */
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }

    let importMapPath =
      typeof options.importMap === 'string'
        ? options.importMap
        : options.importMap === true
        ? path.join(options.cwd, 'static-shadow-dom.importmap')
        : undefined

    if (importMapPath && !path.isAbsolute(importMapPath)) {
      importMapPath = path.resolve(options.cwd, importMapPath)
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
    }
  }

  cleanup() {
    this.rendererProcess.disconnect()
  }

  /**
   * Render the ShadowDOM
   *
   * @param {string} html - Html string
   * @param {string[]} scripts - Array of scripts
   * @param {Options} userOptions - Options
   * @returns {Promise<RenderResult>} - Render result
   */
  async render(html, scripts, userOptions = {}) {
    this.options = { ...this.options, ...userOptions }

    if (!this.rendererProcess.connected) {
      throw new Error('the renderer has been disconnected')
    }

    if (typeof html !== 'string' && !unistUtilIs(html)) {
      this.cleanup()
      this.rendererProcess.kill()
      throw new TypeError('Expected a string or hast AST for first argument (html source)')
    }

    await this.#rendererReady

    this.rendererProcess.once('message', this.#onRendererMessage.bind(this))

    return new Promise((done) => {
      this.doneCallback = done
      this.rendererProcess.send({
        type: 'render',
        html,
        scripts,
        options: this.options,
      })
    })
  }
}

module.exports = StaticShadowDom
