import axios from 'axios';
const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export { api };

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('accessToken', access);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
    register: (userData) => api.post('/auth/register/', userData),
    login: (credentials) => api.post('/auth/login/', credentials),
    logout: () => {
        const refreshToken = localStorage.getItem('refreshToken');
        return api.post('/auth/logout/', { refresh_token: refreshToken });
    },
    profile: () => api.get('/auth/profile/'),
    updateProfile: (userData) => api.put('/auth/profile/', userData),
    resendVerification: () => api.post('/auth/resend-verification/'),
    refreshToken: (refreshToken) => api.post('/token/refresh/', { refresh: refreshToken }),
    
    // ✅ NEW PASSWORD RESET API FUNCTIONS
    forgotPassword: (data) => api.post('/auth/forgot-password/', data),
    verifyResetCode: (data) => api.post('/auth/verify-reset-code/', data),
    resetPassword: (data) => api.post('/auth/reset-password/', data),
    
    // ✅ BLOG API FUNCTIONS
    get: (url) => api.get(url),
    post: (url, data) => api.post(url, data),
    patch: (url, data) => api.patch(url, data),
    delete: (url) => api.delete(url),
};

// Plagiarism API (Faculty)
export const plagiarismAPI = {
  batchCheck: (formData) =>
    api.post('/plagiarism/batch-check/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getBatches: (page = 1) => api.get(`/plagiarism/batches/?page=${page}`),
  getRecentBatches: () => api.get('/plagiarism/batches/recent/'),
  getBatchResults: (batchId) => api.get(`/plagiarism/batch/${batchId}/`),
};

// Project Analysis API (Student)
export const analysisAPI = {
  analyzeProject: (formData) =>
    api.post('/analysis/analyze/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getProjects: (page = 1) => api.get(`/analysis/projects/?page=${page}`),
  getRecentProjects: () => api.get('/analysis/projects/recent/'),
  getProjectDetails: (projectId) => api.get(`/analysis/projects/${projectId}/`),
};

export default api;