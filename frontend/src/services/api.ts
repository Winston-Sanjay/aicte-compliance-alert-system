import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ───────────────────────────────────────────────────

export const authApi = {
  demoLogin: (email: string, password: string) =>
    api.post('/auth/demo-login', { email, password }),
  me: () => api.get('/auth/me'),
};

// ─── Applications ───────────────────────────────────────────

export const applicationsApi = {
  create: (data: Record<string, unknown>) =>
    api.post('/applications', data),
  list: (params?: Record<string, string>) =>
    api.get('/applications', { params }),
  get: (id: string) =>
    api.get(`/applications/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/applications/${id}`, data),
  submit: (id: string) =>
    api.post(`/applications/${id}/submit`),
  resubmit: (id: string) =>
    api.post(`/applications/${id}/resubmit`),
};

// ─── Documents ──────────────────────────────────────────────

export const documentsApi = {
  upload: (applicationId: string, formData: FormData) =>
    api.post(`/applications/${applicationId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (applicationId: string) =>
    api.get(`/applications/${applicationId}/documents`),
  download: (documentId: string) =>
    api.get(`/documents/${documentId}/download`, { responseType: 'blob' }),
  delete: (documentId: string) =>
    api.delete(`/documents/${documentId}`),
};

// ─── Validation ─────────────────────────────────────────────

export const validationApi = {
  run: (applicationId: string) =>
    api.post(`/applications/${applicationId}/validate`),
  results: (applicationId: string) =>
    api.get(`/applications/${applicationId}/validation-results`),
};

// ─── Officer Workflow ───────────────────────────────────────

export const officerApi = {
  assign: (applicationId: string, officerId: string) =>
    api.post(`/applications/${applicationId}/assign`, { officerId }),
  addComment: (applicationId: string, comment: string, commentType: string = 'general') =>
    api.post(`/applications/${applicationId}/comments`, { comment, commentType }),
  requestCorrection: (applicationId: string, comment: string) =>
    api.post(`/applications/${applicationId}/request-correction`, { comment }),
  advanceReview: (applicationId: string, action: string, comment?: string) =>
    api.post(`/applications/${applicationId}/advance-review`, { action, comment }),
  recordDecision: (applicationId: string, outcome: string, note: string) =>
    api.post(`/applications/${applicationId}/record-demo-decision`, { outcome, note }),
  requestDocument: (applicationId: string, documentType: string, documentName: string, note?: string) =>
    api.post(`/applications/${applicationId}/request-document`, { documentType, documentName, note }),
};

// ─── Notifications ──────────────────────────────────────────

export const notificationsApi = {
  list: (params?: Record<string, string>) =>
    api.get('/notifications', { params }),
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
  markAllRead: () =>
    api.patch('/notifications/read-all'),
};

// ─── Reports ────────────────────────────────────────────────

export const reportsApi = {
  overview: () => api.get('/reports/overview'),
  workload: () => api.get('/reports/workload'),
  deadlines: () => api.get('/reports/deadlines'),
};

// ─── Audit ──────────────────────────────────────────────────

export const auditApi = {
  timeline: (applicationId: string) =>
    api.get(`/applications/${applicationId}/timeline`),
  logs: (params?: Record<string, string>) =>
    api.get('/audit-logs', { params }),
};

// ─── Categories ─────────────────────────────────────────────

export const categoriesApi = {
  list: () => api.get('/categories'),
};
