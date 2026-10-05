# Keymakers Community Circle — implementation plan

Date: 5 October 2026.  
Prototype: HumHub 1.18.6, local only.  
This project is a sibling of the public website and of the Keymakers dashboard. It does not live inside either source tree.

## 1. Pre-edit inventory

Present in this environment:

| System | Location | Git |
| --- | --- | --- |
| Public website | `/workspace`, GitHub `Felixr17/WVF-Keymakers` | `main` at `f02365e`, clean at the start of this work |
| This Community Circle project | `/home/ubuntu/Keymakers Community Circle` | Separate from the website repo. Intended long-term path on Felix’s machine: a sibling of the dashboard and the WVF AI folder, not inside either |

Not mounted, so not inspected as source:

| System | Expected path | Status |
| --- | --- | --- |
| Keymakers dashboard | `/Users/felixr/Developer/Felix-OS/Dashboard WVF/Keymakers Dashboard` | External implementation required |
| WVF AI / n8n | `/Users/felixr/Developer/Felix-OS/WVF AI ` | External implementation required |
| Baserow, Givebutter admin, production email | Live services | Not used |

Documents read in the website repo: `AGENTS.md`, `README.md`, `docs/external-integration-handoff.md`, `docs/forms-and-email-planning.md`, `docs/maria-applicant-staff-workflow-spec.md`, `docs/prelaunch-phase-1.md`, `docs/multi-repository-workspace.md`, `community.html`, `get-involved.html`, `privacy.html`, `assets/js/keymakers-config.js`, and the color and type settings in `index.html`.

No separate style-preference file was in the repository or attached as its own document. The public site is the visual source: deep green `#0D281E` and `#062117`, cream `#FAF8F5` / `#FAF7F2`, gold `#D4AF37` / `#C5A059`, terracotta `#C25E38`, Lora for headings, Plus Jakarta Sans for text.

Dashboard membership fields could not be read from dashboard code. The fields below are the ones the website and Maria’s spec already propose.

## 2. Platform comparison

Checked against official repositories and docs on 5 October 2026. “Verified” means the official page or the shipped 1.18.6 source said so. It does not mean every item was clicked in a production install.

| | HumHub 1.18.6 | Discourse | NodeBB | BuddyPress |
| --- | --- | --- | --- | --- |
| License | Dual: AGPL-3.0-or-later or proprietary (`LICENSE` in the 1.18.6 package) | GPL-2.0-or-later (GitHub `discourse/discourse`) | GPL-3.0 (GitHub `NodeBB/NodeBB` README) | GPL, as a WordPress project (developer.buddypress.org) |
| Self-host | PHP 8.2–8.4, MariaDB 10.11+ or MySQL 8+, Apache or nginx | Docker, PostgreSQL, Redis. Official install guide | Node.js, Redis or MongoDB or PostgreSQL | WordPress + PHP + MySQL |
| Profiles | Custom profile fields in core | User fields, lighter than a directory | Basic user profiles | xProfile in core |
| Private spaces | Space visibility private / members / public | Groups and categories | Private groups, category privileges | Group status public, private, hidden |
| Approval | `auth.needApproval`; pending users cannot sign in | Staff approval settings | Registration and privilege plugins | WordPress registration plus group requests |
| Moderation | Draft state in core. Report Content is a separate free module, not bundled | Strong flags and review | Flags and privileges | Weaker than Discourse; depends on plugins |
| Calendar | Free Calendar module, not in the core package | Events in current API docs | Not core | Not core |
| Resource library | Files in core are permission-checked. Wiki is a free module, not bundled | Topics and uploads | Categories and uploads | Not core |
| Skills directory | Not a product feature. Custom fields can hold skills | Not core | Not core | Can be modeled with xProfile |
| Private messages | Free Messenger module, not bundled | Core personal messages | Core chat | Core messages component |
| Email digest | Core intervals include weekly (`MailSummary::INTERVAL_WEEKLY`) | Core | Digest is not the core product | Needs mail tooling around WordPress |
| REST | Free REST module, beta, not bundled | Core JSON API | Core read/write API | `/buddypress/v1` |
| JWT or SSO | Free JWT SSO module, not bundled. It is the HumHub half of SSO | DiscourseConnect SSO in the API client | SSO on the product site; bearer tokens in core | Cookie auth. JWT is not core |
| Mobile | Responsive web. A native app was not evaluated | Responsive web | Responsive web | Depends on the WordPress theme |
| Export / deletion | Admin user export. Member account deletion when enabled. Soft delete | User export and delete | GDPR positioning on the product site | WordPress export/erase tools |
| Upgrade | Packaged updater or manual replace, restore config, modules, theme, uploads | Docker rebuild. Heavier Ruby/Ember stack | `./nodebb upgrade` | WordPress, BuddyPress, theme, and plugins move together |
| Hosting cost | Self-host on a small VM. No official hosted price was verified | Official hosting exists; self-host is a VM plus Postgres and Redis | Self-host or NodeBB hosting | Self-host is a WordPress bill |
| Maintenance | PHP and MariaDB patches, module updates, backups | Higher: Ruby, Ember, Postgres, Redis, container rebuilds | Node and database patches | Highest ongoing patch surface because of WordPress plugins |
| Baserow / n8n / dashboard | Server-side module or the free REST module. This prototype uses an in-process adapter | Clean API and SSO, but the product is a forum | API is real, shape is a forum | REST exists; cookie auth is a poor fit for n8n |

## 3. Recommendation

Use HumHub for the first staging prototype.

Keymakers needs profiles, private rooms, skills, resources, and events. Discourse and NodeBB are discussion products first. BuddyPress can model profiles and groups, and it adds a WordPress patch load WVF does not need for this member network.

No significant blocker turned up. These are gaps, not reasons to switch:

- Skills are custom profile fields plus the Skills Exchange space. There is no HumHub “skills directory” product.
- First-post review is not a core switch. Core has drafts. The WVF module holds the first post as a draft.
- Calendar, wiki, messenger, report content, REST, and JWT SSO are free marketplace modules. They were not installed here, so they are not claimed as running.
- Two-factor authentication was not in the core module list of the 1.18.6 package. Do not claim MFA is on.

## 4. Hosting requirements

Staging and production can each be one small Linux VM:

- 2 vCPU, 4 GB RAM, 40 GB disk is enough to start
- PHP 8.3, nginx or Apache, MariaDB 10.11
- TLS
- Cron for the queue and the weekly summary, only after mail is approved
- Backups of the database and `uploads/`

This VM had no Docker. The running prototype is PHP’s built-in server on `127.0.0.1:8891` plus local MariaDB. That is staging-on-a-workstation, not the production process model.

## 5. Local and staging architecture

```
Public website (unchanged, URL still empty)
        |
        |  no link until WVF approves
        v
n8n -> Baserow -> dashboard review
        |
        |  server-side adapter, not built against production
        v
HumHub 1.18.6
  themes/Keymakers          child theme variables
  modules/keymakers_membership
  runtime/humhub            gitignored upstream package
```

Integration is not an iframe.

## 6. Role and permission matrix

| Person | HumHub status in this prototype | Private spaces | Post, comment, message |
| --- | --- | --- | --- |
| Public visitor | No account. Guest access off | No | No |
| Registered applicant | Need approval. Cannot sign in | No | No |
| Approved, not yet eligible | Enabled, onboarding page only | No | No |
| Active Keyholder or above | Enabled, member of the five general spaces | Yes, after the dashboard flag and a paid tier | Yes, after name and visibility consent. First post is drafted |
| Connector | Service role on top of an active member | General spaces plus Connector Network | Same as an active member |
| Key Guide | Service role on top of an active member | General spaces, Connector Network, and Key Guide Support | Same as an active member |
| Moderator | Staff group. Not a paid tier | General and service spaces, as moderator | Can review the queue. No payment action exists |
| WVF administrator | HumHub admin group | All staging spaces | Can provision and suspend. MFA is not configured |
| Suspended member | Disabled. Audit row kept | No | Cannot sign in |

Key Carrier never becomes active. A Keyholder tier with `dashboardEligibilityActive` false stays approved and ineligible. Connector and Key Guide do not change the tier.

## 7. Approval and moderation flow

```
Registration or checkout
  -> n8n validates and routes (external)
  -> Baserow stores the person (external)
  -> Maria reviews in the dashboard (external)
  -> dashboard records community access
  -> provisionMember
  -> HumHub account
  -> activation email (not sent in this phase)
  -> getProvisioningStatus back to the dashboard (not wired)
```

Givebutter does not create the account. The policy test `testGivebutterTierAloneDoesNotGrantAccess` locks that.

First-post review is on by default. Set `keymakers_membership.holdFirstPost` to false later if WVF wants every ordinary post to publish immediately. Reports stay on.

## 8. Profile schema

Shown to members:

- Name (HumHub first and last name)
- Profile photo (HumHub core, no photo was uploaded for synthetic users)
- Business or organization
- Short biography (`about`)
- Location label, written by the member, not a street address
- Industry
- Business stage
- Skills offered
- Skills requested
- Community interests
- Connector status
- Key Guide status
- Membership access status (pending, approved but not active, active, suspended)
- Profile visibility consent

Hidden on the staged HumHub profile fields: street, ZIP, city, country, state, phone fields, fax, birthday, gender.

Rejected by the adapter if a caller tries to sync them: payment status, amount, Givebutter id, internal notes, CDFI, ethnicity, phone, street, address, postal code, application answers, staff decision.

## 9. Space structure

| Space | Who is a member | Who can post |
| --- | --- | --- |
| Welcome and Announcements | Active members and staff | Staff |
| Member Conversations | Active members and staff | Active members |
| Skills Exchange | Active members and staff | Active members |
| Events and Webinars | Active members and staff | Staff in this prototype |
| Opportunities and Resources | Active members and staff | Staff in this prototype |
| Connector Network | Connectors, Key Guides, staff | Those members |
| Key Guide Support | Key Guides and staff | Those members |

All seven are HumHub private spaces (`visibility = 0`). Join policy is invite-only, and membership is added by the adapter.

Events, recordings, and a resource library are not separate HumHub apps yet. The rooms exist. Calendar and Wiki were not installed.

## 10. Integration adapter contract

`adapter/src/CommunityCircleGateway.php`

- `provisionMember`
- `suspendMember`
- `restoreMember`
- `assignRole`
- `removeRole`
- `syncProfile`
- `getProvisioningStatus`

Identity is `externalPersonId`. Email can change without a second account. A second person with the same email is rejected. Calls are idempotent. Suspend keeps the audit record. Restore uses the latest tier and dashboard flag, so a lapsed member does not come back as active.

The HumHub module applies the same policy to users, groups, and space membership. It is not connected to production Baserow, n8n, or email.

## 11. Privacy and security risks

- The whole Circle must stay `noindex`. Staging sends `X-Robots-Tag: noindex, nofollow, noarchive` and `robots.txt` disallows `/`. HumHub also writes a canonical URL on the login page; noindex is what blocks indexing.
- Uploaded files go through `File::canView()`. A guest request for a missing file returned 404. A real private file was not uploaded, so a successful private download was not demonstrated.
- Backups will contain private posts. Access has to be limited to host operators.
- Admin accounts are individual in the fixture set, and MFA is not on.
- The weekly summary setting is stored (`mailSummaryInterval = 3`). Cron is not installed and mail is file transport, so no digest was sent.
- Do not send Circle content to a third-party AI service. AI replies are out of scope.
- Search UI is in the member shell. A query did not return the staging post in this pass, so search results are not claimed as verified.
- This workstation server is not a hardened staging host.

## 12. Estimated monthly operating cost

Self-host estimate for a small nonprofit VM, not a quote:

- Staging or production VM: about $20–40 / month
- Disk backups: about $5–10 / month
- Email: $0 if WVF’s existing mail is used later; otherwise a small transactional plan
- HumHub community modules used here: $0
- DNS for a subdomain of a domain WVF already has: $0 extra

A reasonable first bill is about $25–60 / month before staff time. Official HumHub or Discourse hosted prices were not verified, so they are not listed.

## 13. Estimated remaining implementation

About 50–70 hours of engineering after this prototype, mostly outside this repo:

- Install and retest Calendar, Wiki or file library, Messenger, and Report Content: 6–10 hours
- Theme and mobile polish against the real HumHub header: 6–8 hours
- Search index check and weekly digest cron on a real host: 3–4 hours
- Dashboard and n8n wiring in those external projects: 16–24 hours
- Activation and suspension email, still not production: 4–6 hours
- MFA once a supported module is chosen: 4–6 hours
- Backup job and a restore drill: 4–6 hours
- DNS, TLS, and the staging VM after approval: 4–6 hours

Counsel still has to approve guidelines, retention, and the privacy page. That is not engineering time.

## 14. Screenshots

Taken from the local prototype in a browser at 1280×900 and 390×844:

- Sign-in, desktop and mobile
- Approved but not eligible onboarding, desktop and mobile
- Member Conversations with the released first post and the later post
- Moderation queue
- Connector Network empty state

They are attached to the website pull request. The public site was not opened as the Circle.

## 15. Test results

Adapter, 11 tests, `php adapter/bin/run-tests.php`: all passed.

HumHub `php yii keymakers-membership/self-test`: all passed, including private spaces, pending and suspended accounts, connector and Key Guide separation, hidden phone and street fields, first-post draft, release, immediate second post, and a report row.

HTTP checks against `127.0.0.1:8891`:

- Guest `/` and `/s/welcome-and-announcements` redirect to login
- `robots.txt` is `Disallow: /`
- Login response includes `noindex` and `X-Robots-Tag`
- Pending sign-in returns to login with “not approved”
- Suspended sign-in returns to login with “disabled”
- Approved unpaid dashboard and people URLs redirect to onboarding
- Active member receives 200 on Member Conversations
- Active member receives 403 on Key Guide Support
- Connector receives 403 on Key Guide Support
- Active member receives 403 on the moderation queue
- Moderator receives 200 on the moderation queue
- No live email was sent

## 16. Decisions that need WVF approval

1. Create the GitHub repository for this sibling project and move it out of the workstation path.
2. Approve `community.keymakers.womensventurefund.org` before any DNS change.
3. Leave `COMMUNITY_CIRCLE_MEMBER_URL` empty until that host, the access rules, and the staff workflow are accepted.
4. Confirm Maria, or another named owner, is the reviewer who sets community access.
5. Confirm Keyholder, Keysmith, Key Shaper, and Key Circle all share the same Circle spaces.
6. Approve the first-post queue, or set `holdFirstPost` to false.
7. Approve guidelines, retention, and who may read backups.
8. Choose whether to install the free Calendar, Wiki, Messenger, Report Content, REST, and JWT modules.
9. Choose an MFA approach for individual administrator accounts.
10. Approve staging SMTP before any activation email is sent.
11. Do not import production members for the pilot.

## 17. Browser steps still open

Command-line setup was used for branding, closed registration, spaces, roles, profile fields, and synthetic accounts. No browser step was used to create a production account, turn on live email, change DNS, mint a permanent API credential, or publish member content.

Still for a person, after approval:

- Create the DNS record
- Issue TLS
- Confirm marketplace modules before installing them
- Turn on MFA
- Replace synthetic staff with named WVF accounts
- Send the first real activation email

## 18. Production confirmation

No production member record was read or written. Baserow, n8n, Givebutter, and production email were not changed. The public website’s Community Circle URL is still empty. The staging database contains only the synthetic accounts created by `config/synthetic-accounts.json`.
