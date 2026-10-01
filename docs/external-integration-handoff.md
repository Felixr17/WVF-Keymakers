# External integration handoff

**Status:** External implementation required for every item below.  
This website repository only owns public pages, frontend validation, and the JSON payloads browsers POST. It does not own Baserow, n8n, Givebutter admin, production email, or the Keymakers dashboard.

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
5. When `COMMUNITY_CIRCLE_MEMBER_URL` is provided, the public Community page can show “Enter the Community Circle.” Authentication still lives outside this repo.

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

## 8. Community Circle member destination

| | |
| --- | --- |
| Config | `COMMUNITY_CIRCLE_MEMBER_URL` in `keymakers-config.js` (currently empty) |
| Public behavior | “Enter the Community Circle” is hidden until the URL is set |

Providing the URL, auth, and Keyholder+ gating is **External implementation required.**

---

## What this website will not do

- Create Baserow rows itself
- Send production email
- Modify Givebutter campaigns
- Implement Maria’s staff queue
- Authenticate paid members
- Submit test data to the live webhook during development
