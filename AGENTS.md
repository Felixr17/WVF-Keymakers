# Multi-repository workspace

This Cursor workspace may contain several WVF project folders. Treat them as **separate systems** with separate responsibilities. Do not mix files between repositories. Do not recreate a missing repository inside another one.

## Public website repository

**Present in this environment** as `/workspace` (GitHub: `Felixr17/WVF-Keymakers`).

Responsible for:

- Keymakers public pages
- Public forms
- Images and videos
- Public membership messaging
- Community messaging
- Calls to action
- Accessibility and responsive behavior

## Keymakers Dashboard repository

**Expected location (not mounted here):** `/Users/felixr/Developer/Felix-OS/Dashboard WVF/Keymakers Dashboard`

Responsible for:

- Staff dashboard
- Registration review
- Member profiles
- Membership and access statuses
- Microloan readiness
- Salesforce export
- Staff authentication
- Staff-facing workflow actions

If this folder is absent, mark dashboard work as **External implementation required**. Do not invent a dashboard in the website repo.

## WVF AI / automation workspace

**Expected location (not mounted here):** `/Users/felixr/Developer/Felix-OS/WVF AI `

Responsible for:

- n8n workflow definitions and documentation
- Website intake
- Givebutter intake
- Webinar intake
- Email automation
- Slack notifications
- Microloan invitations and reminders
- Baserow integration planning

If this folder is absent, mark automation work as **External implementation required**. Do not invent n8n or Baserow code in the website repo.

## Before editing (any agent)

1. Identify every repository or workspace folder.
2. Read the instructions within each repository.
3. Report the Git status of each Git repository.
4. Do not mix files between repositories.
5. Create a file-by-file plan grouped by repository.
6. Identify which changes require live external-service access.
7. Preserve unrelated and uncommitted changes.
8. Do not deploy or modify production services without explicit approval.

Live services (n8n production webhook, Givebutter admin, Baserow admin, production email) require explicit approval. Do not submit production forms while developing.

See `docs/multi-repository-workspace.md` for the current scan, Git status, and file-by-file plan.

---

# Website-only scope (public WVF Keymakers website)

**IMPORTANT: CURRENT REPOSITORY SCOPE**

This Cursor workspace currently contains only the public WVF Keymakers website repository.

You may inspect and modify:

- Public website pages
- Website components, styles, scripts, and assets
- Website forms and frontend validation
- Public calls to action and links
- Accessibility and responsive behavior
- Website-facing success and failure states
- Website documentation and planning files
- The image-replacement manifest

You do not currently have direct access to:

- The separate Keymakers dashboard repository
- The complete WVF AI/n8n automation workspace
- Live Baserow administration
- Live Givebutter administration
- Production email administration

Do not invent, recreate, or simulate those missing repositories inside this website repository.

When a website change requires dashboard, Baserow, n8n, Givebutter, or email work:

1. Document the requirement in `docs/external-integration-handoff.md`.
2. Identify the originating website form or action.
3. Document the expected payload.
4. Document the expected Baserow fields or participation tags.
5. Document the expected user email.
6. Document the expected staff notification.
7. Document the required automation behavior.
8. Mark the item as “External implementation required.”
9. Do not claim that the integration is complete.
10. Do not submit production forms or modify external services.

For this repository, prioritize:

- Public/general website layer
- Paid-member messaging and proposed access experience
- Website forms and frontend states
- Calls to action
- Community messaging
- Registration questions
- Image-replacement preparation
- Accessibility
- Mobile behavior
- Forms-and-email planning
- Maria’s applicant/staff workflow mockup specification

The dashboard, Baserow, email, and automation portions should be documented as handoff requirements until their repositories or services are made available.

Do not create dashboard or automation code inside the website repository.

Confirm environment files and secrets are ignored and will not be committed (see `.gitignore` and `.env.example`).

## Working notes

- Static HTML site with Tailwind CDN, Alpine.js, and shared scripts in `assets/js/`.
- Public forms POST to the n8n intake webhook configured in `assets/js/keymakers-config.js`. Frontend success/error states live here; record creation, tagging, and mail live elsewhere.
- Membership checkout is Givebutter (`https://givebutter.com/keymakers-campaign`). Community Circle member access URL is empty until WVF provides it.
- Do not POST to the live webhook while testing. Exercise validation and UI states only.
