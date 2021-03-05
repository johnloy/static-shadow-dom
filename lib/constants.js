const DEFAULT_CONTAINER_EL_ID = 'static-shadow-dom'

const DEFAULT_OPTIONS = {
  cwd: process.cwd(),
  cleanup: true,
  containerElId: DEFAULT_CONTAINER_EL_ID,
  importMap: false,
  elements: [],
  getElementProperties: undefined,
  data: {},
}

const SSR_RENDER_METHOD_NAMES = [
  // Proposed at https://github.com/webcomponents/community-protocols/issues/7
  'render_ssr',

  // Logical variants
  'renderSSR',
  'renderServer',
  'render_static',
  'renderStatic',
  'renderSSG',
]

const SSR_ELEMENT_ATTRIBUTE_NAMES = ['ssr', 'server', 'ssg', 'static']

module.exports = {
  DEFAULT_CONTAINER_EL_ID,
  DEFAULT_OPTIONS,
  SSR_RENDER_METHOD_NAMES,
  SSR_ELEMENT_ATTRIBUTE_NAMES,
}
