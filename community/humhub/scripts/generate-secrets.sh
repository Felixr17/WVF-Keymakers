#!/usr/bin/env bash
# Creates .env from .env.example if needed and fills EMPTY secret values with
# strong random strings. Never overwrites a value that is already set.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

[ -f .env ] || { cp .env.example .env; echo "Created .env from .env.example"; }
chmod 600 .env

for key in HUMHUB_DB_PASSWORD MARIADB_ROOT_PASSWORD HUMHUB_ADMIN_PASSWORD HUMHUB_DEMO_PASSWORD; do
  if grep -qE "^${key}=$" .env; then
    value="$(python3 -c 'import secrets; print(secrets.token_urlsafe(24))')"
    sed -i.bak "s|^${key}=$|${key}=${value}|" .env && rm -f .env.bak
    echo "Generated ${key}"
  else
    echo "Kept existing ${key}"
  fi
done

echo "HUMHUB_API_TOKEN is not generated here: create it in Administration > Modules > REST API > Bearer Auth."
