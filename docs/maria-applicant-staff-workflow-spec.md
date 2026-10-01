# Maria’s applicant / staff workflow — mockup specification

**This is a specification, not an implementation.**  
Do not build a dashboard, staff queue, or fake admin UI inside this website repository. Dashboard work is **External implementation required.**

Maria is the named staff owner for applicant review in this spec. Confirm the actual owner before automation goes live.

---

## Public website (this repository) — applicant-facing

Applicants never see a staff queue. They see:

1. **Share Your Key** (`share-your-key.html`)
   - Short intake + optional membership questions
   - Success: “Thank you for sharing your key.” WVF will contact them if there is a potential next step. Nothing is published without a further conversation and permission.
   - Failure: validation or “we couldn’t submit” with fields preserved
2. **Connector / Key Guide interest**
   - Success: interest received; role of service; follow-up if there is a fit
   - Copy states they should already be Keymakers (Connector) or experienced Keymakers/Connectors (Key Guide)
3. **Paid membership**
   - Checkout is Givebutter
   - After-you-join copy explains that Community Circle access is scheduled after Keyholder+ is confirmed — not a login on the public site
4. **No public application-status portal**
   - Status, assignment, and notes are staff-only
   - If a future “check my submission” page is desired, it belongs in the dashboard repo with authentication

---

## Staff dashboard (separate repository) — mockup screens

Implement these screens in the Keymakers dashboard when that repo is available.

### M1. Intake inbox

- Filters: New, In review, Waiting on applicant, Ready to feature, Declined / not a fit, Duplicate
- Columns: received time, name, email, participation label, already-member, membership-interest, source page
- Click-through to a record detail
- Bulk: assign to Maria or another reviewer

### M2. Applicant record (Share Your Key)

- Contact fields and key description (read-only from website payload)
- Participation preference shown as the **public label**, not only the legacy code
- Timeline: submitted → staff notified → applicant emailed → review notes
- Actions (staff-only):
  - Request more information (triggers email — external)
  - Mark as candidate for story / video / Gathering / mentor
  - Link to an existing Baserow person if email matches a member
  - Do **not** publish to the website from this screen without a separate editorial workflow

### M3. Membership match

- If Givebutter/n8n later tags the same email as Keyholder+, show “Paid member — Community Circle eligible” on the record
- Key Carrier (free) is not eligible
- Staff can still note “invite to join Keyholder” when `membershipInterest` is true

### M4. Connector & Key Guide queue

- Separate from story intake
- Prerequisite checklist: already a Keymaker? (from form)
- Decision: interested / interview / appointed / not now
- Appointing a Key Guide must **not** change membership tier

### M5. Staff notification preferences

- Immediate email on new Share Your Key
- Daily digest optional for newsletter and Gathering list
- Escalation if a record sits in New > 5 business days

---

## State machine (staff)

```
submitted (website success)
    → staff notified (email/n8n)
    → in_review (Maria)
        → more_info_requested
        → candidate (story | video | gathering | mentor | connector | key-guide)
        → not_a_fit
        → duplicate
```

Website success ≠ `candidate`. Publication is a later editorial step.

---

## Data Maria needs from the website payload

| Field | Why |
| --- | --- |
| Name, email, phone | Contact |
| Business | Context |
| Key description | Editorial fit |
| Participation | Route to story vs. video vs. Gathering vs. mentor |
| alreadyMember | Skip vs. invite to membership |
| membershipInterest | Community Circle / Keyholder follow-up |
| Source | Which public form |

---

## Out of scope for this website repo

- Authentication
- Baserow UI
- Sending the emails described above
- Auto-posting approved stories to `stories.html`
- Granting Community Circle URLs

Those remain **External implementation required.**
