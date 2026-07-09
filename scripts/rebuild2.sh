#!/bin/bash
set -e
cd /opt/beike

COMPOSE_FILE="ops/sandbox/docker-compose.yml"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "=== pulling latest code ==="
git pull

echo "=== backup current images ==="
docker tag beike-platform-api:latest beike-platform-api:backup-$TIMESTAMP 2>/dev/null && echo "backup: beike-platform-api:backup-$TIMESTAMP" || echo "no previous api image"
docker tag beike-platform-web:latest beike-platform-web:backup-$TIMESTAMP 2>/dev/null && echo "backup: beike-platform-web:backup-$TIMESTAMP" || echo "no previous web image"

echo "=== rebuilding api image ==="
docker compose -f "$COMPOSE_FILE" build api

echo "=== rebuilding web image ==="
docker compose -f "$COMPOSE_FILE" build --no-cache web

echo "=== restarting services ==="
docker compose -f "$COMPOSE_FILE" up -d

echo "=== waiting for api to be healthy ==="
for i in $(seq 1 30); do
  if docker exec beike-sandbox-api python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/api/health')" 2>/dev/null; then
    echo "api is healthy"
    break
  fi
  echo "waiting... ($i/30)"
  sleep 2
done

echo "=== post-deploy check ==="
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/api/health --connect-timeout 5)
echo "health endpoint: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" != "200" ]; then
  echo "WARNING: health check returned $HTTP_CODE, expected 200"
fi

echo "=== deployed ==="
docker ps --format 'table {{.Names}}\t{{.Status}}'
