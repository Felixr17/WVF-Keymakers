# Keymakers Community Circle — HumHub pilot

A standalone, reviewable HumHub pilot for the Keymakers Community Circle. **This is a pilot, not a production deployment.**

HumHub is part of the Keymakers website project and brand, and its source stays in this repository. In production it runs as a separate service at `https://community.<existing-keymakers-domain>` (exact hostname not yet confirmed), because the public website is static. The website never runs HumHub, never calls the HumHub REST API, and never decides who gets access. Deployment is disabled until the cost-control deployment gate in `docs/deployment.md` is passed.

## Versions (pinned)

| Component | Version | Source |
| --- | --- | --- |
| HumHub | 1.18.6 (latest stable 1.18; 1.19 is beta and not used) | [`humhub/humhub` image](https://hub.docker.com/r/humhub/humhub), [humhub/docker](https://github.com/humhub/docker), [release notes](https://github.com/humhub/humhub/releases/tag/v1.18.6) |
| REST API module | 0.11.7 (requires HumHub 1.18; 0.12.x requires 1.19 and is not used) | [humhub/rest v0.11.7](https://github.com/humhub/rest/releases/tag/v0.11.7) |
| MariaDB | 11.8.9 (HumHub supports 10.11+, recommends 11.8+) | [Official image](https://hub.docker.com/_/mariadb) |

Images are pinned by tag **and** digest in `docker-compose.yml`. The REST archive is pinned by SHA-256 in `scripts/install-rest-module.sh`. The REST module is also on the marketplace blacklist, so the image's start-up `module/update-all` cannot replace it.

## What is in this folder

| Path | Purpose |
| --- | --- |
| `docker-compose.yml` | HumHub, MariaDB, and the official one-shot `backup` job. Nothing else. |
| `.env.example` | Placeholders only. Copy to `.env` (gitignored). |
| `config/spaces.json` | The eight proposed spaces. All private and invitation-only. |
| `config/access-matrix.json` | Public tier → general/paid mapping, level and role → space mapping, and lifecycle. Proposed; WVF may change it before production. |
| `config/deployment-gate.json` | Cost-control deployment gate. `blocked` until WVF confirms in writing that hosting fits existing costs, plus domain, HTTPS, email, backups, and moderation. Non-local script runs refuse until it is approved. |
| `config/demo-users.json` | Seven fictional `example.com` personas. No passwords. Local only. |
| `scripts/` | Secrets, install, theme, registration lock, demo data, health, backup, and restore. |
| `theme/keymakers/` | Minimal child theme of the HumHub 1.18 base theme. No core files changed. |
| `docs/administrator-setup.md` | The full 14-step setup sequence, including the manual admin-UI steps. |
| `docs/backup-and-restore.md` | Backup, encryption, and restore. |
| `docs/deployment.md` | Hosting decision, predeployment cost check, and the cost-control deployment gate for `https://community.<existing-keymakers-domain>`. Nothing is deployed. |

The dashboard contract is in the repository-level `docs/dashboard-community-connection-contract.md`.

## Quick start (local pilot)

Requires Docker Engine with Compose v2, Python 3, `curl`, and host ports 80 and 443 free.

```bash
cd community/humhub
./scripts/generate-secrets.sh        # creates .env (chmod 600) with random secrets
docker compose up -d                 # waits for MariaDB to be healthy, then starts HumHub
docker compose ps                    # both services should show "(healthy)"
./scripts/bootstrap-local.sh         # local only: runs the installer from the console
./scripts/install-rest-module.sh     # pinned REST 0.11.7, checksum-verified
./scripts/install-theme.sh           # activates the Keymakers theme
./scripts/lock-registration.sh       # invitation-only settings
```

Then follow `docs/administrator-setup.md` from step 6 (the API token, space permissions, spaces, demo users, and persona tests).

Open `https://localhost`. The local certificate comes from HumHub's built-in Caddy and is self-signed, so the browser will warn.

## Health checks

- **HumHub container:** the image's `/app/bin/humhub-simple-healthcheck.sh` (requests `https://localhost` inside the container). Interval 15 s, 10 retries, 60 s start period.
- **MariaDB container:** `healthcheck.sh --connect --innodb_initialized` from the official image. HumHub waits for this.
- **Host check:** `./scripts/healthcheck.sh` reports container state, the login page status code, whether HumHub is installed, the REST module version, and that the API returns 401 without a token.

## Start, stop, logs

```bash
docker compose up -d
docker compose stop          # keeps containers and data
docker compose down          # removes containers; data stays in ./data
docker compose logs -f humhub
```

Data persists in `./data/humhub` (mounted at `/data`) and `./data/mysql`. Both are gitignored. **Never run `docker compose down -v` or delete `./data` unless you intend to erase the community.**

## Upgrade and rollback

1. Read the HumHub and REST release notes. Stay on 1.18.x until WVF approves a move to 1.19 and REST 0.12.x together.
2. Run `./scripts/backup.sh` and confirm the archive exists. See `docs/backup-and-restore.md`.
3. Change the image tag **and** digest in `docker-compose.yml`. Get the digest with `docker buildx imagetools inspect humhub/humhub:<tag>`.
4. For a REST change, update the version and SHA-256 in `scripts/install-rest-module.sh`, then re-run it.
5. `docker compose pull && docker compose up -d`. Start-up runs database migrations.
6. Run `./scripts/healthcheck.sh`, `./scripts/verify-openapi.sh`, and `python3 scripts/pilot.py verify`, then test each persona.

**Rollback:** set the previous tag and digest back, then restore the pre-upgrade backup with `./scripts/restore.sh <archive> --yes`. Database migrations are not reversible, so do not start an older image against an upgraded database without restoring.

## Pilot helper (`scripts/pilot.py`)

Python standard library only. It reads `.env` and calls only REST operations that `verify-openapi.sh` confirms exist in the installed module.

| Command | Network | Notes |
| --- | --- | --- |
| `plan` | none | Prints the intended spaces for each demo persona. |
| `openapi` | none | Checks every operation the helper uses against the installed OpenAPI files. |
| `spaces` | yes | Creates missing spaces by name and writes IDs to `state/space-ids.json` (gitignored). |
| `demo-users` | yes | **Local only.** Creates the fictional users. |
| `sync` | yes | **Local only.** Adds and removes memberships, disables suspended and revoked accounts, and ends their sessions. |
| `verify` | yes | Read-only. Exits 1 if HumHub differs from the plan. |

Every command can be re-run safely. `demo-users` and `sync` refuse to run unless `HUMHUB_PILOT_ENV=local` and the API host is `localhost` or `127.0.0.1`. Synthetic users are never created automatically, and nothing in the image or compose file creates them.

This helper is an administration aid for the pilot. Real member provisioning belongs to the future Keymakers Dashboard adapter (see the contract document). The helper must not be pointed at production with real people.

## Known HumHub behaviors found while building the pilot

- `HUMHUB_FIXED_SETTINGS__*` values pass through `is_callable()`. A value such as `file` runs PHP's `file()` and returns HTTP 500 on every request, so mail is set from the console (`scripts/set-mail-no-delivery.sh`) instead.
- Live updates (Mercure) call the base URL from inside the container, where Caddy listens on 443. Mapping HTTPS to another host port, such as 8443, breaks live updates after sign-in. Keep 80 and 443.
- The console installer commands are not mapped in the production image. `bootstrap-local.sh` maps them for the call only.
- A fresh install allows self-registration and member invitations. `lock-registration.sh` turns these off. Space-level **Invite users** must also be denied in the admin UI (step 8 of the administrator setup).
- `POST /api/v1/space` rejects descriptions longer than 100 characters.
