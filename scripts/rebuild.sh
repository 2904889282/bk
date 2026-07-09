#!/bin/bash
set -e
cd /opt/beike

COMPOSE_FILE="ops/sandbox/docker-compose.yml"

echo "=== pulling latest code ==="
git pull

echo "=== rebuilding api image ==="
docker compose -f "$COMPOSE_FILE" build api

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

echo "=== deployed ==="
docker ps --format 'table {{.Names}}\t{{.Status}}'
