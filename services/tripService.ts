
import { Coordinates } from '../types';
import api from './api';
import { mockService } from './mockService';

export const tripService = {
  async updateLocation(loadId: string, coords: Coordinates): Promise<void> {
    try {
        await api.post(`/loads/${loadId}/location`, coords);
    } catch (e) {
        console.error("API Error, using mock");
        mockService.updateLocation(loadId, coords.lat, coords.lng);
    }
  },

  async getLocationHistory(loadId: string): Promise<Coordinates[]> {
      // In a full implementation, fetch from GET /loads/:id/history
      return []; 
  },

  async updateStatus(loadId: string, status: string): Promise<void> {
      try {
          await api.patch(`/loads/${loadId}/status`, { status });
      } catch (e) {
          console.error("Status update failed", e);
          // Fallback to mock if needed, though for MVP we mostly rely on API
      }
  },

  async startTrip(loadId: string) {
      return this.updateStatus(loadId, 'In Transit');
  },
  
  async pauseTrip(loadId: string) {
      return this.updateStatus(loadId, 'Paused');
  },
  
  async resumeTrip(loadId: string) {
      return this.updateStatus(loadId, 'In Transit');
  },
  
  async completeTrip(loadId: string) {
      return this.updateStatus(loadId, 'Reached');
  },
};