/**
 * Keymakers OS — shared webhook configuration for static HTML pages.
 * Keep in sync with NEXT_PUBLIC_N8N_WEBHOOK_DOMAIN in .env.local
 */
(function () {
  const KEYMAKERS_CONFIG = {
    ...window.KEYMAKERS_CONFIG,
    GIVEBUTTER_ACCOUNT_ID: 'c0DdlWYvuGmd2igp',
    GIVEBUTTER_CAMPAIGN: 'keymakers-campaign',
    GIVEBUTTER_CAMPAIGN_URL: 'https://givebutter.com/keymakers-campaign',
    /** Share Your Key + newsletter / Gathering RSVP (n8n keymakers-intake). */
    N8N_INTAKE_WEBHOOK_URL: 'https://primary-production-a33d.up.railway.app/webhook/keymakers-intake',
    /**
     * Community Circle entry (HumHub, proposed https://community.wvf-ny.org).
     * Mirrors NEXT_PUBLIC_COMMUNITY_URL / NEXT_PUBLIC_COMMUNITY_MODE.
     * Modes: 'disabled' (shows "coming soon"), 'preview' (link only on
     * COMMUNITY_PREVIEW_HOSTS + localhost), 'live' (link for everyone).
     * The URL must be a bare https origin/path: no query string or fragment.
     * Access, tiers, and spaces are decided by WVF staff and HumHub, never here.
     * Keep 'disabled' until WVF approves the URL and the access process.
     */
    COMMUNITY_URL: '',
    COMMUNITY_MODE: 'disabled',
    COMMUNITY_PREVIEW_HOSTS: [],
  };
  window.KEYMAKERS_CONFIG = KEYMAKERS_CONFIG;
})();
