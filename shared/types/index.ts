export type UserRole = 'company_admin' | 'company_user' | 'driver';

export type TripStatus =
  | 'pending'
  | 'assigned'
  | 'driver_notified'
  | 'heading_to_origin'
  | 'arrived_at_origin'
  | 'loading'
  | 'loading_complete'
  | 'in_transit'
  | 'arrived_at_destination'
  | 'unloading'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type VehicleType = 'truck' | 'trailer' | 'semi';
export type IncidentType = 'mechanical' | 'accident' | 'traffic' | 'weather' | 'documentation' | 'other';
export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  companyId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email?: string;
  nationalId: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: string;
  defaultVehicleId?: string;
  photo?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  companyId: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  plate: string;
  vin?: string;
  color?: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  vtExpiry?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  name: string;
  quantity: number;
  unit: string;
  weightKg?: number;
  volumeM3?: number;
  value?: number;
}

export interface Trip {
  id: string;
  companyId: string;
  tripNumber: string;
  contractingCompany: string;
  destinationClient: string;
  origin: string;
  originAddress: string;
  destination: string;
  destinationAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  driverId?: string;
  vehicleId?: string;
  trailerId?: string;
  status: TripStatus;
  observations?: string;
  products: Product[];
  totalWeightKg: number;
  totalVolumeM3: number;
  cargoValue: number;
  cargoCurrency: string;
  driverToken?: string;
  driverTokenExpiry?: string;
  startedAt?: string;
  arrivedAtOriginAt?: string;
  loadingStartedAt?: string;
  departedAt?: string;
  arrivedAtDestinationAt?: string;
  completedAt?: string;
  estimatedDurationMinutes?: number;
  actualDurationMinutes?: number;
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripEvent {
  id: string;
  tripId: string;
  status: TripStatus;
  timestamp: string;
  lat?: number;
  lng?: number;
  notes?: string;
  photos?: string[];
  createdBy: string;
  createdByType: 'company' | 'driver' | 'system';
}

export interface GPSLocation {
  id: string;
  tripId: string;
  driverId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface Incident {
  id: string;
  tripId: string;
  driverId: string;
  type: IncidentType;
  description: string;
  photos?: string[];
  lat?: number;
  lng?: number;
  resolved: boolean;
  resolvedAt?: string;
  resolvedNotes?: string;
  timestamp: string;
}

export interface Photo {
  id: string;
  tripId: string;
  uploadedBy: string;
  uploadedByType: 'company' | 'driver';
  url: string;
  label?: string;
  timestamp: string;
}

export interface Signature {
  id: string;
  tripId: string;
  signerName: string;
  signerRole: string;
  signatureDataUrl: string;
  timestamp: string;
  lat?: number;
  lng?: number;
}

export interface DriverToken {
  id: string;
  token: string;
  tripId: string;
  driverId: string;
  companyId: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  active: boolean;
}

export interface Notification {
  id: string;
  tripId?: string;
  driverId?: string;
  companyId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
  sentAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
  company: Company;
}

export interface DriverAccessRequest {
  token: string;
}

export interface DriverAccessResponse {
  token: string;
  driver: Driver;
  trip: Trip;
}

export interface DashboardStats {
  activeTrips: number;
  completedTrips: number;
  delayedTrips: number;
  trucksInTransit: number;
  todayDeliveries: number;
  pendingAlerts: number;
  totalDrivers: number;
  totalVehicles: number;
}

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  pending: 'Pendiente',
  assigned: 'Asignado',
  driver_notified: 'Chofer Notificado',
  heading_to_origin: 'En Camino al Origen',
  arrived_at_origin: 'Llegó al Origen',
  loading: 'Cargando',
  loading_complete: 'Carga Finalizada',
  in_transit: 'En Tránsito',
  arrived_at_destination: 'Llegó al Destino',
  unloading: 'Descargando',
  delivered: 'Entregado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

export const TRIP_STATUS_ORDER: TripStatus[] = [
  'pending',
  'assigned',
  'driver_notified',
  'heading_to_origin',
  'arrived_at_origin',
  'loading',
  'loading_complete',
  'in_transit',
  'arrived_at_destination',
  'unloading',
  'delivered',
  'completed',
];

export const DRIVER_STATUS_TRANSITIONS: Partial<Record<TripStatus, TripStatus>> = {
  driver_notified: 'heading_to_origin',
  heading_to_origin: 'arrived_at_origin',
  arrived_at_origin: 'loading',
  loading: 'loading_complete',
  loading_complete: 'in_transit',
  in_transit: 'arrived_at_destination',
  arrived_at_destination: 'unloading',
  unloading: 'delivered',
};

export const DRIVER_STATUS_LABELS: Partial<Record<TripStatus, string>> = {
  driver_notified: 'Aceptar viaje',
  heading_to_origin: 'Llegué al origen',
  arrived_at_origin: 'Comenzar carga',
  loading: 'Carga completa',
  loading_complete: 'Iniciar viaje',
  in_transit: 'Llegué al destino',
  arrived_at_destination: 'Comenzar descarga',
  unloading: 'Descarga completa',
};
