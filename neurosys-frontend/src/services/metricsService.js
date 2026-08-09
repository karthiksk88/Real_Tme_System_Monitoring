import api from './api';

export const metricsService = {
  getAllComputers: async () => api.get('/computers'),
  getComputerById: async (id) => api.get(`/computers/${id}`),
  getMetricHistory: async (id, limit = 30) => api.get(`/agent/metrics/history/${id}?limit=${limit}`),
  getHealthScore: async (id) => api.get(`/health-score/${id}`),
  getAllAlerts: async () => api.get('/alerts'),
  getComputerAlerts: async (id) => api.get(`/alerts/computer/${id}`),
  acknowledgeAlert: async (id) => api.put(`/alerts/${id}/acknowledge`),
  resolveAlert: async (id) => api.put(`/alerts/${id}/resolve`),
  getCrashPrediction: async (id) => api.get(`/predictions/crash/${id}`),
  getProcesses: async (id, search = '', sortBy = 'cpu', page = 0, size = 10) =>
    api.get(`/computers/${id}/processes?search=${search}&sortBy=${sortBy}&page=${page}&size=${size}`),
  getFileAnalysis: async (id) => api.get(`/computers/${id}/file-analyzer/summary`),
  getLogs: async (id, logLevel = '', page = 0, size = 15) =>
    api.get(`/computers/${id}/logs?logLevel=${logLevel}&page=${page}&size=${size}`),
  getAnalyticsSummary: async () => api.get('/analytics/summary'),
  askAiAssistant: async (message, computerId) => api.post('/ai-assistant/chat', { message, computerId }),
};
