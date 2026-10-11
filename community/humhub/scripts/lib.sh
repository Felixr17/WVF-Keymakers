#!/usr/bin/env bash
# Shared helpers for the Keymakers HumHub pilot scripts.
set -euo pipefail

HUMHUB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HUMHUB_DIR"

die() { echo "ERROR: $*" >&2; exit 1; }

env_value() {
  local key="$1"
  [ -f .env ] || die ".env missing. Copy .env.example to .env and run scripts/generate-secrets.sh"
  grep -E "^${key}=" .env | tail -1 | cut -d= -f2- | sed -e "s/^['\"]//" -e "s/['\"]$//"
}

require_local() {
  [ "$(env_value HUMHUB_PILOT_ENV)" = "local" ] || die "local-only command: set HUMHUB_PILOT_ENV=local in .env"
  case "$(env_value HUMHUB_SERVER_NAME)" in
    https://localhost|https://localhost:*|https://127.0.0.1|https://127.0.0.1:*) ;;
    *) die "local-only command: HUMHUB_SERVER_NAME must be https://localhost" ;;
  esac
}

compose() { docker compose "$@"; }

yii() { compose exec -T -u www-data humhub /app/yii "$@"; }
