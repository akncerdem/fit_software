import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Her istekte token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access') || sessionStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Token yenileme
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 hatası ve henüz retry yapılmadıysa
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh') || sessionStorage.getItem('refresh');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/v1/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token da geçersizse logout
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
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
  // Tüm goal'ları getir
  getAll: async () => {
    try {
      const response = await api.get('/goals/');
      return response.data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  // Tek goal getir
  getById: async (id) => {
    try {
      const response = await api.get(`/goals/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching goal ${id}:`, error);
      throw error;
    }
  },

  // Yeni goal oluştur
  create: async (goalData) => {
    try {
      const response = await api.post('/goals/', goalData);
      return response.data;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  // Goal güncelle (tam)
  update: async (id, goalData) => {
    try {
      const response = await api.put(`/goals/${id}/`, goalData);
      return response.data;
    } catch (error) {
      console.error(`Error updating goal ${id}:`, error);
      throw error;
    }
  },

  // Goal güncelle (kısmi)
  partialUpdate: async (id, goalData) => {
    try {
      const response = await api.patch(`/goals/${id}/`, goalData);
      return response.data;
    } catch (error) {
      console.error(`Error partially updating goal ${id}:`, error);
      throw error;
    }
  },

  // Goal sil
  delete: async (id) => {
    try {
      await api.delete(`/goals/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting goal ${id}:`, error);
      throw error;
    }
  },

  // Progress güncelle
  updateProgress: async (id, currentValue) => {
    try {
      const response = await api.post(`/goals/${id}/update-progress/`, {
        current_value: currentValue,
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating progress for goal ${id}:`, error);
      throw error;
    }
  },

  // Aktif goal'ları getir
  getActive: async () => {
    try {
      const response = await api.get('/goals/active/');
      return response.data;
    } catch (error) {
      console.error('Error fetching active goals:', error);
      throw error;
    }
  },

  // Goal istatistikleri
  getStats: async () => {
    try {
      const response = await api.get('/goals/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching goal stats:', error);
      throw error;
    }
  },
};

export default api;