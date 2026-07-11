const { supabase } = require('./supabase');
const { supabaseStorageBucket } = require('./env');

const BUCKET = supabaseStorageBucket || 'crm-documents';

const isConfigured = () => true;

const uploadFile = async (key, buffer, contentType, upsert = false) => {
  const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
    contentType,
    upsert,
  });
  if (error) throw new Error(error.message);
  return key;
};

const deleteFile = async (key) => {
  const { error } = await supabase.storage.from(BUCKET).remove([key]);
  if (error) throw new Error(error.message);
};

const getSignedUrl = async (key, expiresIn = 3600) => {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(key, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
};

const getPublicUrl = (key) => {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
};

module.exports = { BUCKET, isConfigured, uploadFile, deleteFile, getSignedUrl, getPublicUrl };
