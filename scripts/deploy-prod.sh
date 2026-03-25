#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

wait_for_url() {
  url="$1"
  label="$2"
  attempts="${3:-45}"
  delay_seconds="${4:-2}"
  attempt=1

  while [ "$attempt" -le "$attempts" ]; do
    if curl -fsS --max-time 10 "$url" >/dev/null 2>&1; then
      echo "$label is ready"
      return 0
    fi

    echo "Waiting for $label ($attempt/$attempts)..."
    sleep "$delay_seconds"
    attempt=$((attempt + 1))
  done

  echo "$label did not become ready in time"
  docker compose -f docker-compose.prod.yml ps || true
  docker logs --tail 80 lovermemory-web-1 || true
  docker logs --tail 120 lovermemory-api-1 || true
  return 1
}

if [ ! -f .env ]; then
  echo "Missing production .env in $ROOT_DIR"
  exit 1
fi

docker compose -f docker-compose.prod.yml up -d redis minio
docker compose -f docker-compose.prod.yml run --rm minio-init || true
docker compose -f docker-compose.prod.yml up -d --build api worker web

wait_for_url http://127.0.0.1:8080 "web"
wait_for_url http://127.0.0.1:8080/api/session "api session"

docker compose -f docker-compose.prod.yml ps
