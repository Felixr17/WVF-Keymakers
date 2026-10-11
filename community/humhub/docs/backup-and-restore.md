# Backup and restore — Keymakers Community Circle pilot

Uses the official HumHub Docker backup job (`/app/bin/humhub-backup.sh`) and follows the official restore order. Run from `community/humhub/`.

Tested locally on HumHub 1.18.6 / MariaDB 11.8.9: a backup was taken, a full restore replaced the database and data files, and afterwards sign-in returned 200, the Keymakers theme was still active, REST 0.11.7 was still enabled, the existing API token still worked, and `pilot.py verify` passed for all seven personas.

## What a backup contains

`./scripts/backup.sh` runs `docker compose run --rm backup` and writes one archive to `./backups/` (gitignored):

```
backups/humhub_backup_<YYYYMMDDHHMMSS>.tar
├── humhub_db_<timestamp>.sql.gz                 # mariadb-dump of the HumHub database
└── humhub_storage_backup_<timestamp>.tar.gz     # /data: config, uploads, themes, modules, modules-custom
```

The job checks free space and the database connection first, and fails if either check fails.

**The archive contains personal data, password hashes, API token hashes, and `data/config` (which can hold the database password).** Treat it like the live database.

## Encrypt before it leaves the host

The archive is not encrypted. Before copying it anywhere, encrypt it with a key WVF controls. For example, with [age](https://age-encryption.org/):

```bash
age -r "<WVF backup public key>" -o humhub_backup_<timestamp>.tar.age backups/humhub_backup_<timestamp>.tar
shred -u backups/humhub_backup_<timestamp>.tar   # after the encrypted copy is verified
```

`gpg --encrypt` works equally well. Keep the private key offline and outside the backup storage. Do not commit backups or keys.

## Schedule (for a later deployment)

The pilot does not schedule backups. For staging or production, WVF should decide:

- Frequency (suggested: daily) and retention (suggested: 14 daily, 8 weekly).
- Off-host, encrypted storage in a separate account or provider.
- An alert when a backup fails or is missing.
- A restore test at least quarterly, and before every upgrade.

A host cron entry such as `0 3 * * * cd /srv/keymakers-community && ./scripts/backup.sh && <encrypt and upload>` is enough. No extra containers are needed.

## Restore

**Destructive.** It replaces the current database and the restored data folders.

```bash
./scripts/restore.sh backups/humhub_backup_<timestamp>.tar --yes
```

The script:

1. Extracts the archive and checks it contains both the database dump and the storage archive.
2. Runs `docker compose down`.
3. Deletes `data/mysql` and starts only `db`, waiting until it is healthy (MariaDB recreates the empty database and user from `.env`).
4. Imports the dump as the HumHub database user.
5. Copies `config`, `uploads`, `themes`, and `modules-custom` from the backup into `data/humhub/`.
6. Starts the full stack.

Then run:

```bash
./scripts/healthcheck.sh
python3 scripts/pilot.py verify       # local pilot only
```

and sign in as an administrator to check spaces, uploads, and the theme.

**Restoring to a new host:** copy the same `.env` (from WVF's password manager, not from the old host's disk, if possible), place the archive in `backups/`, and run the restore. The database password in `.env` must match the restored `data/config`. If `HUMHUB_SERVER_NAME` changes, set the base URL afterwards under **Administration › Settings › General**.

## Before an upgrade

Always take a backup, confirm the archive exists and is non-empty, and keep it until the upgraded site has been checked. Database migrations do not run backwards, so rollback means restoring that backup with the previous image tag. See the upgrade section in `../README.md`.
