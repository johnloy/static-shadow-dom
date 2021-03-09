const path = require('path')
const { RenderError } = require('../errors')

function injectScripts({ options, scripts, htmlSourceMeta, dom }) {
  const { customElementNames } = htmlSourceMeta

  const moduleCodeInject = `
  {
    let bridge
    ;(async function() {
        bridge = window.__bridge__
        const currentScript = document.currentScript

        const QSAO = (await bridge.importModule('qsa-observer')).default

        const renderPromises = []

        function observeConnections() {
          const { observer } = QSAO({
            query: [${customElementNames.map((n) => `'${n}'`).join(',')}],
            async handle(element, connected, selector) {
              const event = connected ? 'connected' : 'disconnected';
              if (event === 'connected') {

                // Wait for LitElement-based elements to render
                // https://lit-element.polymer-project.org/guide/lifecycle#performupdate
                await Promise.resolve()
                bridge.htmlSourceMeta.customElementOcurrences -= 1

                if (element.shadowRoot) {
                  renderPromises.push(
                    bridge.renderDsdTemplates(element, window).then(() => 
                      bridge.extractCriticalCss(element, window))) 
                }

                if (bridge.htmlSourceMeta.customElementOcurrences === 0) {
                  await Promise.all(renderPromises)
                  observer.disconnect()
                  const containerEl = document.getElementById('${options.containerElId}')
                  const htmlStr = containerEl.innerHTML
                  Promise.resolve().then(() => bridge.rendered(htmlStr))

                  // Clean up, in case this dom is reused
                  containerEl.innerHTML = ''
                  currentScript.remove()
                }
              }
            }
          })
        }

        bridge.whenAllDefined.done.then(observeConnections)

        ${scripts.reduce((injectCode, filePath) => {
          const resolvedPath = path.resolve(options.cwd, filePath)
          injectCode = injectCode + `bridge.importModule('${resolvedPath}');`
          return injectCode
        }, '')}

        ${customElementNames.reduce((injectCode, elName) => {
          injectCode =
            injectCode +
            `
              if (customElements.get('${elName}')) {
                bridge.whenAllDefined.defined('${elName}')
              } else {
                await customElements.whenDefined('${elName}')
                bridge.whenAllDefined.defined('${elName}')
              }
          `
          return injectCode
        }, '')}
      })().catch((error) => {
        console.error({ error, type: ${RenderError.codes.SCRIPTS_EXECUTION} })
      })
    }
    `

  const { document } = dom.window
  const script = document.createElement('script')
  script.textContent = moduleCodeInject
  document.body.append(script)
}

module.exports = injectScripts
