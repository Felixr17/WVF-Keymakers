# Prelaunch Phase 1 — website repository inventory

This file is the planning checkpoint for the public website repository only. It does not claim that dashboard, Baserow, n8n, Givebutter, or email work is complete.

## 1. Current repository structure

Static HTML site (no app framework, no CSS build, no dashboard code).

```
WVF-Keymakers/
  index.html
  stories.html
  community.html
  gathering.html
  get-involved.html
  connectors.html
  about.html
  share-your-key.html
  why-it-matters.html
  404.html
  privacy.html
  terms.html
  accessibility.html
  sitemap.xml
  robots.txt
  README.md
  AGENTS.md
  .env.example
  .gitignore
  assets/
    js/
      keymakers-config.js
      keymakers-subscribe.js
      keymakers-interest.js
      stories-data.js
    images/
      community/ASSET_MANIFEST.md
      stories/ASSET_MANIFEST.md
      keymakers/          (named portraits; some are editorial stand-ins)
      *.svg               (tier emblems + logo)
  scripts/
    apply-global-nav.py
  docs/
    prelaunch-phase-1.md
    external-integration-handoff.md
    forms-and-email-planning.md
    maria-applicant-staff-workflow-spec.md
    image-replacement-manifest.md
```

## 2. Git branch and worktree (at start of this run)

- Default branch: `main` (`origin/main`, commit `b01cef6` — Brenda Braxton YouTube IDs)
- Working tree on `main` was clean
- Feature branch: `cursor/prelaunch-phase-1-df61`

## 3. What can be completed entirely in this repository

- Public copy, CTAs, membership and Community Circle messaging
- Proposed (honest) paid-member access experience on public pages
- Frontend form fields, validation, success/error/loading states
- Connector and Key Guide interest forms (UI only)
- Registration questions on Share Your Key
- Legal/accessibility pages and footer link targets
- Skip links, focus rings, mobile tap targets, reduced-motion
- Image-replacement manifests (slots, alt-text rules, preferred WVF photography)
- Planning docs and Maria’s applicant/staff **mockup specification**
- `.gitignore` for env files and secrets
- Website-only `AGENTS.md` scope block

## 4. What requires an external repository or service

Marked **External implementation required** in `docs/external-integration-handoff.md`:

- n8n webhook handling for new fields and new `participation` tags
- Baserow records, tags, and staff queues
- User confirmation emails and staff notification emails
- Givebutter campaign questions, thank-you copy, and membership → access mapping
- Members-only Community Circle destination URL and authentication
- Keymakers dashboard (Maria’s staff workflow)
- Production email administration
- Official WVF photography to replace Unsplash / mismatched portraits

## 5. Files proposed / modified in this phase

- `.gitignore`, `.env.example`, `README.md`, `AGENTS.md`
- `docs/*` planning and handoff files
- `assets/js/keymakers-config.js`, `keymakers-subscribe.js`, `keymakers-interest.js`
- Public pages listed in section 1 (messaging, forms, a11y, legal links)
- `privacy.html`, `terms.html`, `accessibility.html`
- `sitemap.xml`
- `assets/images/IMAGE_REPLACEMENT_MANIFEST.md` (site-wide index; page manifests remain)

## 6. Blocking decisions for WVF

Answer these before later phases claim integrations are live:

1. **Community Circle URL** — What members-only URL should `COMMUNITY_CIRCLE_MEMBER_URL` point to? Leave empty until scheduled.
2. **Givebutter post-purchase** — What should donors/members see after Keyholder+ checkout? Who maps Givebutter payments to Baserow membership tags?
3. **Share Your Key participation values** — UI labels (`Be Featured in a Story`, etc.) currently post legacy values (`virtual`, `self-record`, `in-person`, `more-info`). Keep, remap, or replace?
4. **New registration questions** — Confirm the two added optional fields (already a member; membership/Community Circle interest) or supply replacements.
5. **Connector / Key Guide applications** — Website interest forms now collect structured data. Confirm staff owner (Maria vs. program) and whether mailto should remain as fallback only.
6. **Privacy / terms legal review** — New pages are website-facing summaries that point people to `info@wvf-ny.org`. Does WVF have a canonical policy URL to use instead?
7. **Photography** — When can named Keymaker portraits and Community/Stories Unsplash stills be replaced with approved WVF images?
8. **Dashboard access** — When the Keymakers dashboard and n8n workspace are attached, Maria’s spec in `docs/maria-applicant-staff-workflow-spec.md` can be implemented there — not in this repo.
