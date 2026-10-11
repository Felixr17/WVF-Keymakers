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

# Staging and production runs are refused until config/deployment-gate.json is passed
# (see docs/deployment.md, "Cost-control deployment gate").
require_deployment_gate() {
  [ "$(env_value HUMHUB_PILOT_ENV)" = "local" ] && return 0
  python3 - config/deployment-gate.json <<'PY' || die "deployment gate not passed: see config/deployment-gate.json and docs/deployment.md"
import json, sys
gate = json.load(open(sys.argv[1]))
ok = gate.get("status") == "approved" and gate.get("deploymentEnabled") is True \
    and all(c.get("confirmed") is True and c.get("confirmedBy") and c.get("evidence") for c in gate["checks"])
sys.exit(0 if ok else 1)
PY
}

compose() { require_deployment_gate; docker compose "$@"; }

yii() { compose exec -T -u www-data humhub /app/yii "$@"; }
