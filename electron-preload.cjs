// Canvas Tracker — Electron preload script
// Runs in renderer context with access to Node APIs before the page loads.
// We don't expose any native APIs (the app is entirely localStorage-based),
// but this file exists as a security boundary (contextIsolation: true).
'use strict'

// Nothing to expose — kept for future native integrations (e.g. file export)
