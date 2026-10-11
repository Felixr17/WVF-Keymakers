#!/usr/bin/env bash
# Copies theme/keymakers into the HumHub data volume as theme "Keymakers" and activates it.
# Uses only HumHub console commands (theme/switch, cache/flush-all). No core files are changed.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

compose exec -T humhub rm -rf /data/themes/Keymakers
compose cp theme/keymakers humhub:/data/themes/Keymakers
compose exec -T humhub chown -R www-data:www-data /data/themes/Keymakers
yii theme/switch Keymakers
yii cache/flush-all >/dev/null
yii theme/info
