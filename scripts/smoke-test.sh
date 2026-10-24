#!/usr/bin/env bash
# Quick end-to-end check of a running deployment.
# Usage: bash scripts/smoke-test.sh [base-url]     (default http://localhost)
set -euo pipefail

BASE="${1:-http://localhost}"
json() { node -pe "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); $1"; }

echo "1/5 waiting for the gateway..."
for i in $(seq 1 40); do
  if curl -fsS "$BASE/api/health" >/dev/null 2>&1; then break; fi
  [ "$i" -eq 40 ] && { echo "gateway never became healthy"; exit 1; }
  sleep 3
done

echo "2/5 registering a user"
EMAIL="smoke-$(date +%s)@example.com"
RESP=$(curl -s -w '\n%{http_code}' -X POST "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"smoke-test-pw1\"}")
STATUS=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$STATUS" != "201" ]; then
  echo "register failed with HTTP $STATUS"
  echo "$BODY"
  exit 1
fi
TOKEN=$(echo "$BODY" | json 'd.token')
[ -n "$TOKEN" ] || { echo "no token returned"; exit 1; }

echo "3/5 rejecting a request without a token"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/boards")
[ "$CODE" = "401" ] || { echo "expected 401, got $CODE"; exit 1; }

echo "4/5 creating a board"
BOARD=$(curl -fsS -X POST "$BASE/api/boards" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Smoke board"}')
ID=$(echo "$BOARD" | json 'd.id')

echo "5/5 loading the board with its default lists"
DETAIL=$(curl -fsS "$BASE/api/boards/$ID" -H "Authorization: Bearer $TOKEN")
COUNT=$(echo "$DETAIL" | json 'd.lists.length')
[ "$COUNT" = "3" ] || { echo "expected 3 lists, got $COUNT"; exit 1; }

echo "smoke test passed"
