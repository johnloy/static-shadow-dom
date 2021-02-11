#!/usr/bin/env node

const { readFileSync, writeFileSync } = require('fs')
const { stdin } = require('process')
const path = require('path')

const API_DOCS_RE = /(<!-- api -->\n)[^]*?(\n<!-- \/api -->)/
const readmePath = path.resolve(__dirname, '..', 'README.md')

;(async () => {
  let docs = ''
  for await (const chunk of stdin) {
    docs += chunk
  }

  writeFileSync(readmePath, readFileSync(readmePath, 'utf-8').replace(API_DOCS_RE, `$1${docs}$2`))
})()
