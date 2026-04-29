#!/usr/bin/env bash
# SessionStart hook for Windmill Poker — injects project state into the new session.
# stdout is wrapped as JSON additionalContext; missing files skip their section.

set -u
cd "$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel 2>/dev/null || dirname "$0")" 2>/dev/null

emit_json_context() {
  PYTHONIOENCODING=utf-8 python -c '
import json, sys
text = sys.stdin.read()
print(json.dumps({
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": text
  }
}, ensure_ascii=False))
' 2>/dev/null || cat
}

probe_port() {
  # Returns 0 if a TCP server accepts a connection on localhost:$1, else non-zero.
  (echo > "/dev/tcp/localhost/$1") 2>/dev/null
}

{
  echo "=== Windmill Poker — Session Resume ==="
  echo

  if git rev-parse --git-dir >/dev/null 2>&1; then
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    last=$(git log -1 --oneline 2>/dev/null)
    echo "Branch: ${branch:-?}"
    echo "Last commit: ${last:-?}"
    echo

    status=$(git status --short 2>/dev/null)
    if [ -n "$status" ]; then
      echo "Working tree (git status --short):"
      echo "$status"
    else
      echo "Working tree: clean"
    fi
    echo
  fi

  echo "Visual Companion:"
  newest_session=""
  if [ -d ".superpowers/brainstorm" ]; then
    newest_session=$(ls -1dt .superpowers/brainstorm/*/ 2>/dev/null | head -1)
  fi
  if [ -n "$newest_session" ] && [ -f "${newest_session}state/server-info" ] && [ ! -f "${newest_session}state/server-stopped" ]; then
    url=$(grep -o '"url":"[^"]*"' "${newest_session}state/server-info" 2>/dev/null | head -1 | sed 's/"url":"//;s/"$//')
    port=$(grep -o '"port":[0-9]*' "${newest_session}state/server-info" 2>/dev/null | head -1 | sed 's/"port"://')
    if [ -n "$port" ] && probe_port "$port"; then
      echo "  Status: RUNNING"
      echo "  URL: ${url:-http://localhost:$port}"
      echo "  Session dir: $newest_session"
    else
      echo "  Status: stopped (server-info stale on port ${port:-?}, no listener)"
      echo "  Last session dir: $newest_session"
    fi
  else
    echo "  Status: stopped"
    if [ -n "$newest_session" ]; then
      echo "  Last session dir: $newest_session"
    fi
  fi
  echo

  if [ -f "docs/SESSION_STATE.md" ]; then
    echo "=== docs/SESSION_STATE.md ==="
    cat "docs/SESSION_STATE.md"
  else
    echo "(docs/SESSION_STATE.md not found — no handoff doc from previous session)"
  fi
} | emit_json_context
