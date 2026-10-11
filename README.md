# WVF Keymakers (public website)

Public website for the Women’s Venture Fund Keymakers movement.

This repository is **website-only**. The Keymakers Dashboard and WVF AI/n8n workspace are separate folders and are not in this Cloud Agent VM. See `AGENTS.md`, `docs/multi-repository-workspace.md`, and `docs/external-integration-handoff.md`.

`community/humhub/` holds the HumHub Community Circle pilot (Docker Compose, theme, config, and admin docs). It is part of the Keymakers project but runs as a separate service, not on the static site. It is not deployed: deployment waits for the cost-control deployment gate in `community/humhub/docs/deployment.md`. See `community/humhub/README.md` and `docs/dashboard-community-connection-contract.md`.

## Local preview

Serve the folder over HTTP (opening `file://` can block fetches):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Tests

```bash
node --test scripts/test-community-entry.mjs scripts/test-community-policy.mjs
python3 -m unittest discover -s community/humhub/tests -v
HUMHUB_DB_PASSWORD=placeholder MARIADB_ROOT_PASSWORD=placeholder \
  docker compose -f community/humhub/docker-compose.yml --env-file community/humhub/.env.example --profile manual config --quiet
```

The Node tests cover the Community Circle entry button, the public access wording, and the HumHub pilot config (`docs/community-website-handoff.md`). The Python tests cover the pilot helper's policy, idempotency, local-only guard, and error sanitizing, with no network access.

## Secrets

Copy `.env.example` to `.env.local` for local notes only. `.env.example` contains **names and safe placeholders only**. `.env`, `.env.*` (except `.env.example`), keys, and credential files are gitignored and must not be committed.

Public webhook and Givebutter IDs in `assets/js/keymakers-config.js` are frontend configuration, not admin secrets.
