'use strict'
// electron-builder afterPack hook
// Strips macOS extended attributes (com.apple.provenance) that macOS sets on
// npm-installed Electron binaries. Without this, codesign --options runtime
// refuses to sign the app on macOS 14+ with "detritus not allowed".
//
// This runs after electron-builder copies Electron into the app bundle,
// but before code signing — which is exactly when stripping is needed.

const { execSync } = require('child_process')

exports.default = async function afterPack({ appOutDir }) {
  if (process.platform !== 'darwin') return
  try {
    execSync(`xattr -cr "${appOutDir}"`, { stdio: 'inherit' })
  } catch {
    // Non-fatal — codesign will surface any remaining issues
  }
}
