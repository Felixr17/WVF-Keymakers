/**
 * Keymakers OS — shared webhook configuration for static HTML pages.
 * Keep in sync with NEXT_PUBLIC_N8N_WEBHOOK_DOMAIN in .env.local
 */
(function () {
  const KEYMAKERS_CONFIG = {
    ...window.KEYMAKERS_CONFIG,
    GIVEBUTTER_ACCOUNT_ID: 'c0DdlWYvuGmd2igp',
    GIVEBUTTER_CAMPAIGN: 'keymakers-campaign',
    GIVEBUTTER_CAMPAIGN_URL: 'https://live.givebutter.com/c/keymakers-campaign',
    N8N_INTAKE_WEBHOOK_URL: 'https://primary-production-a33d.up.railway.app/webhook/keymakers-intake'
  };
  window.KEYMAKERS_CONFIG = KEYMAKERS_CONFIG;
})();
