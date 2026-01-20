
import axios from 'axios';

// Create central axios instance
const api = axios.create({
  baseURL: '/api', // Proxied by Vite to http://localhost:5000/api
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
        // Let's ensure we handle both for migration safety
        if (tokenStr.startsWith('{')) {
             // Old format was not storing token directly maybe?
             // Assuming new auth service stores raw JWT string
        }
        config.headers.Authorization = `Bearer ${tokenStr}`;
    } catch (e) {
        console.error("Token parsing error", e);
    }
  }
  return config;
});

export default api;
