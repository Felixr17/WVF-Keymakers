/**
 * Shared email signup for Gathering RSVP and footer newsletters.
 * Success is shown only when the n8n webhook returns a successful HTTP response.
 */
(function (global) {
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function isValidEmail(value) {
    const email = normalizeEmail(value);
    return email.length > 0 && email.length <= 254 && EMAIL_PATTERN.test(email);
  }

  function getWebhookUrl() {
    const url = global.KEYMAKERS_CONFIG && global.KEYMAKERS_CONFIG.N8N_INTAKE_WEBHOOK_URL;
    return url && String(url).trim() ? String(url).trim() : '';
  }

  /**
   * @param {object} options
   * @param {string} options.email
   * @param {string} options.source - human-readable source label
   * @param {string} options.participation - e.g. newsletter-only | gathering-rsvp
   * @param {string} [options.honeypot]
   */
  async function submitEmailSignup(options) {
    const email = normalizeEmail(options && options.email);
    const honeypot = String((options && options.honeypot) || '').trim();

    if (honeypot) {
      return { ok: false, error: 'spam' };
    }
    if (!isValidEmail(email)) {
      return { ok: false, error: 'invalid_email' };
    }

    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      return { ok: false, error: 'not_configured' };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        source: options.source || 'Email signup',
        participation: options.participation || 'newsletter-only',
        email,
      }),
    });

    if (!response.ok) {
      return { ok: false, error: 'server' };
    }

    return { ok: true };
  }

  function keymakersEmailSignupForm(config) {
    const source = config.source || 'Email signup';
    const participation = config.participation || 'newsletter-only';
    const inputId = config.inputId || 'footer-email';
    const successMessage = config.successMessage
      || 'Thanks — you\'re on the list!';

    return {
      email: '',
      honeypot: '',
      status: 'idle',
      errorMessage: '',
      successMessage,
      inputId,

      get loading() {
        return this.status === 'loading';
      },

      get succeeded() {
        return this.status === 'success';
      },

      get failed() {
        return this.status === 'error';
      },

      get signupAvailable() {
        return !!getWebhookUrl();
      },

      async submit() {
        if (this.status === 'loading') return;

        this.errorMessage = '';
        if (!this.signupAvailable) {
          this.status = 'error';
          this.errorMessage = 'Email signup is not available yet. Please contact WVF.';
          return;
        }

        if (!isValidEmail(this.email)) {
          this.status = 'error';
          this.errorMessage = 'Enter a valid email address.';
          return;
        }

        this.status = 'loading';

        try {
          const result = await submitEmailSignup({
            email: this.email,
            source,
            participation,
            honeypot: this.honeypot,
          });

          if (result.ok) {
            this.status = 'success';
            this.email = '';
            this.$nextTick(() => {
              const live = this.$refs.statusLive;
              if (live) live.focus();
            });
            return;
          }

          if (result.error === 'invalid_email') {
            this.errorMessage = 'Enter a valid email address.';
          } else if (result.error === 'not_configured') {
            this.errorMessage = 'Email signup is not available yet. Please contact WVF.';
          } else {
            this.errorMessage = 'We couldn\'t add your email right now. Please try again or email info@wvf-ny.org.';
          }
          this.status = 'error';
        } catch (_err) {
          this.errorMessage = 'We couldn\'t add your email right now. Please try again or email info@wvf-ny.org.';
          this.status = 'error';
        }
      },
    };
  }

  global.KEYMAKERS_SUBSCRIBE = {
    isValidEmail,
    submitEmailSignup,
    keymakersEmailSignupForm,
  };
})(window);
