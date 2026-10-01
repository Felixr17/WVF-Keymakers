/**
 * Connector and Key Guide interest forms (website layer only).
 * Persistence, tagging, and email are external. Do not treat UI success as a completed integration.
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

  function splitName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }

  function keymakersInterestForm(config) {
    const source = config.source || 'Interest Form';
    const participation = config.participation || 'interest';
    const prefix = config.inputPrefix || 'interest';
    const successMessage = config.successMessage
      || 'Thank you. We received your interest and will follow up if there is a potential next step.';

    return {
      fullName: '',
      email: '',
      phone: '',
      business: '',
      message: '',
      alreadyKeymaker: '',
      contactPermission: false,
      honeypot: '',
      status: 'idle',
      errors: {},
      formError: '',
      successMessage,
      prefix,

      idFor(name) {
        return prefix + '-' + name;
      },

      get loading() {
        return this.status === 'loading';
      },

      get succeeded() {
        return this.status === 'success';
      },

      get failed() {
        return this.status === 'error';
      },

      get submitAvailable() {
        return !!getWebhookUrl();
      },

      hasError(name) {
        return Boolean(this.errors[name]);
      },

      errorFor(name) {
        return this.errors[name] || '';
      },

      validate() {
        this.errors = {};
        if (!String(this.fullName).trim()) {
          this.errors.fullName = 'Please enter your name.';
        }
        if (!isValidEmail(this.email)) {
          this.errors.email = 'Please enter a valid email address.';
        }
        if (!this.alreadyKeymaker) {
          this.errors.alreadyKeymaker = 'Please tell us whether you are already a Keymaker.';
        }
        if (!this.contactPermission) {
          this.errors.contactPermission = 'Contact permission is required to submit.';
        }
        if (String(this.honeypot).trim()) {
          this.errors.fullName = 'Unable to submit. Please try again later.';
        }
        return Object.keys(this.errors).length === 0;
      },

      async submit() {
        if (this.status === 'loading') return;
        this.formError = '';
        if (!this.submitAvailable) {
          this.status = 'error';
          this.formError = 'This form is not available yet. Please email info@wvf-ny.org.';
          return;
        }
        if (!this.validate()) {
          this.status = 'error';
          this.$nextTick(() => {
            const first = Object.keys(this.errors)[0];
            if (first) document.getElementById(this.idFor(first))?.focus();
          });
          return;
        }

        this.status = 'loading';
        const { firstName, lastName } = splitName(this.fullName);
        const payload = {
          source,
          participation,
          firstName,
          lastName,
          email: normalizeEmail(this.email),
          phone: String(this.phone || '').trim(),
          business: String(this.business || '').trim(),
          message: String(this.message || '').trim(),
          alreadyKeymaker: this.alreadyKeymaker,
          contactOptIn: 'yes',
        };

        try {
          const response = await fetch(getWebhookUrl(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error('server');
          this.status = 'success';
          this.$nextTick(() => {
            const live = this.$refs.statusLive;
            if (live) live.focus();
          });
        } catch (_err) {
          this.status = 'error';
          this.formError = 'We could not send your application right now. Please try again or email info@wvf-ny.org.';
        }
      },
    };
  }

  global.KEYMAKERS_INTEREST = {
    keymakersInterestForm,
  };
})(window);
