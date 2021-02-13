const childProcess = require('child_process')

const DEFAULT_CONTAINER_EL_ID = 'container'

const DEFAULT_OPTIONS = {
  cwd: process.cwd(),
  cleanup: true,
  containerElId: DEFAULT_CONTAINER_EL_ID,
  rendererProcess: undefined,
}

function forkedStaticShadow(html, scripts, userOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions }

  const ret = {}

  let rendererProcess
  let cleanup

  if (options.rendererProcess) {
    rendererProcess = options.rendererProcess
  } else {
    rendererProcess = childProcess.fork('./staticShadow.js', {
      cwd: __dirname,
      env: {
        NODE_LOADER_CONFIG: './node-loader.mjs',
      },
      execArgv: ['--no-warnings', '--experimental-loader', '@node-loader/core'],
      argv0: 'staticShadow',
      serialization: 'advanced',
    })
  }

  cleanup = function () {
    rendererProcess.disconnect()
  }

  function render(renderArgs) {
    rendererProcess.send({
      type: 'render',
      ...renderArgs,
    })
  }

  let handleMessage

  function _handleMessage(doneCallback, message, isReusingRenderer) {
    if (message === 'ready') {
      const { rendererProcess, ...restOptions } = options
      render({ html, scripts, options: restOptions, isReusingRenderer })
    }

    if (message.type === 'done') {
      ret.html = message.html

      if (options.cleanup) {
        cleanup()
      } else {
        rendererProcess.off('message', handleMessage)
        ret.cleanup = cleanup
        ret.rendererProcess = rendererProcess
      }

      doneCallback(ret)
    }
  }

  return new Promise((done) => {
    handleMessage = _handleMessage.bind(null, done)
    rendererProcess.on('message', handleMessage)
    if (options.rendererProcess) {
      handleMessage('ready', true)
    }
  })
}

exports.staticShadow = forkedStaticShadow
