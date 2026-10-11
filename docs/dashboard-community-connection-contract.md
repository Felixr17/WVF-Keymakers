# Dashboard ↔ Community Circle (HumHub) connection contract

**Status:** proposed contract for the future Keymakers Dashboard adapter. **External implementation required** in the Keymakers Dashboard repository. Nothing in this document is built in the dashboard, Baserow, or n8n yet.

Pilot package: `community/humhub/` (HumHub 1.18.6, REST API module 0.11.7). Policy source: `community/humhub/config/access-matrix.json`. Space list: `community/humhub/config/spaces.json`. Both are proposed and WVF may change them before production.

## Boundaries

- **The public website does not calculate eligibility and does not call the HumHub REST API.** It has one plain HTTPS link to the HumHub sign-in page (`assets/js/keymakers-community.js`) and carries no tier, candidate ID, Baserow ID, email, role, or eligibility in that link or anywhere in browser code or storage.
- **The dashboard** decides eligibility (deterministically, from the matrix), records the staff decision, and is the **only** system that calls the HumHub REST API, from its server with a token held in server-side secrets.
- **HumHub** holds accounts and space memberships. Space membership is what creates the tiered view.
- **n8n / Baserow** may record payment and registration facts the dashboard reads. They never call HumHub directly.

## Inputs (per request)

| Field | Type | Notes |
| --- | --- | --- |
| `candidateId` | string | Dashboard/Baserow record ID. Stored only in the dashboard; never sent to the website. |
| `email` | string | Normalized: trimmed, lower-cased. Used to find an existing HumHub user. |
| `displayName` | object `{firstname, lastname}` | The **approved** display name, not raw form input. |
| `registrationStatus` | enum | `Pending`, `Approved`, `Declined`. Only `Approved` qualifies. |
| `participationLevel` | enum | `general` or `paid`, derived from the public tier (`publicTierMapping`). |
| `paymentStatus` | enum | `NotRequired`, `Pending`, `Verified`, `Failed`, `Refunded`. Paid spaces need `Verified` when payment is required. |
| `membershipStatus` | enum | `Active`, `Lapsed`, `Cancelled`, `None`. Paid spaces need `Active`. |
| `communityAccessStatus` | enum | One of the lifecycle states below. |
| `connectorRole` | enum | `None`, `Interested`, `Approved`. Only `Approved` adds the Connector Hub. |
| `keyGuideRole` | enum | `None`, `Interested`, `Approved`. Only `Approved` adds the Key Guide Hub. |
| `staffAssignment` | boolean | Explicit only. Never inferred from an email domain. |
| `staffDecision` | enum | `approve`, `suspend`, `revoke`, `restore`, `retry`. |
| `staffIdentity` | string | The authenticated staff user making the decision. |
| `reason` | string | Required for suspend and revoke; recorded in the audit log, not sent to HumHub. |
| `idempotencyKey` | string | Unique per staff decision (for example a UUID stored with the decision). |

Unknown, missing, or conflicting values grant nothing. Registration alone, payment alone, Connector interest, and Key Guide interest never grant access.

## Policy (from `access-matrix.json`)

- **General spaces** (Welcome & Announcements, Community Circle, Share Your Key, Microloan Resources): `registrationStatus = Approved` **and** the staff approved community access.
- **Paid adds** Paid Member Circle: the above **and** `participationLevel = paid` **and** payment verified when required **and** `membershipStatus = Active`.
- **Connector Hub**: general requirements **and** `connectorRole = Approved`.
- **Key Guide Hub**: general requirements **and** `keyGuideRole = Approved`.
- **WVF Staff**: `staffAssignment = true` only.

Roles are independent of participation level and of each other.

## Actions

| Action | Effect | HumHub REST 0.11.7 operations |
| --- | --- | --- |
| **Preview** | Read-only. Computes intended spaces and the diff against HumHub. Changes nothing. | `GET /api/v1/user/get-by-email`, `GET /api/v1/space/{id}/membership` |
| **Provision** | After staff approval: find or create the user, ensure the account is enabled, add intended memberships. | `GET /user/get-by-email`, `POST /user`, `PUT /user/{id}` (`account.status = 1`), `POST /space/{id}/membership/{userId}?silent=true&canLeave=0` |
| **Add / remove spaces** | Apply a changed matrix result (for example, membership lapsed). | `POST` / `DELETE /space/{id}/membership/{userId}` |
| **Suspend** | Disable the account and end sessions. Memberships are kept for a possible restore. | `PUT /user/{id}` (`account.status = 0`), `DELETE /user/session/all/{id}` |
| **Revoke** | Disable the account, end sessions, remove every pilot-space membership. The HumHub account is **not** deleted (`deleteAccount: false`), to keep the audit trail. | `PUT /user/{id}`, `DELETE /user/session/all/{id}`, `DELETE /space/{id}/membership/{userId}` |
| **Retry** | Re-run the last failed action with the same idempotency key. | As the original action. |
| **Inspect error** | Show the sanitized error and the last attempt time. | None |

Every operation above is listed in the REST 0.11.7 OpenAPI files, and the pilot exercised all of them locally (`community/humhub/scripts/verify-openapi.sh`, `pilot.py sync`). Anything else (for example, sending welcome emails, setting space permissions, or creating tokens) stays a **manual administrator step** until an endpoint is confirmed in the installed module's OpenAPI files.

New users are created with a random password that nobody knows and `mustChangePassword`; the person sets their own password through HumHub's password reset once outbound email is approved. Until then, account delivery is a manual WVF step.

## Outputs (per request)

| Field | Notes |
| --- | --- |
| `humhubUserId` | HumHub's numeric user ID (external ID stored on the dashboard record). |
| `confirmedSpaceIds` | Space IDs HumHub reports the user holds **after** the action (read back, not assumed). |
| `result` | `preview`, `enabled`, `suspended`, `revoked`, `noChange`, `failed`. |
| `syncedAt` | ISO 8601 timestamp of the read-back. |
| `error` | Sanitized: HTTP status, operation name, HumHub validation field names. **Never** the token, password, request headers, or full response bodies. Max 300 characters. |
| `idempotencyResult` | `applied` (first time), `replayed` (same key already applied; stored result returned), or `conflict` (same key, different input; nothing done). |

## Lifecycle

| State | Meaning | HumHub |
| --- | --- | --- |
| Not requested | No access requested or considered. | No account. |
| Pending approval | Awaiting staff review. | No account change. |
| Approved | Staff approved; provisioning not yet run. | No account change yet. |
| Provisioning | Adapter is applying the action. | In progress. |
| Enabled | HumHub confirms the account is enabled and holds every intended space. | `status = 1`, memberships match. |
| Provisioning failed | An operation failed. Partial results are recorded; retry is safe. | Possibly partial. |
| Suspended | Staff suspended access. | `status = 0`, sessions ended, memberships kept. |
| Revoked | Staff revoked access. | `status = 0`, sessions ended, all pilot-space memberships removed, account kept. |

`Enabled` is set only after a read-back confirms it. A failure at any step leaves the record in `Provisioning failed` with the sanitized error.

## Idempotency and retries

- Before any write, read HumHub's current state and compute the difference. Re-running an action with no difference makes no writes.
- Users are matched by normalized email before creation, so a retry never creates a duplicate.
- Store `idempotencyKey`, the input hash, and the result. Same key and same input returns the stored result; same key and different input is a `conflict`.
- Order: enable account → add memberships → remove memberships → disable account and end sessions. This is the order the pilot verified.
- The pilot showed a partial failure (space 7 of 8 rejected) followed by a clean retry that reused the six existing spaces.

## Configuration the dashboard will need (server-side only)

- `HUMHUB_API_BASE_URL` (for example `https://community.wvf-ny.org`)
- `HUMHUB_API_TOKEN` (Bearer token for a dedicated service administrator, with an expiration date)
- `HUMHUB_WELCOME_SPACE_ID`, `HUMHUB_GENERAL_SPACE_ID`, `HUMHUB_PAID_SPACE_ID`, `HUMHUB_SHARE_KEY_SPACE_ID`, `HUMHUB_CONNECTOR_SPACE_ID`, `HUMHUB_KEY_GUIDE_SPACE_ID`, `HUMHUB_MICROLOAN_SPACE_ID`, `HUMHUB_STAFF_SPACE_ID` (the names match `dashboardEnvVar` in `spaces.json`; values come from `state/space-ids.json` after `pilot.py spaces`)
- A kill switch that keeps all writes disabled until WVF approves.

None of these values belong in the website repository, `keymakers-config.js`, HTML, JavaScript, query strings, or browser storage.
