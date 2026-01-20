
import axios from 'axios';

// Determine API Base URL
// 1. If VITE_API_URL is set in .env (or GitHub Secrets), use it.
// 2. Otherwise, if running locally, use the Vite proxy ('/api').
const getBaseUrl = () => {
  // Safely access import.meta.env to prevent crash if undefined
  // We explicitly check if 'env' exists on import.meta before accessing properties
  const meta = import.meta as any;
  if (meta && meta.env && meta.env.VITE_API_URL) {
    return `${meta.env.VITE_API_URL}/api`;
  }
  return '/api'; // Falls back to proxy in vite.config.ts for local dev
};

// Create central axios instance
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT Token to every request
api.interceptors.request.use((config) => {
  const tokenStr = localStorage.getItem('roadhive_auth_token');
  if (tokenStr) {
    try {
        // If token is just a string (new format) vs JSON object (old format)
        // In our authService we store it as a string now.
        config.headers.Authorization = `Bearer ${tokenStr}`;
    } catch (e) {
        console.error("Token parsing error", e);
    }
  }
  return config;
});

export default api;