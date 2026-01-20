

import { Load, User } from '../types';

// Initial Mock Data
const MOCK_USER: User = {
  id: 'u1',
  tenantId: 'mock-tenant-1',
  name: 'John Doe',
  companyName: 'Global Logistics Solutions',
  email: 'john@globallogistics.com',
  role: 'SHIPPER',
  status: 'ACTIVE'
};

const INITIAL_LOADS: Load[] = [
  {
    id: 'L-1001',
    tenantId: 'mock-tenant-1',
    loadNumber: '1001',
    shipperCompanyId: 'comp-1',
    title: 'Steel Pipes Transport',
    materialType: 'Steel',
    weight: 25,
    vehicleCount: 2,
    pickupCity: 'Mumbai',
    pickupAddress: 'Port Trust Area, Mumbai',
    pickupDate: '2023-11-15',
    pickupCoordinates: { lat: 18.9466, lng: 72.8524 },
    dropCity: 'Delhi',
    dropAddress: 'Okhla Industrial Estate',
    dropDate: '2023-11-18',
    dropCoordinates: { lat: 28.5355, lng: 77.3910 },
    vehicleType: 'Trailer',
    bodyType: 'Open',
    tyres: 18,
    price: 45000,
    priceType: 'Fixed',
    status: 'Assigned',
    assignedDriverId: 'u3', // Matching mock driver
    createdAt: '2023-11-10',
    goodsValue: 1500000,
    insuranceRequired: true,
    insurancePremium: 7500,
    bids: [
      { id: 'b1', tenantId: 'mock-tenant-2', transporterName: 'FastTrans', amount: 44000, vehicleDetails: 'Tata Prima', date: '2023-11-11', status: 'Pending' },
      { id: 'b2', tenantId: 'mock-tenant-3', transporterName: 'RoadKings', amount: 46000, vehicleDetails: 'Ashok Leyland', date: '2023-11-12', status: 'Pending' }
    ]
  },
  {
    id: 'L-1002',
    tenantId: 'mock-tenant-1',
    loadNumber: '1002',
    shipperCompanyId: 'comp-1',
    title: 'Textile Shipment',
    materialType: 'Cotton Bales',
    weight: 12,
    vehicleCount: 1,
    pickupCity: 'Surat',
    pickupAddress: 'Textile Market',
    pickupDate: '2023-11-20',
    dropCity: 'Chennai',
    dropAddress: 'T. Nagar',
    dropDate: '2023-11-23',
    vehicleType: 'Container',
    bodyType: 'Closed',
    tyres: 10,
    price: 32000,
    priceType: 'Negotiable',
    status: 'Pending',
    createdAt: '2023-11-12',
    bids: [],
    insuranceRequired: false
  },
  {
    id: 'L-1003',
    tenantId: 'mock-tenant-1',
    loadNumber: '1003',
    shipperCompanyId: 'comp-1',
    title: 'FMCG Distribution',
    materialType: 'Packaged Food',
    weight: 8,
    vehicleCount: 3,
    pickupCity: 'Bangalore',
    pickupAddress: 'Electronic City',
    pickupDate: '2023-11-05',
    dropCity: 'Hyderabad',
    dropAddress: 'Hi-Tech City',
    dropDate: '2023-11-06',
    vehicleType: 'Truck',
    bodyType: 'Closed',
    tyres: 6,
    price: 18000,
    priceType: 'Fixed',
    status: 'Completed',
    assignedDriverId: 'u3', // Assign to mock driver to show in history
    createdAt: '2023-11-01',
    bids: [],
    insuranceRequired: false
  }
];

class MockService {
  private loads: Load[] = INITIAL_LOADS;
  private currentUser: User | null = null;

  login(email: string): Promise<User> {
    return new Promise((resolve) => {
      // Return different mock users based on email prefix for testing
      let role = 'SHIPPER';
      let id = 'u1';
      if (email.includes('transporter')) { role = 'TRANSPORTER'; id = 'u2'; }
      if (email.includes('driver')) { role = 'DRIVER'; id = 'u3'; }
      if (email.includes('admin')) { role = 'ADMIN'; id = 'u4'; }
      if (email.includes('receiver')) { role = 'RECEIVER'; id = 'u5'; }

      this.currentUser = { ...MOCK_USER, id, email, role: role as any };
      setTimeout(() => {
        resolve(this.currentUser!);
      }, 500);
    });
  }

  logout() {
    this.currentUser = null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getLoads(): Promise<Load[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.loads]), 500);
    });
  }

  getLoadById(id: string): Promise<Load | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.loads.find(l => l.id === id)), 300);
    });
  }

  getDriverLoads(driverId: string): Promise<Load[]> {
    return new Promise((resolve) => {
      // In mock mode, if we are the driver 'u3', return assigned loads
      // Or if generic driver, return loads that are 'Assigned', 'In Transit', 'Reached'
      const relevantLoads = this.loads.filter(l => 
        l.assignedDriverId === driverId || 
        (['Assigned', 'In Transit', 'Reached'].includes(l.status) && !l.assignedDriverId)
      );
      setTimeout(() => resolve(relevantLoads), 400);
    });
  }

  createLoad(load: Partial<Load>): Promise<Load> {
    return new Promise((resolve) => {
      const newLoad: Load = {
        // Defaults
        id: `L-${1000 + this.loads.length + 1}`,
        tenantId: this.currentUser?.tenantId || 'mock-tenant-1',
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0],
        bids: [],
        loadNumber: `${1000 + this.loads.length + 1}`,
        shipperCompanyId: this.currentUser?.companyId || 'comp-1',
        insuranceRequired: false,
        // Override with provided
        ...(load as any),
      };
      this.loads = [newLoad, ...this.loads];
      setTimeout(() => resolve(newLoad), 800);
    });
  }

  updateLoadStatus(id: string, status: Load['status']): Promise<void> {
    return new Promise((resolve) => {
      this.loads = this.loads.map(l => l.id === id ? { ...l, status } : l);
      setTimeout(resolve, 300);
    });
  }

  updateLocation(id: string, lat: number, lng: number): Promise<void> {
    return new Promise((resolve) => {
      this.loads = this.loads.map(l => 
        l.id === id ? { ...l, currentLocation: { lat, lng }, lastUpdated: new Date().toISOString() } : l
      );
      setTimeout(resolve, 200);
    });
  }

  placeBid(loadId: string, amount: number, vehicleDetails: string): Promise<void> {
    return new Promise((resolve) => {
      const load = this.loads.find(l => l.id === loadId);
      if (load) {
          const newBid = {
              id: `b-${Date.now()}`,
              tenantId: this.currentUser?.tenantId || 'mock-tenant-2',
              transporterName: this.currentUser?.companyName || 'Mock Transporter',
              amount: amount,
              vehicleDetails: vehicleDetails,
              date: new Date().toISOString().split('T')[0],
              status: 'Pending' as const
          };
          if (!load.bids) load.bids = [];
          load.bids.push(newBid);
      }
      setTimeout(resolve, 600);
    });
  }
}

export const mockService = new MockService();
