# Canvas Tracker

A desktop app for students who use Canvas — track assignments, due dates, and grades in one clean view, without living in the browser.

---

## What it does

Canvas Tracker imports your Canvas calendar and organizes everything you have due, overdue, or coming up. You can track grades, manage recurring assignments (like weekly labs or discussions), and see a live semester overview — all stored locally on your device.

---

## Features

- **Import from Canvas** — paste your feed URL or upload an `.ics` export; assignments are pulled in automatically with course grouping
- **Dashboard** — overdue, due today, this week, and upcoming sections at a glance
- **Grade tracking** — record grades per assignment; see weighted GPA estimates per course
- **Recurring patterns** — define weekly templates (labs, discussions, problem sets) that generate assignments automatically
- **Offline-first** — all data is stored on your device; no account required
- **Auto-updates** — the app checks for new versions on launch and notifies you

---

## Download

**[→ Download the latest release](https://github.com/nfac09/canvas-tracker/releases/latest)**

| Platform | File to download |
|---|---|
| Mac with Apple Silicon (M1/M2/M3/M4) | `Canvas Tracker-X.Y.Z-arm64.dmg` |
| Mac with Intel | `Canvas Tracker-X.Y.Z.dmg` |
| Windows 10 / 11 (64-bit) | `Canvas Tracker Setup X.Y.Z.exe` |

---

## Installing

### macOS

1. Open the `.dmg` file
2. Drag **Canvas Tracker** to your Applications folder
3. Launch the app from Applications

**"Apple cannot verify this app" warning**

Because Canvas Tracker is not notarized with an Apple Developer certificate, macOS may block it on first launch. To open it:

1. Go to **System Settings → Privacy & Security**
2. Scroll down — you should see a message about Canvas Tracker being blocked
3. Click **Open Anyway**, then **Open** in the confirmation dialog

Alternatively: right-click (or Control-click) the app in Applications, choose **Open**, then click **Open** in the dialog. You only need to do this once.

---

### Windows

1. Run the `Canvas Tracker Setup X.Y.Z.exe` installer
2. Follow the setup wizard

**"Windows protected your PC" warning**

Because Canvas Tracker is not signed with a paid code-signing certificate, Windows SmartScreen may show a warning. This is normal for independently distributed apps.

To proceed:

1. Click **More info**
2. Click **Run anyway**

The app installs normally after that.

---

## Getting started

### Import from Canvas

The fastest way to get started is to import your Canvas calendar:

1. In Canvas, open the **Calendar**
2. Click the **gear icon** in the top right
3. Choose **Export** to download an `.ics` file — upload it in the app
   — or —
   Choose **Calendar Feed** to copy a URL — paste it in the app

Both methods work. The file upload is the most reliable. Re-importing is safe — duplicates are automatically skipped.

### Add courses manually

If you prefer not to import, go to **Courses** and add them by hand. Then add assignments from the Dashboard or Assignments page.

---

## Updates

Canvas Tracker checks for updates automatically when you launch the app. When a new version is available, you will see a notification. The update downloads in the background and installs the next time you quit and reopen the app.

On macOS, if automatic install does not work, the app will open the releases page so you can download the new `.dmg` manually.

---

## Building from source

Requires Node.js 20+ and npm.

```bash
git clone https://github.com/nfac09/canvas-tracker.git
cd canvas-tracker
npm install
npm run electron:dev          # run in development mode
npm run electron:build:mac    # build macOS .dmg
npm run electron:build:win    # build Windows .exe (run on Windows)
```

See `RELEASE_CHECKLIST.md` for the full release process.
