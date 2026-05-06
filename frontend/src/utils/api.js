import axios from 'axios';

const API = axios.create({
  baseURL:
    window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api'
      : '/api',

  timeout: 10000,

  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error(
      'API Error:',
      error.response?.status,
      error.response?.data
    );

    return Promise.reject(error);
  }
);

export default API;