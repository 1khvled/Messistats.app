#!/usr/bin/env bash
# Vercel Ignored Build Step (scripts/vercel-ignore-build.sh)
# Exit 0 = Skip/Cancel deployment (saves deployment storage)
# Exit 1 = Proceed with build

echo "==> [Vercel Ignored Build Step] Checking commit..."

# 1. Skip if commit explicitly requests it
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[skip deploy]"* ]] || [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[skip vercel]"* ]]; then
  echo "Commit explicitly skipped Vercel deployment. Cancelling build."
  exit 0
fi

# 2. If commit was created with [skip ci] (e.g. automated bot sync):
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[skip ci]"* ]]; then
  DIFF_BASE="HEAD~1"
  if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ]; then
    DIFF_BASE="$VERCEL_GIT_PREVIOUS_SHA"
  fi

  CHANGED_FILES=$(git diff --name-only "$DIFF_BASE" HEAD 2>/dev/null || true)
  echo "Changed files in commit: $CHANGED_FILES"

  # Filter out trivial watcher logs, state files, and non-production files
  SIGNIFICANT_CHANGES=$(echo "$CHANGED_FILES" | grep -vE "^(public/data/(source-watch|last-check)\.json|\.github/.*|README\.md)$" || true)

  if [ -z "$SIGNIFICANT_CHANGES" ]; then
    echo "Only trivial internal watcher logs changed. Cancelling build to preserve Vercel deployment storage."
    exit 0
  fi
fi

# 3. Otherwise, build as normal
echo "Significant changes detected. Proceeding with deployment build."
exit 1
