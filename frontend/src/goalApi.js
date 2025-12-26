import axios from 'axios';

const API_BASE_URL = 'https://fitware.com.tr/api';

// -----------------------------------------------------------------------------// Token helpers (supports a few common key names)
// -----------------------------------------------------------------------------
const getAccessToken = () =>
  localStorage.getItem('access') ||
  sessionStorage.getItem('access') ||
  localStorage.getItem('access_token') ||
  sessionStorage.getItem('access_token') ||
  localStorage.getItem('token') ||
  sessionStorage.getItem('token');

const getRefreshToken = () =>
  localStorage.getItem('refresh') ||
  sessionStorage.getItem('refresh') ||
  localStorage.getItem('refresh_token') ||
  sessionStorage.getItem('refresh_token');

const setAccessToken = (token) => {
  // Prefer writing to the same storage where refresh token exists, otherwise localStorage.
  const refreshInSession = !!sessionStorage.getItem('refresh') || !!sessionStorage.getItem('refresh_token');
  if (refreshInSession) sessionStorage.setItem('access', token);
  else localStorage.setItem('access', token);
};

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - refresh token on 401/403 (often happens when token expires)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    const refreshToken = getRefreshToken();

    // Avoid infinite loop (and avoid trying to refresh while already refreshing/logging in)
    const isAuthEndpoint =
      originalRequest?.url?.includes('/v1/auth/login/') ||
      originalRequest?.url?.includes('/v1/auth/refresh/');

    if (!isAuthEndpoint && (status === 401 || status === 403) && !originalRequest?._retry && refreshToken) {
      originalRequest._retry = true;

      try {
        const resp = await axios.post(`${API_BASE_URL}/v1/auth/refresh/`, { refresh: refreshToken });

        const { access } = resp.data || {};
        if (!access) throw new Error('Refresh response did not include access token.');

        setAccessToken(access);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${access}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token invalid -> clear and go to login
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        sessionStorage.removeItem('access');
        sessionStorage.removeItem('refresh');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// GOALS API
// ============================================================================
export const goalsApi = {
  getAll: async () => (await api.get('/goals/')).data,
  getById: async (id) => (await api.get(`/goals/${id}/`)).data,
  create: async (goalData) => (await api.post('/goals/', goalData)).data,
  update: async (id, goalData) => (await api.put(`/goals/${id}/`, goalData)).data,
  partialUpdate: async (id, goalData) => (await api.patch(`/goals/${id}/`, goalData)).data,
  delete: async (id) => {
    await api.delete(`/goals/${id}/`);
    return true;
  },
  updateProgress: async (id, currentValue) =>
    (await api.post(`/goals/${id}/update-progress/`, { current_value: currentValue })).data,

  getActive: async () => (await api.get('/goals/active/')).data,
  getLogs: async () => (await api.get('/goals/activity_logs/')).data,
  suggest: async (title, description, profile = null) => {
    const payload = { title, description };
    if (profile && (profile.height || profile.weight || profile.fitness_level)) {
      payload.profile = {
        height: profile.height || null,
        weight: profile.weight || null,
        fitness_level: profile.fitness_level || null
      };
    }
    return (await api.post('/goals/suggest/', payload)).data;
  },

  getStats: async () => (await api.get('/goals/stats/')).data,
};

export default api;
