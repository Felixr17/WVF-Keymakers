/**
 * Keymakers OS — shared webhook configuration for static HTML pages.
 * Keep in sync with NEXT_PUBLIC_N8N_WEBHOOK_DOMAIN in .env.local
 */
(function () {
  const N8N_WEBHOOK_DOMAIN = 'https://primary-production-a33d.up.railway.app';

  window.KEYMAKERS_CONFIG = {
    N8N_WEBHOOK_DOMAIN,
    N8N_INTAKE_WEBHOOK_URL: `${N8N_WEBHOOK_DOMAIN}/webhook/keymakers-intake`,
  };
})();
