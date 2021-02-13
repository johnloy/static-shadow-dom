// import * as importMapLoader from '@node-loader/import-maps'

const mainModule = new URL('./staticShadow.js', import.meta.url).href

const forceESMLoader = {
  async getFormat(url, context, defaultGetFormat) {
    if (url !== mainModule) {
      return {
        format: 'module',
      }
    }
    return defaultGetFormat(url, context, defaultGetFormat)
  },
}

export default {
  loaders: [forceESMLoader],
}
