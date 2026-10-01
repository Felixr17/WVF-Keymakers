# Site-wide image replacement manifest

Licensed Unsplash and editorial stand-in portraits are **atmosphere only** unless the filename is a verified WVF/Keymaker likeness. Do not caption stock or mismatched faces as named members, Key Guides, or event documentation.

Page-level detail:

- `assets/images/stories/ASSET_MANIFEST.md`
- `assets/images/community/ASSET_MANIFEST.md`

Replace files in place (same basename, WebP + JPEG where the page uses `<picture>`). Update alt text when the real photograph changes who or what is shown.

## Replacement rules

1. Named people require approved WVF photography of that person.
2. `assets/images/keymakers/*` portraits that do not match the named person must not be reused as “this is [Name]” once a verified photo exists. Until then, alt text should stay generic on pages that use them as editorial texture (Get Involved cards) and specific only where the page already identifies the person and WVF has accepted the current file.
3. Gathering crowd / networking / collaborate stills may include mixed groups; do not label them as Keymakers-only documentation if they are stock.
4. Homepage `hero-editorial.webp` is reserved for Home.
5. Community and Stories heroes must remain distinct from each other and from Home.
6. Do not generate or download replacement photos in this repository without WVF-supplied files.

## Slot index

| Slot ID | Current file(s) | Used on | Role | Keep / replace | Alt-text intent | Preferred replacement |
| --- | --- | --- | --- | --- | --- | --- |
| `home-hero` | `hero-editorial.webp` | `index.html` | Homepage hero | Replace when WVF supplies a distinct editorial portrait | Warm editorial portrait; do not invent a name | WVF-owned hero, faces clear of left copy |
| `home-gathering` | `gathering-crowd.webp` | `index.html` Gathering band | Atmosphere | Replace with Gathering photography when available | Event crowd energy; do not name people | WVF Gathering photo, women-centered |
| `stories-hero` | `stories/hero.webp` | `stories.html` | Stories hero | Unsplash; replace | Unlabeled studio/work scene | WVF story-session still |
| `stories-featured-tamiko` | `stories/featured-tamiko.webp`, `tamiko-maldonado.webp` | `stories.html` | Verified story media | Keep until higher-res WVF stills | Tamiko Maldonado / Tamico Dancing | Official stills from WVF |
| `stories-themes` | `stories/theme-*.webp` | `stories.html` | Theme tiles | Unsplash; replace | Scenic, unlabeled | WVF theme photography |
| `stories-cta` | `stories/cta-share.webp` | `stories.html` | Share CTA | Unsplash; replace | Group from behind; do not imply membership | WVF community still, not the Community `join` photo |
| `community-hero` | `community/hero.webp` | `community.html` | Community hero | Unsplash; replace | Women together outdoors; unnamed | Conversation among women founders; left third clear for type |
| `community-guides` | `community/key-guides.webp` | `community.html` | Key Guides band | Unsplash; replace | Two people in conversation; do not call them Key Guides | Mentorship conversation, not a headshot grid |
| `community-join` | `community/join.webp` | `community.html` | Join CTA | Unsplash; replace | Group at sunset; do not imply they are members | Distinct from Stories CTA |
| `gathering-hero-row` | `gathering-crowd.webp`, `gathering-networking.webp`, `gathering-collaborate.webp` | `gathering.html`, `get-involved.html` | Event atmosphere | Replace with official Gathering assets | Workshops / crowd; mix of people | WVF event photos, women-centered where possible |
| `share-hero` | `keymakers/loretta.webp` | `share-your-key.html` | Hero | Confirm likeness or replace | Only name Loretta if verified | Verified WVF portrait |
| `connectors-portraits` | `keymakers/brenda-braxton.webp`, `angela-long.webp`, `nikki.webp`, `michelle.webp` | `connectors.html`, `get-involved.html` | Named or editorial cards | Confirm each likeness | Named alt only when verified | Official headshots per person |
| `tier-emblems` | `Key_Carrier.svg`, `Keyholder.svg`, `Keysmith.svg`, `Key_Shaper.svg`, `Key_Circle.svg` | Membership rows | Brand | Keep | Empty alt on linked text, or “{tier} membership” | No photo replacement |
| `logo` | `Keymakers_Logo.svg` | Global | Brand | Keep | Keymakers | — |
| `og-share` | referenced `og-share-card.png` — **file missing** | All pages OG/Twitter | Social preview | **Create/supply 1200×630** | — | WVF-designed share card |

## Missing asset

`https://keymakers.womensventurefund.org/assets/images/og-share-card.png` is referenced in page metadata but is not in this repository. Supplying the file is website-only once WVF provides artwork. Do not invent a branded social card without design approval.

## Duplicate / unused files to review (do not delete in this phase)

- `assets/images/tamico-maldonado.png` and `tamiko-maldonado.png` (legacy PNG sources)
- JPEG siblings next to WebP where `<picture>` needs both
