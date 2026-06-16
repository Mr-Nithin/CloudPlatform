import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (newPassword) => api.patch('/auth/change-password', { newPassword }),
};

export const users = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  updateTeams: (id, teamIds) => api.patch(`/users/${id}/teams`, { teamIds }),
};

export const teams = {
  list: () => api.get('/teams'),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.patch(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
};

export const projects = {
  list: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  updateTeams: (id, teamIds) => api.patch(`/projects/${id}/teams`, { teamIds }),
};

export const accounts = {
  list: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.patch(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
};

export const requests = {
  list: () => api.get('/requests'),
  get: (id) => api.get(`/requests/${id}`),
  approve: (id) => api.patch(`/requests/${id}/approve`),
  reject: (id, reason) => api.patch(`/requests/${id}/reject`, { reason }),
};

export const conversations = {
  list: () => api.get('/conversations'),
  get: (id) => api.get(`/conversations/${id}`),
  create: () => api.post('/conversations'),
  sendMessage: (id, content) => api.post(`/conversations/${id}/messages`, { content }),
};

export const resources = {
  list: () => api.get('/resources'),
};

export const conventions = {
  list: () => api.get('/naming-conventions'),
  create: (data) => api.post('/naming-conventions', data),
  history: (entityType) => api.get(`/naming-conventions/${entityType}/history`),
};

export const templates = {
  list: () => api.get('/templates'),
  get: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.patch(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
};

export const auditLogs = {
  list: (params) => api.get('/audit-logs', { params }),
};

export const accessRules = {
  list: () => api.get('/access-rules'),
  create: (data) => api.post('/access-rules', data),
  deactivate: (id) => api.delete(`/access-rules/${id}`),
};

export default api;
