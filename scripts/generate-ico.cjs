'use strict'
// Converts build-resources/icon.png → build-resources/icon.ico
// Called by scripts/generate-icons.sh

const pngToIco = require('png-to-ico')
const fs = require('fs')

pngToIco('build-resources/icon.png')
  .then((buf) => {
    fs.writeFileSync('build-resources/icon.ico', buf)
    console.log('  ✓ build-resources/icon.ico')
  })
  .catch((err) => {
    console.error('  ✗ Failed to generate icon.ico:', err.message)
    process.exit(1)
  })
