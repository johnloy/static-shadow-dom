const render = require('./render')
const { deserializeJs } = require('./helpers')

process.on('message', async (message) => {
  if (message.type === 'render') {
    const { html, scripts, options } = message

    const result = await render(html, scripts, deserializeJs(options))

    process.send({
      type: 'done',
      ...result,
    })
  }
})

// Necessary to notify the parent process that this process
// is ready to receive message.
process.send('ready')
