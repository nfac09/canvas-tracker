#!/usr/bin/env bash
# Canvas Tracker — release helper
#
# Usage:
#   npm run release          # patch: 1.0.0 → 1.0.1
#   npm run release:minor    # minor: 1.0.0 → 1.1.0
#   npm run release:major    # major: 1.0.0 → 2.0.0
#
# What this does:
#   1. Bumps the version in package.json
#   2. Creates a git commit: "chore: release vX.Y.Z"
#   3. Creates a git tag: vX.Y.Z
#   4. Pushes the commit and tag to GitHub
#   5. GitHub Actions picks up the tag and builds the release automatically

set -e  # exit immediately on any error

BUMP=${1:-patch}

# Validate bump type
if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Error: invalid bump type '$BUMP'. Use patch, minor, or major."
  exit 1
fi

# Make sure working directory is clean
if [[ -n $(git status --porcelain) ]]; then
  echo "Error: working directory has uncommitted changes. Commit or stash them first."
  git status --short
  exit 1
fi

# Make sure we're on main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "Warning: you are on branch '$BRANCH', not 'main'."
  read -p "Continue anyway? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "→ Bumping $BUMP version..."
npm version "$BUMP" -m "chore: release v%s"

NEW_VERSION=$(node -p "require('./package.json').version")
echo "→ Version is now v$NEW_VERSION"

echo "→ Pushing commit and tag to GitHub..."
git push
git push --tags

echo ""
echo "✓ Release v$NEW_VERSION triggered."
echo "  GitHub Actions is building macOS (.dmg) and Windows (.exe) in parallel."
echo "  Track progress: https://github.com/nfac09/canvas-tracker/actions"
echo "  Release page:   https://github.com/nfac09/canvas-tracker/releases"
