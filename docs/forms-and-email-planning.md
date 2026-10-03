# Forms and email planning (website layer)

Public forms in this repository collect data and show frontend states. Delivery, storage, and mail are **External implementation required** (see `external-integration-handoff.md`).

## Form inventory

| Page | Form | Frontend helper | Participation / source | User-facing success | User-facing failure |
| --- | --- | --- | --- | --- | --- |
| `share-your-key.html` | Share Your Key | inline `shareYourKey()` | `Main Intake Form` + preference code | “Thank you for sharing your key.” No publish promise. | Field-error summary + recoverable submit error + mailto fallback |
| `gathering.html` | Stay in the Loop | `keymakersEmailSignupForm` | `gathering-rsvp` | On the updates list; details TBA | Invalid email / server / not configured + mailto fallback |
| Footers (`about`, `get-involved`, `connectors`, `why-it-matters`) | Newsletter | `keymakersEmailSignupForm` | `newsletter-only` | “Thanks — you're on the list!” | Same as Gathering |
| `connectors.html` | Connector interest | `keymakersInterestForm` | `connector-interest` | Interest received; volunteer role; follow-up if a fit | Error summary + recoverable submit error + mailto fallback |
| `community.html` | Key Guide interest | `keymakersInterestForm` | `key-guide-interest` | Interest received; not a paid tier; follow-up | Error summary + recoverable submit error + mailto fallback |
| Givebutter links | Membership checkout | Givebutter (external) | n/a | Proposed copy on `get-involved.html#after-you-join` | Givebutter-hosted |

## Website rules

1. Never show success unless the webhook returns a successful HTTP response (fixed on `why-it-matters.html`, which previously marked success on network failure).
2. Do not POST to the live webhook while developing or QA-ing in this workspace.
3. Honeypot field `company` / `companyWebsite` must remain in email and intake forms.
4. Required fields need `aria-invalid`, error text, and a focus move to the first error.
5. Success messages must not promise Community Circle access, publication, funding, or introductions.

## Email planning (copy only — not sent from this repo)

| Trigger | Audience | Purpose | Must not claim |
| --- | --- | --- | --- |
| Share Your Key received | Applicant | Acknowledge; set follow-up expectation | That they are published or accepted |
| Newsletter | Subscriber | Confirm list signup | Membership benefits |
| Gathering list | Subscriber | Confirm updates list | Ticket, seat, or date |
| Connector / Key Guide interest | Applicant | Acknowledge volunteer application | That they are appointed |
| Paid membership (Givebutter) | Payer | Receipt + **proposed** access next step | Instant Community Circle login on this public site |
| Staff ping | Maria / program | New record to review | — |

Staff notification routing and templates belong in the email/n8n workspace.

## Registration questions (Share Your Key)

Kept from the existing short intake:

- Name (required)
- Email (required)
- Phone (required)
- Business or organization (optional)
- Your key (required)
- Participation preference (required)
- Contact permission (required)

Added on the website (optional; must be stored by n8n/Baserow):

- Already a Keymakers member? Posted as `alreadyMember`: `yes` / `no` / `not-sure` / `""` (empty string when unanswered)
- I would like information about paid membership and Community Circle access. Posted as `membershipInterest`: JSON **boolean** `true` or `false` (not `"yes"` / `"no"`)

Neither field is required to submit. `alreadyMember` is omitted-empty when unanswered; `membershipInterest` is always sent as a boolean.

Blocking decision: WVF may replace these two questions; do not add more fields until that is confirmed.

## Remaining live webhook tests (pre-launch requirement)

Do **not** POST from this website workspace. Before production, a designated operator must run these against the live n8n webhook and confirm Baserow/email behavior. Mark each as complete only after a real HTTP round-trip.

1. **Share Your Key** — one test payload with `participation: "virtual"` (legacy code), `alreadyMember` empty, `membershipInterest: false`. Confirm success UI only on HTTP 2xx; confirm mailto path if webhook is unset.
2. **Share Your Key additive fields** — one test with `alreadyMember: "not-sure"` and `membershipInterest: true` (JSON boolean). Confirm n8n stores both without dropping the intake.
3. **Newsletter** — footer signup with `source: "Footer Newsletter"`, `participation: "newsletter-only"`.
4. **Gathering** — Stay in the Loop with `source: "Gathering Stay in the Loop"`, `participation: "gathering-rsvp"`.
5. **Connector** — `source: "Connector Application"`, `participation: "connector-interest"`.
6. **Key Guide** — `source: "Key Guide Application"`, `participation: "key-guide-interest"`.
7. **Failure honesty** — force a non-2xx webhook response (ops side) and confirm the public UI does **not** show success.

Exact JSON shapes: `docs/external-integration-handoff.md`.
