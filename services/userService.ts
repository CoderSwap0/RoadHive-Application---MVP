
import api from './api';
import { User } from '../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const res = await api.get('/users');
      return res.data;
    } catch (e) {
      console.error("Failed to fetch users", e);
      return [];
    }
  },

  async getDrivers(): Promise<any[]> {
      try {
          const res = await api.get('/users/drivers');
          return res.data;
      } catch (e) {
          return [];
      }
  },

  async createUser(user: any): Promise<User> {
    try {
        const res = await api.post('/users', user);
        return res.data;
    } catch (e) {
        console.error("Create user failed", e);
        throw e;
    }
  },

  async updateUser(user: User): Promise<User> {
    try {
        const res = await api.put(`/users/${user.id}`, user);
        return res.data;
    } catch (e) {
        console.error("Update user failed", e);
        throw e;
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
        await api.delete(`/users/${id}`);
    } catch (e) {
        console.error("Delete user failed", e);
        throw e;
    }
  }
};