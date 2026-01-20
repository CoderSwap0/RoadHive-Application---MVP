
import { Coordinates } from "../types";
import { loadService } from "./loadService";

// This service simulates a WebSocket connection.
// In a real application, this would use socket.io-client to connect to a Node.js server.
// Here, we use a smart polling mechanism to simulate real-time updates without a backend server process.

type EventCallback = (data: any) => void;

class SocketService {
  private subscribers: Map<string, EventCallback[]> = new Map();
  private pollingInterval: number | null = null;
  private tenantId: string | null = null;
  
  // Cache to detect changes
  private lastKnownLocations: Map<string, string> = new Map();

  connect(tenantId: string) {
    this.tenantId = tenantId;
    console.log(`[Socket] Connected to channel: tenant:${tenantId}`);
    
    // Start Polling Loop (Simulating Server Push)
    if (!this.pollingInterval) {
      this.pollingInterval = window.setInterval(() => this.pollForUpdates(), 3000);
    }
  }

  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.subscribers.clear();
    console.log('[Socket] Disconnected');
  }

  // Determine if we need to poll based on active subscriptions
  private async pollForUpdates() {
    // Only poll if someone is listening to 'location_update'
    if (this.subscribers.has('location_update')) {
        // Fetch all active loads for this tenant/user
        // In a real socket, the server pushes this. Here we pull.
        const loads = await loadService.getAllLoads();
        
        loads.forEach(load => {
            if (load.currentLocation) {
                const key = `${load.id}-${load.lastUpdated}`;
                // If location changed since last poll
                if (!this.lastKnownLocations.has(load.id) || this.lastKnownLocations.get(load.id) !== key) {
                    this.lastKnownLocations.set(load.id, key);
                    this.notify('location_update', {
                        loadId: load.id,
                        coordinates: load.currentLocation,
                        status: load.status
                    });
                }
            }
        });
    }
  }

  // --- Pub/Sub Interface ---

  subscribe(event: string, callback: EventCallback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)?.push(callback);
  }

  unsubscribe(event: string, callback: EventCallback) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      this.subscribers.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  // Called by the Driver to "Broadcast" their location
  emit(event: string, data: any) {
    // In a real app, this sends data to server. 
    // Here, we just log it, as the data is already saved to DB via tripService
    // and the pollForUpdates() will pick it up for other users.
    console.log(`[Socket Emit] ${event}`, data);
    
    // Optimistic UI update for the sender if they are also subscribed
    this.notify(event, data);
  }

  private notify(event: string, data: any) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const socketService = new SocketService();
