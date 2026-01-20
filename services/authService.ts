
import { User, Role } from '../types';
import api from './api';
import { mockService } from './mockService';

const SESSION_KEY = 'roadhive_session_user';
const TOKEN_KEY = 'roadhive_auth_token';

export const authService = {
  
  getSession(): User | null {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  async loginWithPassword(email: string, password: string): Promise<User> {
    try {
      // Call Backend
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      
      // Store Session
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      
      return user;
    } catch (err) {
      console.warn("Backend Login failed, trying mock...");
      // Fallback to Mock for demo if backend is down
      return mockService.login(email);
    }
  },

  async signup(data: any): Promise<User> {
    try {
      const res = await api.post('/auth/signup', { ...data, password: 'password123' });
      const { token, user } = res.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      
      return user;
    } catch (err) {
      throw new Error("Signup Failed");
    }
  },

  // Stub for OTP (Backend requires email service)
  async requestOtp(email: string) { console.log("OTP Requested for", email); },
  async verifyOtp(email: string, otp: string) { return this.loginWithPassword(email, 'otp_pass'); },

  logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  getCurrentTenantId(): string | null {
      const u = this.getSession();
      return u?.tenantId || null;
  }
};
