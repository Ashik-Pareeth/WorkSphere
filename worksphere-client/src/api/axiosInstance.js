import axios from 'axios';

const axiosInstance = axios.create({ baseURL: 'http://localhost:8080' });

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
      const url = error.config?.url || '';

      const isPublicOfferRequest =
        url.includes('/api/offers') && url.includes('token');

      // 🔐 Handle 401 globally (valid case)
      if (status === 401) {
        console.warn('Session expired. Redirecting to login...');
        localStorage.clear();
        window.location.href = '/';
      }

      // 🚨 Handle 403 ONLY for protected routes
      else if (status === 403 && !isPublicOfferRequest) {
        console.warn('Forbidden access. Redirecting to Unauthorized...');
        window.location.href = '/unauthorized';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
