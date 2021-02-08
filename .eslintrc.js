module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    browser: true,
    es2020: true,
    mocha: true,
    node: true,
  },
  plugins: [
    // Runs Prettier as an ESLint rule and reports differences as individual ESLint issues.
    // https://github.com/prettier/eslint-plugin-prettier
    'prettier',

    'html',
    'markdown',
    'jsdoc',
  ],
  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:jsdoc/recommended',
  ],
  rules: {
    'prettier/prettier': 'error',
  },
  settings: {
    node: {
      extensions: ['.json'],
    },
    jsdoc: {
      /*
       * Fixes eslint-plugin-jsdoc's reports: "Invalid JSDoc tag name "template" jsdoc/check-tag-names"
       * refs: https://github.com/gajus/eslint-plugin-jsdoc#check-tag-names
       */
      mode: 'typescript',
    },
    'html/indent': '+2',
    'html/report-bad-indent': 'error',
  },
}
