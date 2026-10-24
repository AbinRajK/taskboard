#!/usr/bin/env bash
# Quick end-to-end check of a running deployment.
# Usage: bash scripts/smoke-test.sh [base-url]     (default http://localhost)
set -euo pipefail

BASE="${1:-http://localhost}"
STATUS=""
BODY=""

json() { node -pe "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); $1"; }

# call METHOD PATH [JSON_BODY] [TOKEN]
# Sets STATUS and BODY. A service that just became ready can refuse connections for a few
# seconds, which the gateway reports as 502/503/504, so those are retried.
call() {
  local method="$1" path="$2" data="${3:-}" token="${4:-}"
  local args=(-s -w '\n%{http_code}' -X "$method" "$BASE$path")
  if [ -n "$data" ]; then args+=(-H 'Content-Type: application/json' -d "$data"); fi
  if [ -n "$token" ]; then args+=(-H "Authorization: Bearer $token"); fi

  local resp i
  for i in $(seq 1 20); do
    resp=$(curl "${args[@]}" || true)
    STATUS=$(echo "$resp" | tail -n1)
    BODY=$(echo "$resp" | sed '$d')
    case "$STATUS" in
      502|503|504|000)
        echo "  $method $path -> HTTP $STATUS, services still starting (attempt $i), retrying in 3s"
        sleep 3
        ;;
      *) return 0 ;;
    esac
  done
}

expect() {
  if [ "$STATUS" != "$1" ]; then
    echo "$2 failed: expected HTTP $1, got $STATUS"
    echo "$BODY"
    exit 1
  fi
}

echo "1/5 waiting for the gateway..."
for i in $(seq 1 40); do
  if curl -fsS "$BASE/api/health" >/dev/null 2>&1; then break; fi
  [ "$i" -eq 40 ] && { echo "gateway never became healthy"; exit 1; }
  sleep 3
done

echo "2/5 registering a user"
EMAIL="smoke-$(date +%s)@example.com"
call POST /api/auth/register \
  "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"smoke-test-pw1\"}"
expect 201 "register"
TOKEN=$(echo "$BODY" | json 'd.token')
[ -n "$TOKEN" ] || { echo "no token returned"; exit 1; }

echo "3/5 rejecting a request without a token"
call GET /api/boards
expect 401 "unauthenticated request"

echo "4/5 creating a board"
call POST /api/boards '{"title":"Smoke board"}' "$TOKEN"
expect 201 "create board"
ID=$(echo "$BODY" | json 'd.id')

echo "5/5 loading the board with its default lists"
call GET "/api/boards/$ID" "" "$TOKEN"
expect 200 "load board"
COUNT=$(echo "$BODY" | json 'd.lists.length')
[ "$COUNT" = "3" ] || { echo "expected 3 lists, got $COUNT"; exit 1; }

echo "smoke test passed"
