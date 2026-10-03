# WVF Keymakers (public website)

Public website for the Women’s Venture Fund Keymakers movement.

This repository is **website-only**. The Keymakers Dashboard and WVF AI/n8n workspace are separate folders and are not in this Cloud Agent VM. See `AGENTS.md`, `docs/multi-repository-workspace.md`, and `docs/external-integration-handoff.md`.

## Local preview

Serve the folder over HTTP (opening `file://` can block fetches):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Secrets

Copy `.env.example` to `.env.local` for local notes only. `.env.example` contains **names and safe placeholders only**. `.env`, `.env.*` (except `.env.example`), keys, and credential files are gitignored and must not be committed.

Public webhook and Givebutter IDs in `assets/js/keymakers-config.js` are frontend configuration, not admin secrets.
