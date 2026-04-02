#!/bin/bash
# visual-test.sh — Always run visual tests against production
# Prevents recurring failures when dev server isn't running
# Usage: bash scripts/visual-test.sh [--update-snapshots] [other playwright args]
set -e

BASE_URL=https://bigclaw-site.vercel.app

# Quick reachability check (fail fast instead of timeout on login)
if ! curl -sf -o /dev/null --connect-timeout 5 "$BASE_URL"; then
  echo "ERROR: $BASE_URL is unreachable. Cannot run visual tests."
  exit 1
fi

echo "Running visual tests against $BASE_URL"
BASE_URL="$BASE_URL" npx playwright test --project=smoke tests/visual.spec.ts "$@"
