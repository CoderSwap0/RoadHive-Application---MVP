
import axios from 'axios';

// Determine API Base URL
// 1. If VITE_API_URL is set in .env (or GitHub Secrets), use it.
// 2. Otherwise, if running locally, use the Vite proxy ('/api').
// Determine API Base URL
const getBaseUrl = () => {
  const meta = import.meta as any;
  
  // 1. If VITE_API_URL is set in environment (e.g. .env.production or CI/CD)
  if (meta && meta.env && meta.env.VITE_API_URL) {
    const url = meta.env.VITE_API_URL.replace(/\/$/, ''); // Remove trailing slash
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  // 2. If running on Localhost, use Vite Proxy
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api'; 
  }

  // 3. Fallback for Production (GitHub Pages)
  // TODO: REPLACE THIS URL with your actual Render Backend URL
  // Example: https://roadhive-server.onrender.com/api
  console.warn("Using fallback API URL. Please configure VITE_API_URL in your build environment.");
  return 'https://roadhive-server.onrender.com/api'; 
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
