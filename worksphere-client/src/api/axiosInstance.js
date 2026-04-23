import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
});

// 1. Request Interceptor: Attach the token to outgoing requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // 🔐 Handle 401 globally — session expired, force re-login
      if (status === 401) {
        console.warn('Session expired. Redirecting to login...');
        localStorage.clear();
        window.location.href = '/';
      }

      // ⚠️  403 is intentionally NOT redirected here.
      // Components receive the full error object so they can display
      // the specific backend message (e.g. "Managers can only modify
      // timesheets for employees within their own department.").
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
