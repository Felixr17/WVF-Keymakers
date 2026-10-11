# External integration handoff

**Status:** External implementation required for every item below.  
This website repository only owns public pages, frontend validation, and the JSON payloads browsers POST. It does not own Baserow, n8n, Givebutter admin, production email, or the Keymakers dashboard.

**Missing repositories in this Cloud Agent VM (do not recreate them here):**

| System | Expected location | Status |
| --- | --- | --- |
| Keymakers Dashboard | `/Users/felixr/Developer/Felix-OS/Dashboard WVF/Keymakers Dashboard` | Not mounted — External implementation required |
| WVF AI / n8n automation | `/Users/felixr/Developer/Felix-OS/WVF AI ` | Not mounted — External implementation required |

Scan and file-by-file plan: `docs/multi-repository-workspace.md`.

Do not treat a successful frontend “thank you” state as proof that records, tags, or emails exist.

---

## Shared endpoint (already referenced by the public site)

| Key | Value |
| --- | --- |
| Config | `assets/js/keymakers-config.js` → `N8N_INTAKE_WEBHOOK_URL` |
| Current URL | `https://primary-production-a33d.up.railway.app/webhook/keymakers-intake` |
| Method | `POST` |
| Content-Type | `application/json` |

Automation must accept unknown extra fields without dropping the submission. New website fields are additive.

---

## 1. Share Your Key intake

| | |
| --- | --- |
| Originating form | `share-your-key.html` `#intake-form` |
| Source | `Main Intake Form` |
| Website states | Client validation, submitting, success heading, recoverable server error (entries retained) |

### Expected payload

```json
{
  "source": "Main Intake Form",
  "firstName": "string",
  "lastName": "string",
  "business": "string",
  "email": "string",
  "phone": "string",
  "keyDescription": "string",
  "participation": "virtual | self-record | in-person | more-info",
  "contactOptIn": "yes",
  "alreadyMember": "yes | no | not-sure | \"\"",
  "membershipInterest": true
}
```

`membershipInterest` is a JSON **boolean** (`true` / `false`), not a string. Unchecked checkboxes still send `false`. `alreadyMember` is a string and may be `""`.

`participation` values are **legacy codes**. Map them for staff as:

| Posted value | Public label |
| --- | --- |
| `virtual` | Be Featured in a Story |
| `self-record` | Share in a Video |
| `in-person` | Speak at the Gathering |
| `more-info` | Be a Mentor or Connector |

### Expected Baserow fields / tags

- Person: first name, last name, email, phone, business
- Story/intake: key description, participation preference (human label), contact opt-in
- Flags: `already_member`, `membership_interest`
- Participation / pipeline tag: `share-your-key` plus the mapped preference
- Status: `new` → review by Maria / program staff (see Maria spec)

### Expected user email

- Subject (proposed): “We received your Keymakers story”
- Body: Thank you; WVF will follow up only if there is a potential next step; nothing is published without a further conversation and permission.
- **External implementation required.**

### Expected staff notification

- To: Maria / designated intake owner (`info@wvf-ny.org` until a staff alias is confirmed)
- Include name, email, participation label, already-member flag, membership-interest flag, and a link to the Baserow row.
- **External implementation required.**

### Required automation behavior

1. Reject or quarantine honeypot-filled posts (website also blocks these client-side).
2. Upsert person by email.
3. Create an intake record; do not auto-publish.
4. Send user confirmation and staff notification.
5. If `membershipInterest` is true, tag for membership follow-up (do not charge or grant Community Circle access from this form).

**External implementation required.**

---

## 2. Footer newsletter

| | |
| --- | --- |
| Originating forms | Footer on `about.html`, `get-involved.html`, `connectors.html`; `why-it-matters.html` footer (now uses the shared helper) |
| Source | `Footer Newsletter` |
| Participation | `newsletter-only` |

### Expected payload

```json
{
  "source": "Footer Newsletter",
  "participation": "newsletter-only",
  "email": "string"
}
```

### Expected Baserow fields / tags

- Email, tag `newsletter-only`, source page if n8n can add `Referer` (optional)

### Expected user email

- “You’re on the Keymakers list” — Gathering and story updates. No Community Circle access.

### Expected staff notification

- Optional digest; not required per signup.

### Required automation behavior

Upsert email; do not create a Share Your Key intake; do not grant membership.

**External implementation required.**

---

## 3. Gathering “Stay in the Loop”

| | |
| --- | --- |
| Originating form | `gathering.html` `#reserve` |
| Source | `Gathering Stay in the Loop` |
| Participation | `gathering-rsvp` |

### Expected payload

```json
{
  "source": "Gathering Stay in the Loop",
  "participation": "gathering-rsvp",
  "email": "string"
}
```

### Expected Baserow fields / tags

- Email, tag `gathering-rsvp` (interest / waitlist — date and venue are TBA)

### Expected user email

- Confirm they are on the Gathering updates list; date/venue still to be announced.

### Expected staff notification

- Optional. Event lead should be able to export the tag.

**External implementation required.**

---

## 4. Connector interest

| | |
| --- | --- |
| Originating form | `connectors.html` `#apply-connector` |
| Source | `Connector Application` |
| Participation | `connector-interest` |

### Expected payload

```json
{
  "source": "Connector Application",
  "participation": "connector-interest",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "business": "string",
  "message": "string",
  "alreadyKeymaker": "yes | no | not-sure",
  "contactOptIn": "yes"
}
```

### Expected Baserow fields / tags

- Person + application record
- Tag `connector-interest`
- Flag `already_keymaker` (applicants should already be Keymakers; website copy states this)

### Expected user email

- Interest received; Connector is a volunteer role, not a membership tier; WVF will follow up.

### Expected staff notification

- Maria / Connector program owner with the message body and already-Keymaker answer.

**External implementation required.** Mail-to `info@wvf-ny.org` remains a fallback on the page.

---

## 5. Key Guide interest

| | |
| --- | --- |
| Originating forms | `community.html` `#apply-key-guide`, `connectors.html` `#key-guides`, `get-involved.html` Key Guide card |
| Source | `Key Guide Application` |
| Participation | `key-guide-interest` |

### Expected payload

Same shape as Connector interest, with `participation: "key-guide-interest"` and `source: "Key Guide Application"`.

### Expected Baserow fields / tags

- Tag `key-guide-interest`
- Role of service, **not** a membership tier
- Prerequisite: experienced Keymaker and/or Connector

### Expected user email

- Interest received; applications are reviewed; Key Guide is not purchased.

### Expected staff notification

- Maria / Community Circle owner.

**External implementation required.**

---

## 6. Givebutter paid membership → Community Circle access

| | |
| --- | --- |
| Originating action | Membership CTAs on `index.html#membership`, `get-involved.html#membership`, `community.html` “Become a Member” |
| Checkout | `https://givebutter.com/keymakers-campaign` (widget account `c0DdlWYvuGmd2igp`) |

The public site **cannot** grant dashboard or Community Circle access. After payment, the proposed experience is:

1. Member completes Givebutter checkout for Keyholder ($25/yr) or above.
2. Givebutter / n8n creates or updates the person and sets membership tier.
3. User email: payment received; Community Circle access is **scheduled**, not instant on the public website.
4. Staff notification: new paid member + tier.
5. Payment alone never grants access. Staff approve Community Circle access in the dashboard (section 8). The public “Enter the Community” link only goes to the HumHub sign-in page.

**Key Carrier (Free)** does not include Community Circle access.

**External implementation required** in Givebutter admin, n8n, Baserow, email, and the dashboard. Do not claim this flow is live.

---

## 7. Key Circle invitation ($1,000 / yr)

| | |
| --- | --- |
| Originating action | Mailto on membership rows: `mailto:info@wvf-ny.org?subject=Key Circle Invitation Request` |

No JSON payload. Staff handle invitations manually until a dashboard workflow exists.

**External implementation required** if this should become a structured form.

---

## 8. Community Circle on HumHub (pilot)

**Status: External implementation required** in the Keymakers Dashboard repository and the WVF AI / n8n workspace. Neither was mounted when this was written (11 October 2026), so none of the items below exist yet. Nothing here is live.

Website side (done in this repo): see `docs/community-website-handoff.md`.

### Architecture

`Public website → n8n intake → Baserow → staff dashboard approval → HumHub provisioning`

- HumHub is a separate application on a dedicated subdomain, proposed `https://community.wvf-ny.org`. DNS is **not** changed.
- The website links to it in the same tab. No iframe in the website or dashboard.
- Tiers are HumHub **space memberships and roles** in one HumHub install, not separate sites.
- Pilot sign-in uses HumHub invitation / local accounts. OIDC SSO is a later phase.

### Originating website forms or actions

| Website action | Community effect |
| --- | --- |
| Share Your Key (`share-your-key.html`), incl. `membershipInterest: true` | **None.** Never provisions. |
| Connector interest (`connectors.html`) | **None.** Interest is not role approval. |
| Key Guide interest (`community.html`, `connectors.html`) | **None.** Interest is not role approval. |
| Givebutter checkout | **None by itself.** Payment is one input; staff approval is still required. |
| “Enter the Community” link (`community.html`) | Opens HumHub sign-in. Carries no parameters. |

### Expected payload (n8n → dashboard)

Provisioning is triggered only by a staff action in the dashboard. If routed through n8n, n8n forwards this to the dashboard’s protected endpoint and adds nothing of its own:

```json
{
  "candidateId": "baserow-row-or-dashboard-id",
  "action": "provision | suspend | revoke",
  "reason": "string, required",
  "idempotencyKey": "uuid, required, preserved on retry",
  "previousAccessState": "Approved | Provisioning failed | Enabled | Suspended",
  "requestedBy": "staff identity from dashboard session"
}
```

Signed with `COMMUNITY_INTERNAL_API_SECRET` (HMAC over body + timestamp). n8n holds **no** HumHub token and **does not** re-implement eligibility.

### Expected Baserow fields / participation tags

Proposed additions (to be reconciled with the dashboard’s `docs/baserow-schema-migration-proposal.md`):

| Field | Values |
| --- | --- |
| `registration_status` | existing approval field; must be `Approved` |
| `participation_level` | `General` / `Paid member` (free vs. paid matrix awaits WVF approval) |
| `payment_verified` | boolean, set only from verified Givebutter records |
| `membership_status` | `Active` / `Lapsed` / … |
| `community_access_approved` | boolean, staff-set only |
| `connector_role_status` | `Not requested` / `Interested` / `Approved` / `Removed` |
| `key_guide_role_status` | same |
| `staff_role_approved` | boolean, never inferred from email domain |
| `community_state` | `Not requested`, `Pending approval`, `Approved`, `Provisioning`, `Enabled`, `Provisioning failed`, `Suspended`, `Revoked` |
| `community_provider_user_id` | HumHub user ID (confirmed) |
| `community_confirmed_spaces` | list returned by HumHub |
| `community_last_sync_at` | timestamp |
| `community_last_error` | sanitized message only |
| `community_audit_log` | append-only; revocation never deletes it |

Tags: `community-approved`, `community-enabled`, `community-suspended`, `community-revoked`, `role-connector-approved`, `role-key-guide-approved`.

### Proposed space matrix (pilot configuration — requires WVF approval)

| HumHub space | General/free approved | Paid member | Connector approved | Key Guide approved | Staff role |
| --- | --- | --- | --- | --- | --- |
| Welcome & Announcements | ✓ | ✓ | | | ✓ |
| Community Circle | ✓ | ✓ | | | ✓ |
| Share Your Key | ✓ | ✓ | | | ✓ |
| Microloan Resources (selected) | ✓ | ✓ | | | ✓ |
| Paid Member Circle | | ✓ | | | ✓ |
| Connector Hub | | | ✓ | | ✓ |
| Key Guide Hub | | | | ✓ | ✓ |
| WVF Staff | | | | | ✓ |

Roles stack on top of general or paid participation and are independent of payment.

> **Conflict for WVF to resolve:** the current public site says Key Carrier (free) does **not** include the Community Circle. The proposed pilot gives approved free participants general spaces. The website copy was not changed to promise free access; decide before go-live.

### Policy rules (deterministic, no AI)

- General access: registration `Approved` **and** `community_access_approved` **and** not suspended/revoked.
- Paid spaces add: `participation_level = Paid member` **and** `payment_verified` (when payment is required) **and** `membership_status = Active`.
- Connector / Key Guide hubs: role status `Approved` only. `Interested` grants nothing.
- Staff space: `staff_role_approved` only.
- Unknown, absent, inferred, or conflicting values fail closed and list the missing requirement.
- Output: eligible, reason, intended spaces, missing requirements, spaces to remove on suspend/revoke.
- Required unit tests: approved free; unapproved free; approved paid; payment without approval; active membership without verified payment; Connector interest only; approved Connector; approved Key Guide; suspended; revoked; incomplete/conflicting data.

### Dashboard endpoints (server-only, existing staff auth and write gates)

`GET /api/community/status`, `POST /api/community/preview`, `POST /api/community/provision`, `POST /api/community/suspend`, `POST /api/community/revoke`.

State-changing requests must carry staff identity, candidate ID, reason, idempotency key, intended action, and previous state, all validated server-side. `Enabled` is shown only after HumHub confirms the user and every intended space.

Modes: `COMMUNITY_PROVISIONING_MODE=disabled` (no provider call possible; buttons say no write occurred), `preview` (show intended changes, write nothing to Baserow or HumHub), `live` (provider calls only after every check). Default `disabled` everywhere.

Dashboard env placeholders: `COMMUNITY_PROVIDER=disabled`, `COMMUNITY_PROVISIONING_MODE=disabled`, `COMMUNITY_PUBLIC_URL=`, `HUMHUB_BASE_URL=`, `HUMHUB_API_TOKEN=`, `HUMHUB_GENERAL_SPACE_ID=`, `HUMHUB_PAID_SPACE_ID=`, `HUMHUB_SHARE_KEY_SPACE_ID=`, `HUMHUB_CONNECTOR_SPACE_ID=`, `HUMHUB_KEY_GUIDE_SPACE_ID=`, `HUMHUB_MICROLOAN_SPACE_ID=`, `HUMHUB_STAFF_SPACE_ID=`, `COMMUNITY_INTERNAL_API_SECRET=`. (Welcome & Announcements has no dedicated variable in this list; add one or set it as a HumHub default space.)

### HumHub adapter (implements the dashboard’s existing `src/lib/community-platform-adapter.ts` contract)

Versions checked against official sources on 11 October 2026 (re-verify at implementation):

| Component | Version | Source |
| --- | --- | --- |
| HumHub core | **1.18.6** (latest stable; 1.19.0 is beta only) | https://github.com/humhub/humhub/releases |
| HumHub Docker image | `humhub/humhub:1.18.6` | https://hub.docker.com/r/humhub/humhub |
| REST API module | **0.11.7** (`module.json`: minVersion 1.18, maxVersion 1.18). 0.12.x requires 1.19 and must not be used. | https://github.com/humhub/rest/releases |

REST operations listed in the module’s OpenAPI at tag `v0.11.7` (`docs/swagger/user.yaml`, `docs/swagger/space.yaml`). Confirm against the **installed** module before coding:

| Need | REST 0.11.7 operation |
| --- | --- |
| Find by email | `GET /user/get-by-email` |
| Find by external WVF ID | `GET /user/get-by-authclient` (after `POST /user/{id}/auth-client`) |
| Create user | `POST /user` |
| Invite user | `POST /user/invite` (sends HumHub mail — keep off until mail is approved) |
| Update profile | `PUT /user/{id}` (minimum fields only) |
| List / add / remove space membership | `GET` / `POST` / `DELETE /space/{id}/membership[/{userId}]` |
| Set space role | `PATCH /space/{id}/membership/{userId}/role` |
| End sessions on suspend/revoke | `DELETE /user/session/all/{id}` |
| Suspend account | Account `status` field via `PUT /user/{id}` — **verify** in installed OpenAPI; otherwise a manual admin step |

Idempotency: look up before create; diff memberships before add/remove; store the idempotency key with the result so a replay returns the stored outcome. Send only name, email, and external ID. Never send application answers, financial data, interview notes, CDFI data, or staff notes. Sanitize errors (strip tokens, emails, response bodies).

### Expected user email

None in the pilot. Do not claim an invitation was sent unless a delivery provider confirms it. HumHub’s own invite mail stays off until WVF approves production email.

### Expected staff notification

Optional Slack/email on `Provisioning failed` with the sanitized error and a dashboard link. **External implementation required.**

### Required automation behavior (WVF AI / n8n, `WF-MEM-08-provision-request.json`, stays inactive)

1. Receive a staff-approved provisioning request.
2. Verify the internal signature.
3. Call the dashboard’s protected provisioning endpoint.
4. Preserve the idempotency key.
5. Record success or a sanitized failure.
6. Allow retry without duplicates.

No HumHub token in n8n. Do not publish or activate.

### HumHub package (dashboard repo, `community/humhub/`)

Docker Compose (HumHub 1.18.6 + the database the official Docker docs specify), persistent volumes, `.env.example` with placeholders, health checks, start/stop/backup/restore/upgrade docs, a WVF theme override (logo, colors, “Return to Women’s Venture Fund”, Support, rules, privacy), synthetic `example.com` fixtures that never load in production. Docs to create there: `community/humhub/README.md`, `docs/community-humhub-pilot.md`, `docs/community-operations-runbook.md`.

**External implementation required.** Do not claim any of this is complete.

---

## What this website will not do

- Create Baserow rows itself
- Send production email
- Modify Givebutter campaigns
- Implement Maria’s staff queue
- Authenticate paid members
- Submit test data to the live webhook during development

## Remaining live webhook tests (pre-launch requirement)

Website QA in this repository must **not** POST to `N8N_INTAKE_WEBHOOK_URL`. The following tests remain for a designated operator before production:

| # | Form | Exact test | Pass criteria |
| --- | --- | --- | --- |
| 1 | Share Your Key | POST one payload with `participation: "virtual"`, `alreadyMember: ""`, `membershipInterest: false` | HTTP 2xx; Baserow intake created; public success copy only after 2xx |
| 2 | Share Your Key additive | POST `alreadyMember: "not-sure"`, `membershipInterest: true` (boolean) plus a legacy participation code | Fields stored; intake not dropped |
| 3 | Newsletter | POST `{ "source": "Footer Newsletter", "participation": "newsletter-only", "email": "<test>" }` | Tagged newsletter only; no intake row |
| 4 | Gathering | POST `{ "source": "Gathering Stay in the Loop", "participation": "gathering-rsvp", "email": "<test>" }` | Tagged gathering list |
| 5 | Connector | POST `source: "Connector Application"`, `participation: "connector-interest"` | Volunteer interest record |
| 6 | Key Guide | POST `source: "Key Guide Application"`, `participation: "key-guide-interest"` | Volunteer interest record |
| 7 | Failure honesty | Return a non-2xx from n8n for a test submit | Public UI shows error + mailto, never success |

See `docs/forms-and-email-planning.md` for the same list in website-planning language.
