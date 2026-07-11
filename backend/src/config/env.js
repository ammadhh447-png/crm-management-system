require('dotenv').config();

const required = [
  'MONGODB_URI',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FRONTEND_URL',
];

if (process.env.NODE_ENV !== 'test') {
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
}

module.exports = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  brevoApiKey: process.env.BREVO_API_KEY,
  emailFromName: process.env.EMAIL_FROM_NAME || 'CRM System',
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.CONTACT_EMAIL || 'ammadhh447@gmail.com',
  contactEmail: process.env.CONTACT_EMAIL || 'ammadhh447@gmail.com',
  frontendUrl: process.env.FRONTEND_URL,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'crm-documents',
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-001',
  adminEmails: process.env.ADMIN_EMAILS || '',
};
