# Community Circle — public website handoff (HumHub pilot)

Written 11 October 2026. Applies to the public website repository (`Felixr17/WVF-Keymakers`).

The HumHub community, dashboard approval, and provisioning live in other systems. Their requirements are in `docs/external-integration-handoff.md` section 8 and are **External implementation required**. The Keymakers Dashboard and WVF AI workspaces were not available, so nothing was built there.

## How members reach the community

- HumHub is reached through a **normal HTTPS link**, not an iframe.
- Proposed address: **`https://community.wvf-ny.org`** (not yet approved; DNS unchanged).
- The website has **one** Community destination: the “Enter the Community” button on `community.html`, in the “Member conversations” section. It opens in the same tab.
- After sign-in, HumHub shows only the spaces that person belongs to. **HumHub space membership creates the tiered view.** The website makes no tier decision.
- **Registration and payment do not grant access.** Share Your Key, Connector or Key Guide interest, and Givebutter checkout never create a HumHub account. WVF staff approve access in the dashboard.
- The entry button stays in “coming soon” state until WVF approves the URL and the access process.

## What changed in this repository

| File | Change |
| --- | --- |
| `assets/js/keymakers-community.js` | New. Resolves the entry button from config. Fails closed. |
| `assets/js/keymakers-config.js` | `COMMUNITY_CIRCLE_MEMBER_URL` replaced by `COMMUNITY_URL: ''`, `COMMUNITY_MODE: 'disabled'`, `COMMUNITY_PREVIEW_HOSTS: []`. |
| `community.html` | Uses the resolver; shows “Community entry coming soon” when disabled; copy says access requires WVF approval and payment alone does not grant it. |
| `.env.example` | `NEXT_PUBLIC_COMMUNITY_URL=` and `NEXT_PUBLIC_COMMUNITY_MODE=disabled` placeholders. |
| `scripts/test-community-entry.mjs` | Tests for the resolver, shipped config, and page markup. |

The static site reads `keymakers-config.js`. The `NEXT_PUBLIC_*` names are documented for parity with a future build step and mean the same thing.

## Modes

| Mode | Behavior |
| --- | --- |
| `disabled` (default) | No link. Shows “Community entry coming soon.” |
| `preview` | Link shows only when the page is served from `localhost`, `127.0.0.1`, or a host listed in `COMMUNITY_PREVIEW_HOSTS`, with a “preview” label. On any other host it behaves as `disabled`. A static public site cannot authenticate testers, so preview is limited by host. |
| `live` | Shows “Enter the Community” linking to `COMMUNITY_URL`. |

Any unknown mode, empty URL, non-HTTPS URL (plain HTTP is allowed only for a `localhost` HumHub in preview), embedded credentials, query string, or fragment resolves to `disabled`. The link can only ever be a bare origin and path.

## What the website never exposes

No HumHub token, Baserow identifier, space ID, community role, tier, or eligibility state appears in the website config, in query parameters, or anywhere in browser code. The tests check this.

## Turning it on (after WVF approval)

1. Confirm HumHub is running at the approved URL with sign-in working.
2. For a staging check, set `COMMUNITY_MODE: 'preview'`, `COMMUNITY_URL: 'https://community.wvf-ny.org'`, and the staging hostname in `COMMUNITY_PREVIEW_HOSTS`.
3. For launch, set `COMMUNITY_MODE: 'live'`.
4. Run `node --test scripts/test-community-entry.mjs`. Update the “shipped config” test, which asserts `disabled`, in the same change.

## Testing

```bash
node --test scripts/test-community-entry.mjs
python3 -m http.server 8080   # then open http://localhost:8080/community.html
```

## Decisions WVF must make

1. Approve `community.wvf-ny.org` (or another address).
2. Approve the free vs. paid space matrix. The site currently says Key Carrier (free) does **not** include the Circle, while the proposed pilot gives approved free participants general spaces. The copy was left as-is until WVF decides.
3. Approve the public wording for “access requires WVF approval.”
4. Supply support and community-rules links for HumHub’s theme.
