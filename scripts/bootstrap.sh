#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

# 1. PROJECT_NAME placeholder must not exist in CLAUDE.md
if grep -q '\[PROJECT_NAME\]' CLAUDE.md 2>/dev/null; then
  echo "ERROR: [PROJECT_NAME] placeholder still present in CLAUDE.md" >&2
  ERRORS=$((ERRORS + 1))
fi

# 2. .gitignore must exist
if [ ! -f ".gitignore" ]; then
  echo "ERROR: .gitignore not found at repo root" >&2
  ERRORS=$((ERRORS + 1))
fi

# 3. No real .env files staged
STAGED_ENV=$(git diff --cached --name-only 2>/dev/null | grep -E '(^|/)\.env$' || true)
if [ -n "$STAGED_ENV" ]; then
  echo "ERROR: .env file(s) staged — never commit secrets: $STAGED_ENV" >&2
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "Bootstrap failed with $ERRORS error(s). Fix the issues above before committing." >&2
  exit 1
fi

echo "Bootstrap OK"
