/**
 * Keymakers — public "Enter the Community" entry resolver.
 *
 * The public site only decides whether to show one link to the community
 * application (HumHub). It never decides tiers, eligibility, or spaces;
 * HumHub shows each signed-in person only the spaces WVF has approved.
 *
 * Fails closed: any unknown mode or unsafe URL resolves to "disabled".
 */
(function (root) {
  const MODES = ['disabled', 'preview', 'live'];
  const DEFAULT_PREVIEW_HOSTS = ['localhost', '127.0.0.1'];
  const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

  const DISABLED = Object.freeze({
    mode: 'disabled',
    show: false,
    url: '',
    label: 'Community entry coming soon',
    isPreview: false,
  });

  function normalizeMode(value) {
    const mode = String(value || '').trim().toLowerCase();
    return MODES.includes(mode) ? mode : 'disabled';
  }

  /**
   * Returns origin + path only. Query strings, fragments, and credentials are
   * rejected so no token, record ID, role, or eligibility state can ride along.
   */
  function sanitizeCommunityUrl(value, mode) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    let parsed;
    try {
      parsed = new URL(raw);
    } catch (e) {
      return '';
    }
    if (parsed.username || parsed.password) return '';
    if (parsed.search || parsed.hash || raw.includes('?') || raw.includes('#')) return '';
    const isLocal = LOCAL_HOSTS.includes(parsed.hostname);
    const httpAllowed = mode === 'preview' && isLocal;
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && httpAllowed)) return '';
    return parsed.origin + parsed.pathname;
  }

  function resolveCommunityEntry(config, pageHostname) {
    const cfg = config || {};
    const mode = normalizeMode(cfg.COMMUNITY_MODE);
    if (mode === 'disabled') return DISABLED;

    const url = sanitizeCommunityUrl(cfg.COMMUNITY_URL, mode);
    if (!url) return DISABLED;

    if (mode === 'preview') {
      const extra = Array.isArray(cfg.COMMUNITY_PREVIEW_HOSTS) ? cfg.COMMUNITY_PREVIEW_HOSTS : [];
      const allowed = DEFAULT_PREVIEW_HOSTS.concat(extra.map((h) => String(h).trim().toLowerCase()));
      const host = String(pageHostname || '').trim().toLowerCase();
      if (!host || !allowed.includes(host)) return DISABLED;
      return { mode, show: true, url, label: 'Enter the Community (preview)', isPreview: true };
    }

    return { mode, show: true, url, label: 'Enter the Community', isPreview: false };
  }

  const api = { resolveCommunityEntry, sanitizeCommunityUrl, normalizeMode, MODES };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.KeymakersCommunity = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
