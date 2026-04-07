#!/bin/bash
# Pre-push test gate — blocks git push if tests fail
# Called from .claude/settings.json PreToolUse hook

set -euo pipefail

CMD=$(echo "$CLAUDE_TOOL_INPUT" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("command",""))' 2>/dev/null)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# 1. Block production Vercel deploys
if echo "$CMD" | grep -qE 'vercel\s+--prod|vercel\s+deploy\s+--prod'; then
  echo '{"decision":"block","reason":"BLOCKED: Production deploy requires preview verification first. Run: vercel deploy (without --prod), verify preview URL, then promote."}'
  exit 0
fi

# 2. Block direct push to main
if echo "$CMD" | grep -qE 'git push.*(origin|upstream)\s+main'; then
  echo '{"decision":"block","reason":"BLOCKED: Never push directly to main. Use feature branch + PR."}'
  exit 0
fi

# 3. Pre-push test gate — run checks before any push
if echo "$CMD" | grep -qE 'git push'; then
  echo "=== Pre-push QA Gate ==="
  ERRORS=""

  # TypeScript check
  echo "[1/3] TypeScript type check..."
  TSC_OUT=$(cd "$PROJECT_DIR" && npx tsc --noEmit 2>&1) || ERRORS="$ERRORS\n[bigclaw-site] TypeScript errors:\n$(echo "$TSC_OUT" | tail -10)"

  # Next.js build
  echo "[2/3] Next.js build..."
  BUILD_OUT=$(cd "$PROJECT_DIR" && npx next build 2>&1) || ERRORS="$ERRORS\n[bigclaw-site] Build failed:\n$(echo "$BUILD_OUT" | tail -10)"

  # Playwright smoke tests (against production)
  echo "[3/3] Playwright smoke tests (against production)..."
  TEST_OUT=$(cd "$PROJECT_DIR" && BASE_URL=https://bigclaw-site.vercel.app npx playwright test --project=smoke 2>&1) || ERRORS="$ERRORS\n[bigclaw-site] Smoke tests failed:\n$(echo "$TEST_OUT" | tail -20)"

  if [ -n "$ERRORS" ]; then
    echo -e "$ERRORS"
    echo '{"decision":"block","reason":"BLOCKED: Browser smoke tests failed. Fix before pushing."}'
    exit 0
  fi

  echo "=== All gates passed. Push allowed. ==="
  echo '{"decision":"allow"}'
  exit 0
fi

# Not a push command — allow
echo '{"decision":"allow"}'
