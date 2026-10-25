import axios from 'axios';
import { io } from 'socket.io-client';

const isDev = typeof window !== 'undefined' && window.location.port === '5173';
const SERVER_URL = isDev ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
const API_BASE = `${SERVER_URL}/api`;

export const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true
});

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Tickets
  getTickets: () => apiClient.get('/tickets'),
  getTicketById: (id) => apiClient.get(`/tickets/${id}`),
  createTicket: (data) => apiClient.post('/tickets', data),
  updateTicketStatus: (id, data) => apiClient.patch(`/tickets/${id}/status`, data),
  resolveTicket: (id, data) => apiClient.post(`/tickets/${id}/resolve`, data),
  respondToClosure: (id, data) => apiClient.post(`/tickets/${id}/closure-response`, data),
  escalateTicket: (id, data) => apiClient.post(`/tickets/${id}/escalate`, data),
  itSupportOverride: (id, data) => apiClient.post(`/tickets/${id}/override`, data),

  // Assets
  getAssets: () => apiClient.get('/assets'),
  getAssetById: (id) => apiClient.get(`/assets/${id}`),
  createAsset: (data) => apiClient.post('/assets', data),
  updateAsset: (id, data) => apiClient.put(`/assets/${id}`, data),
  deleteAsset: (id) => apiClient.delete(`/assets/${id}`),

  // Licenses
  getLicenses: () => apiClient.get('/licenses'),
  createLicense: (data) => apiClient.post('/licenses', data),
  allocateLicense: (id, data) => apiClient.post(`/licenses/${id}/allocate`, data),
  revokeLicense: (id, data) => apiClient.post(`/licenses/${id}/revoke`, data),

  // Onboarding
  getOnboardings: () => apiClient.get('/onboarding'),
  getOnboardingById: (id) => apiClient.get(`/onboarding/${id}`),
  createDraftOnboarding: (data) => apiClient.post('/onboarding/draft', data),
  employeeSubmitOnboarding: (id, data) => apiClient.post(`/onboarding/${id}/employee-submit`, data),
  hrVerifyOnboarding: (id, data) => apiClient.post(`/onboarding/${id}/hr-verify`, data),
  itProvisionOnboarding: (id, data) => apiClient.post(`/onboarding/${id}/it-provision`, data),
  requestDepartmentTransfer: (data) => apiClient.post('/onboarding/transfer', data),

  // Offboarding
  getOffboardings: () => apiClient.get('/offboarding'),
  getOffboardingById: (id) => apiClient.get(`/offboarding/${id}`),
  initiateOffboarding: (data) => apiClient.post('/offboarding/initiate', data),
  executeAutomatedCutoff: (id, data) => apiClient.post(`/offboarding/${id}/automated-cutoff`, data),
  recordAssetReturn: (id, data) => apiClient.post(`/offboarding/${id}/asset-return`, data),
  revokeDelayedLicenses: (id, data) => apiClient.post(`/offboarding/${id}/revoke-licenses`, data),

  // Procurement
  getProcurements: () => apiClient.get('/procurement'),
  getProcurementById: (id) => apiClient.get(`/procurement/${id}`),
  createProcurement: (data) => apiClient.post('/procurement', data),
  itReviewProcurement: (id, data) => apiClient.post(`/procurement/${id}/it-review`, data),
  managerApproveProcurement: (id, data) => apiClient.post(`/procurement/${id}/manager-approve`, data),
  financeAuthorizeProcurement: (id, data) => apiClient.post(`/procurement/${id}/finance-authorize`, data),
  itCheckInDelivery: (id, data) => apiClient.post(`/procurement/${id}/delivery-checkin`, data),

  // Floorplan & Network Discovery
  getFloorplan: () => apiClient.get('/floorplan'),
  updateDevicePosition: (data) => apiClient.post('/floorplan/move-device', data),
  addDeviceToFloorplan: (data) => apiClient.post('/floorplan/add-device', data),
  triggerDiscoveryScan: (data) => apiClient.post('/discovery/scan', data),

  // Knowledge Base
  getKBArticles: (params) => apiClient.get('/kb', { params }),
  getKBArticleById: (id) => apiClient.get(`/kb/${id}`),
  createKBArticle: (data) => apiClient.post('/kb', data),
  voteHelpfulKB: (id) => apiClient.post(`/kb/${id}/helpful`),
  aiKbAssistant: (data) => apiClient.post('/kb/ai-suggest', data),

  // Users, Security & Analytics
  getUsers: () => apiClient.get('/users'),
  getUserById: (id) => apiClient.get(`/users/${id}`),
  getAuditLogs: () => apiClient.get('/audit-logs'),
  getDashboardStats: () => apiClient.get('/analytics/dashboard')
};

export default api;
