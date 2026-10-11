#!/usr/bin/env bash
# LOCAL PILOT ONLY. Completes the HumHub installer from the console with the
# official installer commands, so a local demo can start without the web wizard.
# Staging/production must use the web installer (see docs/administrator-setup.md).
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
require_local

if yii settings/list-module admin 2>/dev/null | grep -q installationId; then
  echo "HumHub is already installed; nothing to do."
  exit 0
fi

admin_user="$(env_value HUMHUB_ADMIN_USERNAME)"
admin_email="$(env_value HUMHUB_ADMIN_EMAIL)"
admin_pass="$(env_value HUMHUB_ADMIN_PASSWORD)"
[ -n "$admin_pass" ] || die "HUMHUB_ADMIN_PASSWORD is empty; run scripts/generate-secrets.sh"
case "$admin_email" in *@example.com) ;; *) die "local admin email must be an example.com address";; esac

port="$(env_value HUMHUB_HTTPS_PORT)"
base_url="https://localhost"; [ "$port" = "443" ] || base_url="https://localhost:${port}"

# HumHub's console installer (protected/humhub/modules/installer/commands/InstallController.php)
# is not mapped in the production console config; map it for these calls only.
installer() {
  compose exec -T -u www-data \
    -e 'HUMHUB_CLI_CONFIG__CONTROLLER_MAP__INSTALLER=humhub\modules\installer\commands\InstallController' \
    humhub /app/yii "installer/$1" "${@:2}"
}

installer install-db
installer write-site-config "Keymakers Community Circle" "$admin_email"
installer create-admin-account "$admin_user" "$admin_email" "$admin_pass"
installer set-base-url "$base_url"
yii cache/flush-all >/dev/null
"$HUMHUB_DIR/scripts/set-mail-no-delivery.sh"
echo "Local HumHub installed at $base_url (admin: $admin_user)."
