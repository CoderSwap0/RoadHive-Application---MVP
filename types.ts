

// --- UI / Frontend Types ---
// These match what the React Components expect

export type LoadStatus = 'Draft' | 'Active' | 'Pending' | 'Assigned' | 'In Transit' | 'Paused' | 'Reached' | 'Completed' | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Advance_Paid' | 'Fully_Paid';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SHIPPER' | 'TRANSPORTER' | 'DRIVER' | 'RECEIVER';

export type TenantType = 'SHIPPER' | 'TRANSPORTER' | 'ENTERPRISE' | 'SUPER_ADMIN' | 'PUBLIC';

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  type: TenantType;
}

export interface User {
  id: string;
  tenantId: string; // Multi-tenancy isolation key
  companyId?: string;
  name: string;
  companyName: string; // Helper for UI display, derived from Company relation
  email: string;
  role: Role;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

// Simulated JWT Payload structure
export interface AuthTokenPayload {
  userId: string;
  tenantId: string;
  role: Role;
  exp: number;
}

export interface Bid {
  id: string;
  tenantId: string;
  transporterName: string;
  amount: number;
  vehicleDetails: string;
  date: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

export interface Coordinates {
  lat: number;
  lng: number;
  heading?: number; // Bearing in degrees
  speed?: number; // Speed in m/s
  timestamp?: number;
}

export interface LocationAddress {
  address: string;
  city: string;
  zip?: string;
  lat?: number;
  lng?: number;
}

export interface Load {
  id: string;
  tenantId: string; // Data ownership (Shipper)
  loadNumber: string; // Readable ID (L-1001)
  
  // Relations
  shipperCompanyId: string;
  transporterCompanyId?: string; 
  assignedDriverId?: string; 
  receiverEmail?: string; 

  // Core Data
  title: string;
  materialType: string;
  weight: number; // tons
  vehicleCount: number;
  
  // Location Data (Mapped from JSONB in DB)
  pickupCity: string;
  pickupAddress: string;
  pickupDate: string;
  pickupCoordinates?: Coordinates;
  
  dropCity: string;
  dropAddress: string;
  dropDate: string;
  dropCoordinates?: Coordinates;
  
  vehicleType: 'Truck' | 'Trailer' | 'Container';
  bodyType: 'Open' | 'Closed';
  tyres: number;
  
  price: number;
  priceType: 'Fixed' | 'Negotiable';
  
  // Insurance Fields
  goodsValue?: number;
  insuranceRequired: boolean; // Renamed from insuranceOptIn to match DB
  insurancePremium?: number;

  status: LoadStatus;
  createdAt: string;
  bids: Bid[];

  // Tracking
  currentLocation?: Coordinates;
  lastUpdated?: string;
  
  // Trip Stats
  distanceTravelled?: number; 
  startTime?: string;
  endTime?: string;

  // Invoice Data
  platformFee?: number;
  taxTotal?: number;
  totalAmount?: number;
  
  // Payment Data
  paymentStatus?: PaymentStatus;
  advanceAmount?: number;
  balanceAmount?: number;

  invoiceNumber?: string;
  invoiceDate?: string;
}

// Server Driven UI Types
export interface UIComponent {
  id: string;
  type: 'INPUT' | 'BUTTON' | 'TABLE' | 'CARD' | 'DROPDOWN' | 'CHECKBOX';
  key: string;
  label: string;
  isVisible: boolean;
  isEditable: boolean;
  sequence: number;
  meta?: any;
}

export interface UIScreen {
  screenCode: string;
  components: UIComponent[];
}