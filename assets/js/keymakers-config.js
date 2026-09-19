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
     * When WVF provides a members-only Community Circle URL (Keyholder+),
     * set it here to show “Enter the Community Circle” on community.html.
     * Leave empty while member access is being scheduled.
     */
    COMMUNITY_CIRCLE_MEMBER_URL: '',
  };
  window.KEYMAKERS_CONFIG = KEYMAKERS_CONFIG;
})();
