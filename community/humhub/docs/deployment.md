# Deployment requirements — Keymakers Community Circle

**Nothing has been deployed and DNS has not been changed.** This document lists what a later deployment at `https://community.wvf-ny.org` needs. The address itself still needs WVF approval.

## The public website host cannot run HumHub

The Keymakers public website is static HTML. HumHub needs a long-running PHP application server, a MariaDB database, persistent writable storage, and background jobs. Do not try to deploy this folder to the website's static host. The website only links to the community address.

## What is needed

| Requirement | Pilot decision | Still to decide |
| --- | --- | --- |
| **Container host** | One Linux VM with Docker Engine and Compose v2, running this `docker-compose.yml` unchanged. 2 vCPU / 4 GB RAM is a reasonable start for a small community. | Provider, account owner, who has SSH access, OS patching. |
| **Persistent storage** | `./data/humhub` (HumHub `/data`) and `./data/mysql` on a disk that survives VM rebuilds. | Disk size (start at 20 GB), disk snapshots. |
| **Database** | The bundled MariaDB 11.8.9 container. A managed MariaDB 11.8 is also fine: point `HUMHUB_CONFIG__COMPONENTS__DB__DSN` at it and remove the `db` service. | Bundled vs. managed. |
| **HTTPS** | HumHub's built-in Caddy issues and renews Let's Encrypt certificates automatically when `HUMHUB_SERVER_NAME=https://community.wvf-ny.org` and ports 80 and 443 are reachable from the internet. Set `HUMHUB_TLS_INSECURE=0` (or remove it). | Whether WVF places a CDN or proxy in front (then Caddy settings change). |
| **DNS** | An `A`/`AAAA` record for `community.wvf-ny.org` pointing to the host. | **WVF approval; not changed during this work.** |
| **Outbound email** | Keep **No Delivery** until approved. Then set SMTP under **Administration › Settings › Advanced › E-Mail** with WVF's provider, and add SPF/DKIM for the sending domain. | Provider, sender address, who owns the credentials. SMTP credentials never go in this repository. |
| **Encrypted backups** | `scripts/backup.sh` plus encryption and off-host storage. See `backup-and-restore.md`. | Schedule, retention, storage location, key custody. |
| **Monitoring** | External uptime check on `https://community.wvf-ny.org/user/auth/login` (expect 200). Alert on container health (`docker compose ps`), disk usage, certificate expiry, and backup failures. | Tool and who receives alerts. |
| **Upgrade process** | Pinned tag and digest; backup first; staging first; rollback by restore. See `../README.md`. | Who approves upgrades and how often security releases are checked. |

## Configuration differences from the local pilot

- `HUMHUB_SERVER_NAME=https://community.wvf-ny.org`
- `HUMHUB_PILOT_ENV=production` (or `staging`). Demo-user and sync commands then refuse to run.
- Do **not** run `bootstrap-local.sh`. Use the web installer with a named WVF administrator and two-factor authentication.
- Do **not** create synthetic users. If any `@example.com` demo account exists, delete it.
- Run `install-rest-module.sh`, `install-theme.sh`, `lock-registration.sh`, and the manual steps in `administrator-setup.md` (especially **Invite users = Deny** and empty default spaces).
- Create the REST token for a dedicated service administrator, with an expiration date, and store it only in the dashboard's server-side secrets.
- Firewall: allow 80 and 443 in; keep 3306 closed (the compose file only exposes it on the internal network).
- Keep `HUMHUB_DEBUG=false`.

## Connecting the website

Only after HumHub is live, sign-in works, and WVF approves:

1. Staging check: in `assets/js/keymakers-config.js` set `COMMUNITY_MODE: 'preview'`, `COMMUNITY_URL: 'https://community.wvf-ny.org'`, and add the staging website host to `COMMUNITY_PREVIEW_HOSTS`.
2. Launch: set `COMMUNITY_MODE: 'live'` and update the shipped-config test in `scripts/test-community-entry.mjs` in the same change.

The website only links to the sign-in page. It never receives HumHub credentials.

## Before calling it production-ready

- WVF has approved the space matrix, the address, the Rules, Privacy, and Support links, and the email provider.
- The dashboard adapter (see `docs/dashboard-community-connection-contract.md`) is built and tested against staging, or WVF has accepted a documented manual provisioning process.
- A backup has been restored successfully on the production host.
- A security review has covered admin accounts, the API token, firewall, and backups.
