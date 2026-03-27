# Canvas Tracker — Release Checklist

## How to publish a new version

### 1. Make sure your changes are committed and pushed

```bash
git status          # should be clean
git push            # make sure main is up to date on GitHub
```

### 2. Run the release command

```bash
npm run release          # patch:  1.0.0 → 1.0.1  (bug fixes)
npm run release:minor    # minor:  1.0.0 → 1.1.0  (new features)
npm run release:major    # major:  1.0.0 → 2.0.0  (breaking changes)
```

This single command:
- Bumps the version in `package.json`
- Creates a git commit: `chore: release vX.Y.Z`
- Creates a git tag: `vX.Y.Z`
- Pushes the commit and tag to GitHub
- Triggers GitHub Actions automatically

You do **not** need to run `git push` separately.

---

### 3. Watch the build

Open: **https://github.com/nfac09/canvas-tracker/actions**

Two jobs run in parallel (~10–15 min total):
- **Build macOS (.dmg)** — runs on `macos-latest`
- **Build Windows (.exe)** — runs on `windows-latest`

When both succeed, a third job (**Publish release**) converts the draft to a public release automatically.

---

### 4. Verify the release

Open: **https://github.com/nfac09/canvas-tracker/releases**

Confirm these files are attached:

| File | For |
|---|---|
| `Canvas Tracker-X.Y.Z-arm64.dmg` | Mac with Apple Silicon (M1/M2/M3/M4) |
| `Canvas Tracker-X.Y.Z.dmg` | Mac with Intel |
| `Canvas Tracker Setup X.Y.Z.exe` | Windows 64-bit |
| `Canvas Tracker-X.Y.Z-arm64-mac.zip` | Mac (auto-update zip — not for manual install) |
| `Canvas Tracker-X.Y.Z-mac.zip` | Mac (auto-update zip — not for manual install) |
| `latest-mac.yml` | Used by auto-updater — do not share with users |
| `latest.yml` | Used by auto-updater — do not share with users |

---

### 5. Share with users

Send users the direct link to the release:

```
https://github.com/nfac09/canvas-tracker/releases/latest
```

Or link to the specific file for their platform:
- **Mac Apple Silicon** → `Canvas Tracker-X.Y.Z-arm64.dmg`
- **Mac Intel** → `Canvas Tracker-X.Y.Z.dmg`
- **Windows** → `Canvas Tracker Setup X.Y.Z.exe`

---

## Local builds (no publish)

To build locally without uploading to GitHub:

```bash
npm run electron:build:mac   # Mac .dmg → release/
npm run electron:build:win   # Windows .exe → release/  (run on Windows)
```

---

## If a build fails

1. Check the failed job at https://github.com/nfac09/canvas-tracker/actions
2. Fix the issue and run `npm run release:patch` (or whichever bump type is appropriate)
3. The draft release from the failed run can be deleted manually at https://github.com/nfac09/canvas-tracker/releases

---

## Release notes template

When GitHub creates the draft release, add release notes before publishing. Copy and edit this template in the GitHub release body:

```
## What's new

- [Describe the main change]
- [Another change]

---

## Download

| Platform | File |
|---|---|
| Mac — Apple Silicon (M1/M2/M3/M4) | `Canvas Tracker-X.Y.Z-arm64.dmg` |
| Mac — Intel | `Canvas Tracker-X.Y.Z.dmg` |
| Windows 10 / 11 | `Canvas Tracker Setup X.Y.Z.exe` |

**Not sure which Mac you have?**  Apple menu → About This Mac → look for "Apple M" (Silicon) or "Intel" under Chip/Processor.

### macOS install note
macOS may show "Apple cannot verify this app" on first launch.
Go to **System Settings → Privacy & Security → Open Anyway**, or right-click the app → Open.

### Windows install note
Windows may show "Windows protected your PC." Click **More info → Run anyway**.
```

Replace `X.Y.Z` with the actual version number in the download table.

---

## Auto-update behavior

Existing installs check for updates automatically on launch. When a new release is published:
- macOS users are notified and the update downloads in the background
- The update installs when the user quits the app
- No action needed from you beyond publishing the release
