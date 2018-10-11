#!/usr/bin/env node

try {
  require('../dist/aug.js')
} catch (err) {
  console.dir(err)
  process.exit(1)
}
