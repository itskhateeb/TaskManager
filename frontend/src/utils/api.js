import axios from 'axios';

// Dynamically set baseURL based on environment
const getBaseURL = () => {
  // If we're in production (Railway), use relative path
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return ''; // Empty string means use same origin
  }
  // Development
  return 'http://localhost:5000/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
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
    // In production, add /api prefix to all requests
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (!config.url.startsWith('/api')) {
        config.url = '/api' + config.url;
      }
    }
    console.log('Making request to:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
API.interceptors.response.use(
  (response) => {
    console.log('Response from:', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default API;