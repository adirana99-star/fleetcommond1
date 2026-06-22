export type SyncStatus = 'queued' | 'synced' | 'failed';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type PaymentMethod = 'company_card' | 'cash' | 'driver_paid' | 'fuel_card' | 'other';

export type SalaryPaymentMode = 'cash' | 'paytm' | 'bank_transfer' | 'upi' | 'other';

export type VendorStatus = 'trial' | 'active' | 'paused';

export interface Vendor {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
  email: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
  subscriptionPlan: string;
  status: VendorStatus;
  approvalLimit: number;
  requireReceiptProof: boolean;
  expenseCategories: string[];
  maintenanceTypes: string[];
  // hashed admin password (SHA-256 hex) — optional for legacy/demo vendors
  adminPasswordHash?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  address: string;
  emergencyContact: string;
  assignedVehicleId: string;
  active: boolean;
  photo?: Attachment;
  agreement?: Attachment;
  licenseDocument?: Attachment;
}

export interface Vehicle {
  id: string;
  vendorId: string;
  unitNumber: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  plate: string;
  mileage: number;
  boughtDate: string;
  totalCost: number;
  loanBalance: number;
  monthlyPayment: number;
  active: boolean;
  photo?: Attachment;
}

export interface Attachment {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}

export interface TripLog {
  id: string;
  vendorId: string;
  driverId: string;
  vehicleId: string;
  startPoint: string;
  endPoint: string;
  startDate: string;
  endDate: string;
  tripMoney: number;
  notes: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface ExpenseClaim {
  id: string;
  vendorId: string;
  driverId: string;
  vehicleId: string;
  tripId?: string;
  category: string;
  amount: number;
  vendorPlace: string;
  location: string;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  description: string;
  attachments: Attachment[];
  status: ApprovalStatus;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  adminNote?: string;
  syncStatus: SyncStatus;
}

export interface MaintenanceRequest {
  id: string;
  vendorId: string;
  driverId: string;
  vehicleId: string;
  odometer: number;
  serviceType: string;
  issue: string;
  estimatedCost: number;
  shopName: string;
  attachments: Attachment[];
  status: ApprovalStatus;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  adminNote?: string;
  syncStatus: SyncStatus;
}

export interface SalaryPayment {
  id: string;
  vendorId: string;
  driverId: string;
  vehicleId?: string;
  amount: number;
  paymentDate: string;
  paymentMode: SalaryPaymentMode;
  note?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export type SyncEntity =
  | 'vendor'
  | 'driver'
  | 'vehicle'
  | 'trip_log'
  | 'expense_claim'
  | 'maintenance_request'
  | 'salary_payment';

export interface SyncQueueItem {
  id: string;
  entity: SyncEntity;
  operation: 'create' | 'update' | 'delete';
  payload: Vendor | Driver | Vehicle | TripLog | ExpenseClaim | MaintenanceRequest | SalaryPayment;
  createdAt: string;
}

export interface FleetState {
  vendors: Vendor[];
  drivers: Driver[];
  vehicles: Vehicle[];
  tripLogs: TripLog[];
  expenseClaims: ExpenseClaim[];
  maintenanceRequests: MaintenanceRequest[];
  salaryPayments: SalaryPayment[];
  syncQueue: SyncQueueItem[];
  lastSyncedAt?: string;
  // hashed platform(super-admin) password (SHA-256 hex) — optional
  platformPasswordHash?: string;
}
