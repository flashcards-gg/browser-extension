#!/bin/bash
# Mac App Store build of "Flashcards.gg for Safari" → safari/build/pkg/*.pkg
#
# Builds dist/safari (production API — refuses a FCGG_API_BASE dev build),
# bumps safari/BUILD_NUMBER, takes the version from package.json, then archives
# FlashcardsSafari.xcodeproj and exports a Mac App Store package
# (ExportOptions.plist). Upload is a separate, confirmed step:
#   xcrun altool --upload-app -t macos -f safari/build/pkg/*.pkg \
#     --apiKey <ASC_KEY_ID> --apiIssuer <ASC_ISSUER_ID>
set -euo pipefail

SAFARI_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SAFARI_DIR")"
cd "$ROOT"

if [ -n "${FCGG_API_BASE:-}" ]; then
  echo "FCGG_API_BASE is set — that is a dev build, not for the App Store." >&2
  exit 1
fi

npm run --silent build:safari
if grep -q 'localhost' dist/safari/manifest.json dist/safari/*.js; then
  echo "dist/safari mentions localhost — not a store build." >&2
  exit 1
fi

VERSION=$(node -p "require('./package.json').version")
BUILD=$(( $(tr -d '[:space:]' < "$SAFARI_DIR/BUILD_NUMBER") + 1 ))
echo "$BUILD" > "$SAFARI_DIR/BUILD_NUMBER"
echo "Flashcards.gg for Safari $VERSION ($BUILD)"

OUT="$SAFARI_DIR/build"
ARCHIVE="$OUT/FlashcardsSafari.xcarchive"
rm -rf "$OUT"

xcodebuild -quiet -allowProvisioningUpdates \
  -project "$SAFARI_DIR/FlashcardsSafari.xcodeproj" -scheme "Flashcards.gg for Safari" \
  -configuration Release -destination 'generic/platform=macOS' \
  -archivePath "$ARCHIVE" \
  MARKETING_VERSION="$VERSION" CURRENT_PROJECT_VERSION="$BUILD" \
  archive

xcodebuild -quiet -allowProvisioningUpdates \
  -exportArchive -archivePath "$ARCHIVE" \
  -exportOptionsPlist "$SAFARI_DIR/ExportOptions.plist" \
  -exportPath "$OUT/pkg"

echo "Package: $(ls "$OUT"/pkg/*.pkg)"
