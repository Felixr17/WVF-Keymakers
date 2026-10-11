#!/usr/bin/env bash
# Copies the INSTALLED REST module's OpenAPI files out of the container and checks that
# every operation used by scripts/pilot.py (and the future dashboard adapter) is listed.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
mkdir -p state
rm -rf state/openapi
compose cp humhub:/data/modules-custom/rest/docs/swagger state/openapi >/dev/null
python3 scripts/pilot.py openapi
