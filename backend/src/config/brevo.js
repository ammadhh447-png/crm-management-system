const { brevoApiKey } = require('./env');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const brevoRequest = async (payload) => {
  if (!brevoApiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || `Brevo API error (${response.status})`;
    throw new Error(message);
  }

  return data;
};

module.exports = { brevoRequest };
