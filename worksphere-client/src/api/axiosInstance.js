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

// 2. Response Interceptor: Catch 401 Unauthorized errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    // If the request succeeds, just return the response
    return response;
  },
  (error) => {
    // If the error is a 401 (Unauthorized / Token Expired)
    if (error.response && error.response.status === 401) {
      console.warn('Session expired. Redirecting to login...');

      // Clear all stored user data
      localStorage.clear();

      // Force a redirect to the login page (your login route is '/')
      window.location.href = '/';
    }

    // Always reject the promise so the component calling it can also handle the error if needed
    return Promise.reject(error);
  }
);

export default axiosInstance;
