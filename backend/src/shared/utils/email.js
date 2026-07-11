const { brevoRequest } = require('../../config/brevo');
const { emailFromName, emailFromAddress, contactEmail } = require('../../config/env');
const AppError = require('../errors/AppError');

const DEFAULT_CONTACT_EMAIL = 'ammadhh447@gmail.com';

const getContactEmail = () => (contactEmail || DEFAULT_CONTACT_EMAIL).trim();

const getSender = () => ({
  name: (emailFromName || 'CRM System').trim(),
  email: (emailFromAddress || getContactEmail()).trim(),
});

const isEmailConfigured = () => Boolean(process.env.BREVO_API_KEY && getSender().email);

const sendEmail = async ({ to, subject, html, replyTo, toName }) => {
  if (!isEmailConfigured()) {
    throw new AppError('Email service not configured. Add BREVO_API_KEY and EMAIL_FROM_ADDRESS to backend .env.', 503);
  }

  if (!to?.trim()) {
    throw new AppError('Recipient email is required', 400);
  }

  const sender = getSender();
  const replyToEmail = (replyTo || getContactEmail()).trim();

  try {
    const result = await brevoRequest({
      sender,
      to: [{ email: to.trim(), name: toName || to.trim() }],
      replyTo: { email: replyToEmail, name: sender.name },
      subject: subject || 'Message from CRM System',
      htmlContent: html || '<p></p>',
    });

    return result;
  } catch (err) {
    const message = err.message || 'Email delivery failed';

    if (message.toLowerCase().includes('sender') && message.toLowerCase().includes('verified')) {
      throw new AppError(
        `Email failed: ${message}. Verify ${sender.email} as a sender in your Brevo account.`,
        400
      );
    }

    throw new AppError(`Email failed: ${message}`, 500);
  }
};

const sendEmailWithDevFallback = async ({ to, subject, html, replyTo, toName }) => {
  const result = await sendEmail({ to, subject, html, replyTo, toName });
  return {
    result,
    deliveredTo: to.trim(),
    intendedTo: to.trim(),
    redirected: false,
  };
};

const sendEmailSafe = async (options) => {
  try {
    return await sendEmail(options);
  } catch (err) {
    console.error('[Email]', err.message);
    return null;
  }
};

module.exports = {
  getContactEmail,
  getSender,
  isEmailConfigured,
  sendEmail,
  sendEmailWithDevFallback,
  sendEmailSafe,
};
