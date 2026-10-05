# Multi-repository workspace — scan, Git status, and file-by-file plan

Scan date: 3 October 2026 (this Cloud Agent VM).  
Uncommitted website changes at scan time: **none** (clean worktree). Unrelated local edits were not present, so nothing needed preserving.

Do not mix files between repositories. Do not deploy or modify production services without explicit approval.

---

## 1. Every repository or workspace folder identified

| System | Expected path (Felix’s machine) | Path in this VM | Present? |
| --- | --- | --- | --- |
| Public website | GitHub `Felixr17/WVF-Keymakers` | `/workspace` | **Yes** — only Git project in this workspace |
| Keymakers Dashboard | `/Users/felixr/Developer/Felix-OS/Dashboard WVF/Keymakers Dashboard` | — | **No** (`/Users` does not exist here) |
| WVF AI / automation | `/Users/felixr/Developer/Felix-OS/WVF AI ` | — | **No** |
| Keymakers Community Circle | Sibling of the dashboard and the WVF AI folder. Not inside either, and not inside this website repo | Built on this VM as `/home/ubuntu/Keymakers Community Circle` | **Separate project.** Source is not committed in `WVF-Keymakers` |
| Live Baserow | (service, not a repo) | — | **No access** |
| Live Givebutter | (service, not a repo) | — | **No access** |
| Production email | (service, not a repo) | — | **No access** |

Other Git directories on the VM (`~/.nvm`, Cursor plugin cache) are tooling, not WVF project folders.

Instructions read in the **present** repo: `AGENTS.md`, `README.md`, `docs/prelaunch-phase-1.md`, `docs/external-integration-handoff.md`, `docs/forms-and-email-planning.md`, `docs/maria-applicant-staff-workflow-spec.md`, `docs/image-replacement-manifest.md`.

Dashboard and WVF AI instructions **could not be read** because those folders are not mounted. Their work stays an external handoff.

---

## 2. Git status of each Git repository

### Public website — `/workspace`

```
On branch cursor/prelaunch-phase-1-df61
Your branch is up to date with 'origin/cursor/prelaunch-phase-1-df61'.
nothing to commit, working tree clean
```

- Tip commit: `5385bb5` — Add prelaunch website-only scope, forms, and member access copy
- `main` at `b01cef6` (Brenda Braxton YouTube IDs)
- Open PR: https://github.com/Felixr17/WVF-Keymakers/pull/37

### Keymakers Dashboard

**Not present.** No Git status.

### WVF AI / automation

**Not present.** No Git status.

---

## 3. Changes that require live external-service access

Do **not** perform these from this website workspace without explicit approval:

| Change | Service | Why it is live |
| --- | --- | --- |
| Persist Share Your Key / newsletter / Gathering / Connector / Key Guide posts | Production n8n webhook `…/webhook/keymakers-intake` | Writes to automation already referenced by public JS |
| Confirm webhook behavior by submitting a form | Same webhook | Hits production |
| Map Givebutter payments to membership tags | Givebutter admin + n8n + Baserow | Live campaign `keymakers-campaign` |
| Send applicant or staff email | Production email / n8n | Live mail |
| Create Baserow rows or tags | Baserow admin | Live data |
| Set `COMMUNITY_CIRCLE_MEMBER_URL` to a real members URL | Dashboard / Circle host | Live access |
| Salesforce export | Dashboard + Salesforce | Live CRM |

Website frontend validation, copy, and docs do **not** require live access if we do not POST during QA.

---

## 4. File-by-file plan grouped by repository

### A. Public website (`/workspace`) — edit only these

Website-only remaining work. Already shipped on this branch is listed as **done**; leftover items are **next**.

| File | Plan | Status | Live service? |
| --- | --- | --- | --- |
| `AGENTS.md` | Keep multi-repo block at top; keep website-only scope | Update this turn | No |
| `README.md` | Point to multi-repo scan + handoff | Update this turn | No |
| `docs/multi-repository-workspace.md` | This scan, Git status, plan | Add this turn | No |
| `docs/external-integration-handoff.md` | Add expected dashboard and WVF AI paths; keep payloads | Update this turn | No |
| `docs/maria-applicant-staff-workflow-spec.md` | Spec only; implement screens in dashboard repo when present | Keep; do not code dashboard here | No |
| `docs/forms-and-email-planning.md` | Website form inventory; email copy is planning only | Keep | Email send = live (not in this repo) |
| `docs/image-replacement-manifest.md` | Slots and replacement rules | Keep until WVF supplies photos | No |
| `assets/images/**` | Replace only with WVF-supplied files; do not generate fake portraits | Blocked on photography | No |
| `assets/images/og-share-card.png` | Missing OG image referenced in page meta | Blocked on design file | No |
| `assets/js/keymakers-config.js` | Set `COMMUNITY_CIRCLE_MEMBER_URL` only when WVF provides it | Wait | URL itself is live access |
| `assets/js/keymakers-subscribe.js` | Newsletter / Gathering frontend only | Done | POST = live; do not QA-submit |
| `assets/js/keymakers-interest.js` | Connector / Key Guide frontend only | Done | POST = live; do not QA-submit |
| `share-your-key.html` | Intake UI + optional member questions | Done | POST = live |
| `community.html` | Circle messaging + Key Guide form | Done | POST = live |
| `connectors.html` | Connector interest form | Done | POST = live |
| `get-involved.html` | Membership CTAs + `#after-you-join` | Done | Givebutter checkout = live |
| `index.html` | Membership note + a11y | Done | Givebutter = live |
| `why-it-matters.html` | Shared newsletter helper | Done | POST = live |
| `privacy.html` `terms.html` `accessibility.html` | Public legal/a11y summaries | Done; legal review is a WVF decision | No |
| `sitemap.xml` | Include new public URLs | Done | No |

**Do not add** dashboard routes, staff auth, n8n JSON, or Baserow schemas under `/workspace`.

### B. Keymakers Dashboard — **not present** — External implementation required

When `/Users/felixr/Developer/Felix-OS/Dashboard WVF/Keymakers Dashboard` is attached, implement Maria’s spec **there**. Until then, do not create these files in the website repo.

| Planned dashboard work (when repo exists) | Purpose |
| --- | --- |
| Staff auth / session files already in that repo | Staff authentication |
| Registration / intake inbox views | Review Share Your Key payloads |
| Applicant detail view | Show public labels, already-member, membership-interest |
| Member profile + membership status | Keyholder+ vs Key Carrier; Circle eligibility |
| Connector / Key Guide queues | Volunteer roles, not tiers |
| Microloan readiness surface | Staff-facing; not public website |
| Salesforce export action | Staff-facing; live CRM later |

Source of truth for screens: `docs/maria-applicant-staff-workflow-spec.md` in the **website** repo (specification only).

### C. WVF AI / automation — **not present** — External implementation required

When `/Users/felixr/Developer/Felix-OS/WVF AI ` is attached, implement workflows **there**. Until then, do not add n8n JSON to the website repo.

| Planned automation work (when workspace exists) | Originating website action | Live? |
| --- | --- | --- |
| Website intake workflow | `share-your-key.html`, footers, Gathering, Connector, Key Guide | Yes once deployed |
| Accept additive JSON fields | `alreadyMember`, `membershipInterest`, `connector-interest`, `key-guide-interest` | Yes |
| Givebutter intake | Membership checkout | Yes |
| Webinar intake | Not on the public site yet | If/when a form exists |
| User confirmation emails | All public forms | Yes |
| Staff / Slack notifications | Maria / program | Yes |
| Baserow upsert + tags | All intakes + membership | Yes |
| Microloan invitations / reminders | Dashboard readiness, not public pages | Yes |
| Map participation codes to labels | `virtual` → Featured in a Story, etc. | Yes |

Payload contracts: `docs/external-integration-handoff.md`.

---

## 5. What this turn will change

Only the public website repository, documentation only:

1. `AGENTS.md` — multi-repository operating rules at the top
2. `docs/multi-repository-workspace.md` — this file
3. `docs/external-integration-handoff.md` — expected folder paths for missing systems
4. `README.md` — link to the scan

No production deploy. No webhook POSTs. No dashboard or n8n files created here.
