export enum UserType {
  RESIDENT = 'Morador',
  OWNER = 'Proprietário',
  DEPENDENT = 'Dependente',
  EMPLOYEE = 'Funcionário',
  SERVICE_PROVIDER = 'Prestador de Serviço',
  TENANT = 'Inquilino',
  ASSOCIATE = 'Associado',
  ADMIN = 'Administrador',
  VISITOR = 'Visitante'
}

export enum AccessStatus {
  GRANTED = 'Permitido',
  DENIED = 'Negado',
  PENDING = 'Pendente'
}

export interface AccessValidity {
  start: string;
  end?: string; // Optional for permanent residents
  isActive: boolean;
}

export interface Vehicle {
  plate: string;
  make: string;
  model: string;
  color: string;
}

export interface Pet {
  id: string;
  name: string;
  type: 'Cachorro' | 'Gato' | 'Outro';
  breed?: string;
  color?: string;
  photoUrl?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: UserType;
  unit?: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
  registeredAt: string;
  validity?: AccessValidity; // Authorization period
  observations?: string; // Incident reports or notes
  location?: UserLocation;
  
  // Assets linked to specific resident
  vehicles?: Vehicle[]; 
  pets?: Pet[];
  
  // Legacy/Single fields (kept for compatibility with existing mock data until migration)
  vehicle?: Vehicle; 
  serviceType?: string;
  communicationPreferences?: {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
    phoneCall: boolean;
  };
}

export interface Visitor {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  hostUnit?: string;
  purpose: string;
  expectedDate: string;
  qrCodeUrl?: string;
  accessCode?: string;
  status: 'scheduled' | 'checked-in' | 'checked-out';
  serviceType?: string;
  vehicleRegistration?: string;
  authorizationMethod?: 'qr_instant' | 'email_request' | 'whatsapp_request' | 'sms_request';
  approvalStatus?: 'pending_email' | 'pending_whatsapp' | 'pending_sms' | 'approved' | 'rejected' | 'n/a';
  validity?: AccessValidity; // Authorization period
}

export interface Delivery {
  id: string;
  trackingCode?: string;
  recipientId: string;
  recipientName: string;
  recipientUnit: string;
  carrier: string; // Correios, Amazon, etc.
  type: 'Caixa' | 'Envelope' | 'Alimentação' | 'Outro';
  arrivedAt: string;
  pickedUpAt?: string;
  status: 'waiting' | 'picked_up';
  photoUrl?: string;
  validity?: AccessValidity; // Time window for delivery entry
}

export interface Resource {
  id: string;
  name: string;
  capacity: number;
  openTime: string;
  closeTime: string;
}

export interface Reservation {
  id: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface AccessLog {
  id: string;
  userName: string;
  userType: UserType;
  timestamp: string;
  location: string;
  direction: 'entry' | 'exit';
  method: 'Facial' | 'QR Code' | 'Manual' | 'App';
  status: AccessStatus;
  confidence?: number;
}

export interface HardwareStatus {
  id: string;
  name: string;
  type: 'Camera' | 'Controller' | 'Sensor';
  status: 'online' | 'offline' | 'warning';
  battery?: number;
  lastPing: string;
}

export interface SystemMetrics {
  totalUsers: number;
  activeVisitors: number;
  dailyAccesses: number;
  securityAlerts: number;
  pendingDeliveries: number; // Added
}

export interface AIAnalysisResult {
  rawText?: string;
  extractedData?: Record<string, string>;
  confidence?: number;
  summary?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'alert' | 'info' | 'success';
}

export interface SystemSettings {
  notifications: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  security: {
    facialRecognitionThreshold: number;
    autoLockDelay: number;
  };
}

// QR Code Specific Types
export interface QRCodePayload {
  t: 'visitor' | 'resident' | 'employee' | 'provider' | 'dependent' | 'associate'; // Expanded roles
  id: string; // ID of the entity
  nm: string; // Name
  exp: number; // Expiration Timestamp
  unt?: string; // Unit (optional)
  sig?: string; // Cryptographic integrity signature (HMAC-SHA256)
}

export interface QRValidationResult {
  isValid: boolean;
  message: string;
  data?: QRCodePayload;
}

// Autonomous System Types
export interface SystemUpdate {
  id: string;
  version: string;
  description: string;
  type: 'security_patch' | 'feature_update' | 'bug_fix';
  status: 'pending' | 'installing' | 'completed';
  aiGenerated: boolean;
  timestamp: string;
}

export interface SecurityModule {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'integrating';
  integrationLevel: number; // 0-100%
  lastUpdate: string;
}

export interface FinancialAllocation {
  totalInvestment: number;
  creatorSharePercentage: number;
  creatorShareValue: number;
  bankDetails: {
    bank: string;
    branch: string;
    account: string;
  };
  allocations: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}
