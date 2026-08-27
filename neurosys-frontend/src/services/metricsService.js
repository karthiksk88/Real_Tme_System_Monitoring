import api from './api';

export const metricsService = {
  // Computer Management APIs
  getAllComputers: async () => api.get('/computers'),
  getPendingComputers: async () => api.get('/computers/pending'),
  getComputerById: async (id) => api.get(`/computers/${id}`),
  getComputersByLab: async (labName) => api.get(`/computers/lab/${labName}`),
  approveComputer: async (id) => api.put(`/computers/${id}/approve`),
  rejectComputer: async (id) => api.put(`/computers/${id}/reject`),

  // Telemetry History & Metrics APIs
  getMetricHistory: async (id, limit = 30) => api.get(`/agent/metrics/history/${id}?limit=${limit}`),
  getHealthScore: async (id) => api.get(`/health-score/${id}`),
  getProcesses: async (id, search = '', sortBy = 'cpu', page = 0, size = 10) =>
    api.get(`/computers/${id}/processes?search=${search}&sortBy=${sortBy}&page=${page}&size=${size}`),
  getFileAnalysis: async (id) => api.get(`/computers/${id}/file-analyzer/summary`),
  getLogs: async (id, logLevel = '', page = 0, size = 15) =>
    api.get(`/computers/${id}/logs?logLevel=${logLevel}&page=${page}&size=${size}`),

  // Alert Center APIs
  getAllAlerts: async () => api.get('/alerts'),
  getActiveAlerts: async () => api.get('/alerts'),
  getComputerAlerts: async (id) => api.get(`/alerts/computer/${id}`),
  acknowledgeAlert: async (id) => api.put(`/alerts/${id}/acknowledge`),
  resolveAlert: async (id) => api.put(`/alerts/${id}/resolve`),

  // Remote Power Management APIs
  lockComputer: async (computerId) => api.post(`/computers/${computerId}/lock`, {}),
  restartComputer: async (computerId) => api.post(`/computers/${computerId}/restart`, {}),
  shutdownComputer: async (computerId) => api.post(`/computers/${computerId}/shutdown`, {}),
  sendPowerCommand: async (computerId, commandType) => {
    const endpoint = (commandType || 'SHUTDOWN').toLowerCase();
    return api.post(`/computers/${computerId}/${endpoint}`, {});
  },
  getPowerAudits: async (computerId) => api.get(`/computers/${computerId}/power-audits`),

  // AI Performance, Prediction & Diagnosis APIs
  getCrashPrediction: async (id) => api.get(`/predictions/crash/${id}`),
  evaluateCrashRisk: async (id) => api.post(`/predictions/crash/${id}/evaluate`, {}),
  getAIDiagnosis: async (computerId) => api.get(`/diagnostics/${computerId}`),
  getAnalyticsSummary: async () => api.get('/analytics/summary'),
  askAiAssistant: async (message, computerId) => api.post('/ai-assistant/chat', { message, computerId }),
};
