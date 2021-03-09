const render = require('./render')
const { deserializeJs } = require('./helpers')
const { stripIndents } = require('common-tags')

process.on('message', async (message) => {
  try {
    if (message.type === 'render') {
      const { html, scripts, options: serializedOptions } = message

      let options
      try {
        options = deserializeJs(serializedOptions)
      } catch (error) {
        throw new Error(stripIndents`
          A problem occurred calling deserializeJs() on options for the renderer
          ↳︎ ${error}
        `)
      }

      const result = await render(html, scripts, options)

      process.send({
        type: 'done',
        ...result,
      })
    }
  } catch (error) {
    process.send({
      type: 'error',
      error,
    })
    process.exit(1)
  }
})

// Necessary to notify the parent process that this process
// is ready to receive message.
process.send('ready')
