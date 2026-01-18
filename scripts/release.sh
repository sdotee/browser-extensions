#!/bin/bash
set -e

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "Building release v${VERSION}..."

# Clean previous builds
rm -rf .output
mkdir -p .output/release

# Build Chrome extension
echo "Building Chrome extension..."
bun run build

# Build Firefox extension
echo "Building Firefox extension..."
bun run build:firefox

# Package Chrome extension (.zip)
echo "Packaging Chrome extension..."
cd .output/chrome-mv3
zip -r ../release/see-extension-chrome-v${VERSION}.zip .
cd ../..

# Package Firefox extension (.xpi)
echo "Packaging Firefox extension..."
cd .output/firefox-mv2
zip -r ../release/see-extension-firefox-v${VERSION}.xpi .
cd ../..

# Package source code
echo "Packaging source code..."
zip -r .output/release/see-extension-source-v${VERSION}.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".output/*" \
  -x "*.zip" \
  -x "*.xpi" \
  -x ".vscode/*" \
  -x ".idea/*" \
  -x ".DS_Store"

# Generate SHA-256 checksums
echo "Generating checksums..."
cd .output/release
sha256sum see-extension-chrome-v${VERSION}.zip > see-extension-chrome-v${VERSION}.zip.sha256
sha256sum see-extension-firefox-v${VERSION}.xpi > see-extension-firefox-v${VERSION}.xpi.sha256
sha256sum see-extension-source-v${VERSION}.zip > see-extension-source-v${VERSION}.zip.sha256
cd ../..

echo ""
echo "Release v${VERSION} built successfully!"
echo "Files created in .output/release/:"
ls -la .output/release/
