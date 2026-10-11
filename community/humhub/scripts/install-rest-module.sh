#!/usr/bin/env bash
# Installs the pinned HumHub REST API module 0.11.7 (compatible with HumHub 1.18 only)
# from its official GitHub tag into /data/modules-custom/rest, then enables it.
# Idempotent: re-running with 0.11.7 already installed only re-checks and re-enables.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

VERSION="0.11.7"
URL="https://codeload.github.com/humhub/rest/tar.gz/refs/tags/v${VERSION}"
SHA256="1de34155e45111d00b9b30040a1988e91aa143a4e016024de2966b4a33aa5677"

installed="$(compose exec -T humhub sh -c 'cat /data/modules-custom/rest/module.json 2>/dev/null || true' | python3 -c 'import json,sys
try: print(json.load(sys.stdin)["version"])
except Exception: print("")')"

if [ "$installed" != "$VERSION" ]; then
  tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
  curl -fsSL "$URL" -o "$tmp/rest.tar.gz"
  echo "${SHA256}  $tmp/rest.tar.gz" | sha256sum -c - >/dev/null || die "checksum mismatch for REST ${VERSION} archive"
  tar -xzf "$tmp/rest.tar.gz" -C "$tmp"
  src="$tmp/rest-${VERSION}"
  python3 - "$src/module.json" "$VERSION" <<'PY'
import json, sys
meta = json.load(open(sys.argv[1]))
assert meta["id"] == "rest", "unexpected module id"
assert meta["version"] == sys.argv[2], "unexpected version"
assert meta["humhub"]["maxVersion"] == "1.18", "REST build is not for HumHub 1.18"
PY
  compose exec -T humhub rm -rf /data/modules-custom/rest
  compose cp "$src" humhub:/data/modules-custom/rest
  compose exec -T humhub chown -R www-data:www-data /data/modules-custom/rest
  echo "Copied REST ${VERSION} into /data/modules-custom/rest"
else
  echo "REST ${VERSION} already present"
fi

# HumHub caches the module list; flush so the newly copied module is discovered.
yii cache/flush-all >/dev/null
yii module/enable rest
yii migrate/up --includeModuleMigrations=1 --interactive=0 >/dev/null
yii cache/flush-all >/dev/null
yii module/info rest
