# Keymakers theme for HumHub 1.18

A minimal child theme of HumHub's base theme (`$baseTheme: "HumHub"`). It changes branding only. No HumHub core files are modified.

## What it changes

- **Colors:** WVF deep green `#0D281E` as primary, gold `#C5A059` as accent, cream `#FAF8F5` background, dark green-grey body text. `$min-contrast-ratio: 4.5` makes Bootstrap's `color-contrast()` pick text colors that meet WCAG AA.
- **Type:** Plus Jakarta Sans for body text and Lora for headings, with system fallbacks. No third-party font requests: the fonts are used only if already installed.
- **Focus and targets:** visible `:focus-visible` outlines; footer links are at least 44 px tall and stack on small screens.
- **Logo:** `resources/img/keymakers-logo.svg` plus the site name. A logo uploaded in **Administration › Settings › Appearance** takes precedence.
- **Footer links** on the sign-in page, the dashboard sidebar, and the footer navigation: *Return to Women's Venture Fund*, *Community Rules*, *Privacy*, and *Support*. URLs come from `.env` (`KEYMAKERS_RETURN_URL`, `KEYMAKERS_RULES_URL`, `KEYMAKERS_PRIVACY_URL`, `KEYMAKERS_SUPPORT_URL`). Only `https:` and `mailto:` values become links; anything else shows "(coming soon)".
- **Sign-in notice:** "The Keymakers Community Circle is invitation-only. Accounts are created by Women's Venture Fund after review and approval…", plus a line saying registering, sharing a key, or paying does not create an account.
- **Head:** `theme-color` and `robots: noindex, nofollow`, so the pilot is not indexed.

## Files

| File | HumHub view it overrides |
| --- | --- |
| `scss/variables.scss`, `scss/build.scss`, `scss/_root.scss`, `scss/_theme.scss` | Theme SCSS, compiled by HumHub |
| `views/layouts/head.php` | Empty head hook (`@humhub/views/layouts/head.php`) |
| `views/widgets/logo.php` | `humhub/widgets/views/logo.php` |
| `views/widgets/footerNavigation.php`, `footerNavigation_login.php`, `footerNavigation_sidebar.php` | `FooterMenu` templates (copies of the 1.18.6 core templates plus the Keymakers links) |
| `views/widgets/_keymakersLinks.php` | New partial used by the footer templates |

When upgrading HumHub, compare the overridden footer and logo templates with the new core versions.

## Activate

```bash
cd community/humhub
./scripts/install-theme.sh
```

or manually: copy this folder to `/data/themes/Keymakers` in the HumHub container, then **Administration › Settings › Appearance › Theme › Keymakers** (or `php yii theme/switch Keymakers`).

## Verification status

Checked on the local pilot: `theme/info` reports *Keymakers* derived from *HumHub*; the compiled CSS contains `--bs-primary: #0D281E` and the `km-*` classes; the sign-in page HTML contains the logo, the invitation-only notice, and the four links. See the repository's completion notes for whether a visual browser check was done.
