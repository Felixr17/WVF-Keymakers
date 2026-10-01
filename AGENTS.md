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
