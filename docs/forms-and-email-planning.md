# Forms and email planning (website layer)

Public forms in this repository collect data and show frontend states. Delivery, storage, and mail are **External implementation required** (see `external-integration-handoff.md`).

## Form inventory

| Page | Form | Frontend helper | Participation / source | User-facing success | User-facing failure |
| --- | --- | --- | --- | --- | --- |
| `share-your-key.html` | Share Your Key | inline `shareYourKey()` | `Main Intake Form` + preference code | “Thank you for sharing your key.” No publish promise. | Field errors + recoverable submit error |
| `gathering.html` | Stay in the Loop | `keymakersEmailSignupForm` | `gathering-rsvp` | On the updates list; details TBA | Invalid email / server / not configured |
| Footers (`about`, `get-involved`, `connectors`, `why-it-matters`) | Newsletter | `keymakersEmailSignupForm` | `newsletter-only` | “Thanks — you're on the list!” | Same as Gathering |
| `connectors.html` | Connector interest | `keymakersInterestForm` | `connector-interest` | Interest received; volunteer role; follow-up if a fit | Validation + recoverable submit error |
| `community.html` | Key Guide interest | `keymakersInterestForm` | `key-guide-interest` | Interest received; not a paid tier; follow-up | Validation + recoverable submit error |
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

- Already a Keymakers member? (`yes` / `no` / `not-sure`)
- I would like information about paid membership and Community Circle access (checkbox → `membershipInterest`)

Blocking decision: WVF may replace these two questions; do not add more fields until that is confirmed.
