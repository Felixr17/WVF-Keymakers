#!/usr/bin/env bash
# Runs the official HumHub Docker backup job: database dump + config, modules, themes, uploads.
# Output: backups/humhub_backup_<timestamp>.tar. Encrypt and copy off-host before relying on it.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
mkdir -p backups
compose run --rm backup
ls -lh backups | tail -5
