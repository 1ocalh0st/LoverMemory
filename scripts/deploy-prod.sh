#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "Missing production .env in $ROOT_DIR"
  exit 1
fi

docker compose -f docker-compose.prod.yml up -d redis minio
docker compose -f docker-compose.prod.yml run --rm minio-init || true
docker compose -f docker-compose.prod.yml up -d --build api worker web

curl -fsS http://127.0.0.1:8080 >/dev/null
curl -fsS http://127.0.0.1:8080/api/session >/dev/null

docker compose -f docker-compose.prod.yml ps
