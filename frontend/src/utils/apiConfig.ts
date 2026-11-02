/**
 * Centralized API & Authentication configuration for AI Builder
 */

export const getBackendUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    // In production behind reverse proxy (HTTPS or public host), use relative URL ""
    // so requests go to /api/... on the same origin without triggering Chrome PNA (Private Network Access) warnings
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost || window.location.protocol === 'https:') {
      return '';
    }
  }
  // Local development fallback
  return 'http://localhost:8001';
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('app_auth_token') || localStorage.getItem('token');
};

export const getAuthHeaders = (extraHeaders?: Record<string, string>): Record<string, string> => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders || {}),
  };
};

export const getAuthOnlyHeaders = (extraHeaders?: Record<string, string>): Record<string, string> => {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders || {}),
  };
};
