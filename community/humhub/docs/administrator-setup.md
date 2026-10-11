# Administrator setup — Keymakers Community Circle pilot

Run every command from `community/humhub/`. Steps marked **Manual** happen in the HumHub admin UI because no REST endpoint or console command does them reliably.

This sequence was run end to end on a local stack (`https://localhost`) with HumHub 1.18.6 and REST 0.11.7. It sets up a **pilot**, not production. For staging or production, skip the local-only steps (marked **Local only**) and see `deployment.md`.

## 1. Copy the environment file

```bash
cp .env.example .env
```

Fill in `HUMHUB_SERVER_NAME` (local default `https://localhost`) and the theme link values. Leave the secret values empty for step 2. `.env` is gitignored; never commit it or paste it anywhere.

## 2. Generate secrets

```bash
./scripts/generate-secrets.sh
```

This fills empty values for `HUMHUB_DB_PASSWORD`, `MARIADB_ROOT_PASSWORD`, `HUMHUB_ADMIN_PASSWORD`, and `HUMHUB_DEMO_PASSWORD` with random 32-character strings and sets `.env` to mode 600. It never overwrites an existing value. For staging and production, store these values in WVF's password manager.

## 3. Start the stack

```bash
docker compose up -d
docker compose ps        # wait for both services to show "(healthy)"
```

Compose stops with an error if a required value is missing from `.env`.

## 4. Create the initial administrator

- **Local only:** `./scripts/bootstrap-local.sh`. It runs HumHub's own console installer, creates the admin from `HUMHUB_ADMIN_USERNAME`, `HUMHUB_ADMIN_EMAIL` (must be `@example.com`), and `HUMHUB_ADMIN_PASSWORD`, sets the base URL, and sets mail to **No Delivery (save as file)**. It does nothing if HumHub is already installed. The admin password is passed as a command argument, which is acceptable only on a single-user local machine.
- **Staging and production (Manual):** open the site and complete the web installer. Use the database values from `.env` (host `db`). Use a named WVF administrator with a strong unique password and two-factor authentication. Then go to **Administration › Settings › Advanced › E-Mail** and keep **No Delivery** until WVF confirms the existing WVF email provider supports the SMTP or relay settings HumHub needs (see `deployment.md`). Staging and production also require the cost-control deployment gate to be passed first.

## 5. Install the REST module

```bash
./scripts/install-rest-module.sh
```

This downloads REST 0.11.7 from the official GitHub tag, checks its SHA-256 and `module.json` (id `rest`, version 0.11.7, HumHub 1.18), copies it to `/data/modules-custom/rest`, enables it, and runs its migrations. Do not install REST from the marketplace: it would offer 0.12.x, which requires HumHub 1.19. The compose file blacklists `rest` from marketplace updates for the same reason.

## 6. Verify the OpenAPI operations and create the API token

```bash
./scripts/verify-openapi.sh
```

This copies the **installed** module's OpenAPI files to `state/openapi/` and confirms every operation used by `scripts/pilot.py` and the future dashboard adapter exists. Every line must say `OK`.

**Manual — create the token:**

1. Go to **Administration › Modules › REST API › Configure** (`/rest/admin`).
2. Turn on **Bearer authentication** and save.
3. Open **Bearer Auth** (`/rest/admin/bearer-auth`), choose the administrator account, and create a token. HumHub requires an expiration date; for a pilot, use a short one.
4. Copy the token once into `HUMHUB_API_TOKEN` in `.env`. HumHub stores only a hash.

Treat the token as an administrator password. It goes only in `.env` for this pilot or in the dashboard's server-side secret store later. **Never** put it in the website, `keymakers-config.js`, HTML, JavaScript, a query string, browser storage, a ticket, or chat. Revoke it on the same page when the pilot ends.

Check it: `./scripts/healthcheck.sh` should show the REST version and a 401 for the unauthenticated request.

## 7. Create the spaces

```bash
python3 scripts/pilot.py spaces
```

This creates any missing space from `config/spaces.json` (matched by name), all **private** (visibility 0) and **invitation-only** (join policy 0), and writes their IDs to `state/space-ids.json` (gitignored). Re-running creates nothing new. Those IDs later become the dashboard's `HUMHUB_*_SPACE_ID` settings.

**Manual (per space):** check each space's **Settings › Security**: visibility *Private*, join policy *Only by invite*. Add a space image and a pinned welcome post if WVF wants them.

## 8. Privacy and invitation-only settings

```bash
./scripts/lock-registration.sh
```

This turns off self-registration, guest access, and member email and link invitations, and turns on new-user approval. Afterwards `/user/registration` redirects to sign-in.

**Manual — required.** On a fresh install, ordinary space members can still invite people into a space, including Paid Member Circle. Go to **Administration › Spaces › Permissions** and, for both the **Member** and the **Moderator** group, set **Invite users** to **Deny**. Leave it allowed for space **Owner** and **Admin** only if WVF staff hold those roles. Verified locally: before this change a general member could open the Paid Member Circle invite dialog (HTTP 200); afterwards it returns 403.

**Manual — also check:**

- **Administration › Users › Settings:** *Anonymous registration* off, *Guest access* off, *Members can invite by email* and *by link* off, *Require approval* on (step 8's script sets these).
- **Administration › Spaces › Settings:** *Default space(s)* empty. **Administration › Users › Groups › (each group):** *Default space(s)* empty. Default spaces add every new account to a space automatically, which would bypass approval (see step 9).
- **Administration › Settings › Advanced › Statistics:** leave tracking code empty.
- Optional: install the HumHub **Legal** module from the marketplace for Terms, Privacy, and cookie notices once WVF supplies the texts.

## 9. Welcome & Announcements behavior

Welcome & Announcements is an ordinary private, invitation-only space. Approved people get an **explicit** membership in it (the access matrix includes `welcome` for every general and paid participant). Do **not** configure it as a HumHub default space (system-wide or per group): default spaces are added to every new account automatically, which would bypass approval.

**Manual:** in the space, limit posting to moderators and admins (**Space › Settings › Permissions › Member › Create post = Deny**) so it stays an announcements channel, and pin a welcome post that links to Community Rules.

## 10. Activate the theme

```bash
./scripts/install-theme.sh
```

This copies `theme/keymakers` to `/data/themes/Keymakers` and runs `theme/switch Keymakers`. HumHub compiles the SCSS itself. Set the footer link values in `.env` (`KEYMAKERS_RETURN_URL`, `KEYMAKERS_RULES_URL`, `KEYMAKERS_PRIVACY_URL`, `KEYMAKERS_SUPPORT_URL`) and run `docker compose up -d` to apply them. Empty or non-`https:`/`mailto:` values show "(coming soon)".

**Manual:** optionally upload the logo under **Administration › Settings › Appearance**. An uploaded logo replaces the theme's built-in Keymakers logo. Set the site name to "Keymakers Community Circle".

## 11. Create the synthetic users (Local only)

```bash
python3 scripts/pilot.py plan          # no network: shows what each persona should get
python3 scripts/pilot.py demo-users
```

This creates seven fictional `@example.com` personas from `config/demo-users.json` with the shared password `HUMHUB_DEMO_PASSWORD` from `.env`. It refuses to run unless `HUMHUB_PILOT_ENV=local` and the API host is `localhost` or `127.0.0.1`. Never create these accounts in staging or production, and never enable them automatically. If they ever exist outside a local stack, delete them.

## 12. Assign spaces

```bash
python3 scripts/pilot.py sync
```

This adds missing memberships (silently, with *can leave* off), removes memberships the matrix does not allow, disables the suspended and revoked personas, and ends their sessions. Revoked personas lose every membership; suspended personas keep theirs but cannot sign in. Re-running changes nothing.

For real members, assignments come from the future Keymakers Dashboard adapter after staff approval (see `docs/dashboard-community-connection-contract.md` in the repository root). Until then, any real assignment is a manual admin action: **Space › Members › Add** with *silent* on.

## 13. Test each persona

```bash
python3 scripts/pilot.py verify        # every persona must PASS
```

**Manual — sign in as each persona** in a private browser window and confirm:

| Persona | Should see | Must not see |
| --- | --- | --- |
| `demo-general` | Welcome & Announcements, Community Circle, Share Your Key, Microloan Resources | Paid Member Circle, Connector Hub, Key Guide Hub, WVF Staff |
| `demo-paid` | The general spaces plus Paid Member Circle | Connector Hub, Key Guide Hub, WVF Staff |
| `demo-connector` | The general spaces plus Connector Hub | Paid Member Circle, Key Guide Hub, WVF Staff |
| `demo-keyguide` | The general and paid spaces plus Key Guide Hub | Connector Hub, WVF Staff |
| `demo-staff` | The general spaces plus WVF Staff | Paid Member Circle, Connector Hub, Key Guide Hub |
| `demo-suspended` | Sign-in refused | Everything |
| `demo-revoked` | Sign-in refused | Everything |

For each persona, also open a space it must not see by its URL (`/s/<space-url>/`) and confirm it is refused, and confirm there is no **Invite** button in Paid Member Circle. On the public website, set `COMMUNITY_MODE: 'preview'` and `COMMUNITY_URL: 'https://localhost'` in a local copy of `assets/js/keymakers-config.js` only, and confirm **Enter the Community** opens the HumHub sign-in page in the same tab with no query string. Do not commit that change.

## 14. Back up and test a restore

```bash
./scripts/backup.sh
./scripts/restore.sh backups/humhub_backup_<timestamp>.tar --yes   # destructive
python3 scripts/pilot.py verify
```

See `backup-and-restore.md`. A pilot is not ready for review until a restore has been tested.
