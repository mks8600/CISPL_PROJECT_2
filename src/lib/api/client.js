// API Client — replaces all localStorage calls with backend API requests
// Usage: import { api } from '@/lib/api/client';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('cispl_token');
}

export function setToken(token) {
  localStorage.setItem('cispl_token', token);
}

export function removeToken() {
  localStorage.removeItem('cispl_token');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (res.status === 401) {
    removeToken();
    window.location.hash = '#/';
    throw new Error('Session expired. Please login again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Convenience methods
export const api = {
  get: (url) => apiRequest(url),
  post: (url, data) => apiRequest(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => apiRequest(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
};

// ─── Auth API ───
export const authApi = {
  login: (email, password, portal, orgCode) =>
    api.post('/auth/login', { email, password, portal, orgCode }),
  me: () => api.get('/auth/me'),
};

// ─── SuperAdmin API ───
export const companiesApi = {
  list: () => api.get('/companies'),
  create: (data) => api.post('/companies', data),
  delete: (id) => api.delete(`/companies/${id}`),
  setCredentials: (id, data) => api.post(`/companies/${id}/credentials`, data),
};

export const globalVendorsApi = {
  list: () => api.get('/vendors'),
  create: (data) => api.post('/vendors', data),
  delete: (id) => api.delete(`/vendors/${id}`),
  setCredentials: (id, data) => api.post(`/vendors/${id}/credentials`, data),
};

// ─── Company API ───
export const sheetsApi = {
  list: () => api.get('/sheets'),
  save: (data) => api.post('/sheets', data),
  delete: (id) => api.delete(`/sheets/${id}`),
};

export const assignmentsApi = {
  list: () => api.get('/assignments'),
  create: (data) => api.post('/assignments', data),
  delete: (id) => api.delete(`/assignments/${id}`),
  review: (id, data) => api.put(`/assignments/${id}/review`, data),
  reassign: (id, data) => api.put(`/assignments/${id}/reassign`, data),
};

export const jobsApi = {
  list: () => api.get('/jobs'),
  create: (data) => api.post('/jobs', data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

export const filmSizesApi = {
  list: () => api.get('/film-sizes'),
  create: (data) => api.post('/film-sizes', data),
  delete: (id) => api.delete(`/film-sizes/${id}`),
};

export const billingApi = {
  getSummary: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.vendorId) params.set('vendorId', filters.vendorId);
    if (filters.jobNo) params.set('jobNo', filters.jobNo);
    return api.get(`/billing?${params.toString()}`);
  },
};

// ─── Vendor API ───
export const vendorOrdersApi = {
  list: () => api.get('/vendor-orders'),
  accept: (id) => api.put(`/vendor-orders/${id}/accept`),
  decline: (id) => api.put(`/vendor-orders/${id}/decline`),
  saveData: (id, data) => api.put(`/vendor-orders/${id}/data`, data),
  submit: (id, data) => api.put(`/vendor-orders/${id}/submit`, data),
};

// ─── Dashboard API ───
export const dashboardApi = {
  superadmin: () => api.get('/dashboard/superadmin'),
  company: () => api.get('/dashboard/company'),
  vendor: () => api.get('/dashboard/vendor'),
};
