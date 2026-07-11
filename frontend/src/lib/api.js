import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(new Error(error.response?.data?.message || error.message || 'Request failed'))
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  syncSession: () => api.post('/auth/sync'),
  getMe: () => api.get('/auth/me'),
  getRoles: () => api.get('/auth/roles'),
  getPermissions: () => api.get('/auth/permissions'),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/users/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeAvatar: () => api.delete('/users/profile/avatar'),
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const activityApi = {
  getLogs: (params) => api.get('/activity', { params }),
  getMyLogs: (params) => api.get('/activity/me', { params }),
};

export const contactApi = {
  getMeta: () => api.get('/contacts/meta'),
  getAll: (params) => api.get('/contacts', { params }),
  getById: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
  bulkDelete: (ids) => api.post('/contacts/bulk-delete', { ids }),
  getDuplicates: () => api.get('/contacts/duplicates'),
  importCSV: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/contacts/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  exportData: (format) => api.get(`/contacts/export?format=${format}`, { responseType: 'blob' }),
  getCompanies: (search) => api.get('/contacts/companies', { params: { search } }),
  createCompany: (data) => api.post('/contacts/companies', data),
};

export const dealApi = {
  getMeta: () => api.get('/deals/meta'),
  getAll: (params) => api.get('/deals', { params }),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  updateStage: (id, stage) => api.patch(`/deals/${id}/stage`, { stage }),
  delete: (id) => api.delete(`/deals/${id}`),
  bulkDelete: (ids) => api.post('/deals/bulk-delete', { ids }),
};

export const taskApi = {
  getMeta: () => api.get('/tasks/meta'),
  getAll: (params) => api.get('/tasks', { params }),
  getCalendar: (params) => api.get('/tasks/calendar', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  bulkDelete: (ids) => api.post('/tasks/bulk-delete', { ids }),
};

export const communicationApi = {
  getAll: (params) => api.get('/communications', { params }),
  create: (data) => api.post('/communications', data),
  sendEmail: (data) => api.post('/communications/send-email', data),
  delete: (id) => api.delete(`/communications/${id}`),
  bulkDelete: (ids) => api.post('/communications/bulk-delete', { ids }),
  getTemplates: () => api.get('/communications/templates'),
  createTemplate: (data) => api.post('/communications/templates', data),
  updateTemplate: (id, data) => api.put(`/communications/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/communications/templates/${id}`),
};

export const documentApi = {
  getAll: (params) => api.get('/documents', { params }),
  upload: (file, meta) => {
    const form = new FormData();
    form.append('file', file);
    if (meta.contactId) form.append('contactId', meta.contactId);
    if (meta.dealId) form.append('dealId', meta.dealId);
    if (meta.category) form.append('category', meta.category);
    return api.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getDownloadUrl: (id) => api.get(`/documents/${id}/download`),
  delete: (id) => api.delete(`/documents/${id}`),
};

export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const reportApi = {
  getDashboard: (params) => api.get('/reports/dashboard', { params }),
  exportReport: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  addCustomField: (entity, data) => api.post(`/settings/custom-fields/${entity}`, data),
  removeCustomField: (entity, name) => api.delete(`/settings/custom-fields/${entity}/${name}`),
};

export const aiApi = {
  getStatus: () => api.get('/ai/status', { params: { _t: Date.now() } }),
  chat: (messages) => api.post('/ai/chat', { messages }),
};

export default api;
