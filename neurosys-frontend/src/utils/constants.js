export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || '/ws-neurosys';

export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  TECH_SUPPORT: 'ROLE_TECH_SUPPORT',
  OPERATOR: 'ROLE_OPERATOR',
};

export const COMPUTER_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
};
