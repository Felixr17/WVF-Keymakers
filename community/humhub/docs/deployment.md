# Deployment — Keymakers Community Circle

**Status: deployment disabled.** Nothing has been deployed and DNS has not been changed. Production stays disabled until the [cost-control deployment gate](#cost-control-deployment-gate) is passed.

## Hosting decision

1. HumHub is part of the Keymakers website project and brand.
2. Its source code stays in this repository under `community/humhub/`.
3. In production, HumHub runs as a **separate service**. The public website is static HTML and cannot run PHP, a database, or background jobs, so do not deploy this folder to the website's static host.
4. Address: **`https://community.<existing-keymakers-domain>`**, a subdomain of the domain the Keymakers website already uses. The exact hostname is not confirmed. Earlier drafts named a `wvf-ny.org` subdomain; that is not the final address.
5. No additional domain is purchased, recommended, or required.
6. No separate paid HumHub hosting provider is recommended.
7. **No additional recurring cost** is a deployment constraint, not a goal.

## Preferred deployment targets

In order of preference:

1. **Existing WVF infrastructure** with spare capacity: a server or container host WVF already pays for that can run Docker. This folder's `docker-compose.yml` runs there unchanged.
2. **Unused capacity in WVF's existing Railway subscription**, which already runs the n8n intake service.

Railway is **not** assumed to be free. Railway bills by resource usage (memory, CPU, volume storage, and network egress) against the subscription's plan, so HumHub adds usage even when no new subscription is opened. The predeployment check below must show that the added usage fits within what WVF already pays.

If neither target can run HumHub without increasing the bill, **deployment stays disabled** and the blocker is recorded in [Blockers](#blockers).

### Notes for a Railway deployment (to verify in staging, not yet tested)

Railway does not run this Compose file as is. Each Compose service becomes its own Railway service:

| Compose service | Railway equivalent | To verify |
| --- | --- | --- |
| `humhub` (pinned image) | A service from the same pinned image, with one volume mounted at `/data` | Railway terminates HTTPS at its edge, so HumHub's built-in Caddy must serve plain HTTP on the target port (for example `SERVER_NAME=:80`) while HumHub still generates `https://` links. Check sign-in, redirects, file uploads, and live updates (Mercure) behind the proxy. |
| `db` (MariaDB 11.8.9) | A service from the same pinned image, with one volume at `/var/lib/mysql`, reached over Railway's private network | The DSN host becomes the private hostname. No public port. |
| `backup` (manual job) | Run on demand, or as a scheduled job on the same project | Where the archive is written and how it is encrypted and copied to existing WVF storage. |

The custom domain `community.<existing-keymakers-domain>` would be added to the HumHub service, and the DNS owner would add the record Railway shows. **Do not add it during this work.**

## Predeployment check

Complete this and attach it to the written cost confirmation. Use the current billing page and usage dashboard of the chosen target; do not rely on estimates in this document.

| Item | Record |
| --- | --- |
| Target | Existing WVF host (name) or existing Railway project (name) |
| Current plan | Plan name, included usage or credits, billing owner |
| Existing usage | Current monthly memory, CPU, storage, and egress, including n8n and any other services |
| Projected HumHub memory | Measured in staging under expected use, plus headroom |
| Projected database memory | Measured in staging, plus headroom |
| Persistent storage | HumHub `/data` (uploads grow with members) plus database volume |
| Backup storage | Archive size × retention count, on existing WVF storage |
| Expected overage | Projected total minus included usage. **Must be zero** to pass the gate. |
| Result | Fits within existing costs / Does not fit |

**Local baseline (for reference only, not a forecast).** Measured on the local pilot, HumHub 1.18.6 and MariaDB 11.8.9 with 8 spaces and 8 users:

- HumHub used about 125 MiB idle, and about 145 MiB under a burst of 200 sign-in page requests.
- MariaDB used about 105 MiB.
- On disk: HumHub data was about 14 MB and the database about 167 MB, mostly MariaDB's own files.
- One backup archive was about 0.4 MB.
- The HumHub image is about 1.8 GB, and the MariaDB image about 470 MB.

Real members, uploads, notifications, and search indexing will use more, so measure again in staging.

## Cost-control deployment gate

The production Community link stays off until **all** of the following are true:

1. **Written confirmation** from the WVF budget owner that HumHub, its database, persistent storage, and backups fit within existing infrastructure costs, with no new recurring charge and no expected overage. It must reference the completed predeployment check.
2. Hosting capacity is confirmed on the chosen existing target.
3. The exact hostname `community.<existing-keymakers-domain>` is confirmed, and the DNS owner agrees to add the record.
4. HTTPS works for that hostname.
5. Email is confirmed (see [Email](#email)), or WVF accepts launching with manual account delivery.
6. Encrypted backups run on existing WVF storage, and a restore has been tested on the chosen host.
7. Moderation is in place: named moderators, a Community Rules URL, and a process for reports, suspensions, and revocations.

Record each confirmation in `config/deployment-gate.json`: set `confirmed`, `confirmedBy`, `confirmedOn`, and `evidence` (where the written confirmation is kept; never a credential). Only then set `status` to `approved` and `deploymentEnabled` to `true`. Until then, `scripts/lib.sh` and `scripts/pilot.py` refuse to run when `HUMHUB_PILOT_ENV` is anything other than `local`.

The website's `COMMUNITY_MODE` stays `'disabled'` until the gate is approved. The tests fail if the website link is enabled while the gate is still blocked.

Also required before calling the community production-ready:

- WVF has approved the space matrix.
- The dashboard adapter (`docs/dashboard-community-connection-contract.md`) is tested against staging, or WVF has accepted a documented manual provisioning process.
- A security review has covered admin accounts, the API token, network exposure, and backups.

## Email

HumHub needs outgoing mail for invitations and password recovery. Use the **existing WVF email provider** only if WVF confirms the mailbox supports the SMTP or relay settings HumHub needs (host, port, TLS, authentication, an allowed sender address, and sending volume). Until then:

- HumHub stays on **No Delivery** (`scripts/set-mail-no-delivery.sh`).
- New members get their first sign-in from WVF staff by hand.
- No new email service is added.

SMTP credentials are entered in **Administration › Settings › Advanced › E-Mail** on the server. They never go in this repository, `.env.example`, the website, or chat.

## Public experience (unchanged by hosting)

- `/community.html` explains the Community Circle and the tiers.
- **Enter the Community** opens `https://community.<existing-keymakers-domain>` in the same tab. There is no iframe.
- The link carries no query string or fragment, so no tier, candidate ID, email, role, or eligibility can appear in the URL.
- HumHub uses the Keymakers theme (`theme/keymakers/`).
- After sign-in, HumHub space membership controls what each person sees.

## Configuration differences from the local pilot

- `HUMHUB_SERVER_NAME=https://community.<existing-keymakers-domain>` on a host that terminates HTTPS itself. On Railway, see the notes above.
- `HUMHUB_PILOT_ENV=production` (or `staging`). Demo-user and sync commands refuse to run, and every script waits for the gate.
- `HUMHUB_TLS_INSECURE=0` (or remove it).
- Do **not** run `bootstrap-local.sh`. Use the web installer with a named WVF administrator and two-factor authentication.
- Do **not** create synthetic users. If any `@example.com` demo account exists, delete it.
- Run `install-rest-module.sh`, `install-theme.sh`, `lock-registration.sh`, and the manual steps in `administrator-setup.md`, especially **Invite users = Deny** and empty default spaces.
- Create the REST token for a dedicated service administrator, with an expiration date, and store it only in the dashboard's server-side secrets.
- Keep the database private: no public port.
- Keep `HUMHUB_DEBUG=false`.

## Ongoing operations

| Area | Approach |
| --- | --- |
| Monitoring | Use monitoring WVF already has (or the host's built-in health checks and alerts) on `https://community.<existing-keymakers-domain>/user/auth/login` (expect 200), container health, disk use, certificate expiry, and backup failures. |
| Backups | See `backup-and-restore.md`. Encrypted, on existing WVF storage. |
| Upgrades | Pinned tag and digest; backup first; staging first; rollback by restore. See `../README.md`. Re-run the predeployment check if an upgrade raises resource use. |

## Connecting the website

Only after the gate is approved:

1. **Staging check:** in `assets/js/keymakers-config.js`, set `COMMUNITY_MODE: 'preview'`, set `COMMUNITY_URL: 'https://community.<existing-keymakers-domain>'` with the confirmed hostname, and add the staging website host to `COMMUNITY_PREVIEW_HOSTS`.
2. **Launch:** set `COMMUNITY_MODE: 'live'`. In the same change, update the shipped-config tests in `scripts/test-community-entry.mjs` and `scripts/test-community-policy.mjs`.

The website only links to the sign-in page. It never receives HumHub credentials.

## Blockers

| Date | Blocker | Owner |
| --- | --- | --- |
| 11 Oct 2026 | Predeployment check not done: current plan, existing usage, and staging measurements are not yet recorded. | WVF |
| 11 Oct 2026 | Exact hostname `community.<existing-keymakers-domain>` not confirmed. | WVF |
| 11 Oct 2026 | Existing email provider's SMTP or relay support not confirmed. | WVF |
| 11 Oct 2026 | Backup storage location and moderators not named. | WVF |

If the check shows HumHub would increase the bill, add that as a blocker here. Deployment then stays disabled.
