#!/usr/bin/env bash
# Reports container health, HTTP reachability, installed version, and the REST module.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

compose ps
port="$(env_value HUMHUB_HTTPS_PORT)"
base="https://localhost:${port}"
code="$(curl -ks -o /dev/null -w '%{http_code}' "${base}/user/auth/login" || true)"
echo "Login page HTTP status: ${code}"
yii settings/list-module admin 2>/dev/null | grep -q installationId && echo "Installed: yes" || echo "Installed: no (run the installer)"
yii module/info rest 2>/dev/null | grep -E "Version|Enabled" || echo "REST module: not installed"
api="$(curl -ks -o /dev/null -w '%{http_code}' "${base}/api/v1/auth/current" || true)"
echo "REST API without token (expect 401 when the module is enabled): ${api}"
