import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Gauge,
  MapPin,
  Paperclip,
  Plus,
  Receipt,
  RefreshCw,
  Send,
  ShieldCheck,
  Truck,
  Upload,
  UserPlus,
  Users,
  Wrench,
  XCircle
} from 'lucide-react-native';
import { environment } from './src/config/environment';
import { loginWithBackend } from './src/services/authApi';
import { loadFleetState, resetFleetState, saveFleetState } from './src/services/fleetStore';
import { syncFleetChanges } from './src/services/liveApi';
import { hashPassword } from './src/services/password';
import {
  ApprovalStatus,
  Attachment,
  Driver,
  ExpenseClaim,
  FleetState,
  MaintenanceRequest,
  PaymentMethod,
  SalaryPayment,
  SalaryPaymentMode,
  SyncQueueItem,
  TripLog,
  Vehicle,
  Vendor
} from './src/types';

type AppRole = 'platform' | 'admin' | 'driver';
type UserLoginRole = 'admin' | 'driver';

type Language = 'en' | 'hi';

const languageLabels: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी'
};

type DriverStrings = {
  driverSignIn: string;
  driverAccessOnly: string;
  loginHelp: string;
  language: string;
  mobileNumber: string;
  signIn: string;
  driverPortal: string;
  signedInAs: string;
  signOut: string;
  dashboard: string;
  addTrip: string;
  expense: string;
  maintenance: string;
  selectTab: string;
  noTruck: string;
  tripMoney: string;
  approved: string;
  pending: string;
  myRecords: string;
  addTripLog: string;
  tripHelp: string;
  startPoint: string;
  endPoint: string;
  startDate: string;
  endDate: string;
  tripNotes: string;
  submitTripLog: string;
  claimExpense: string;
  expenseHelp: string;
  expenseType: string;
  amount: string;
  vendorPlace: string;
  location: string;
  paymentMethod: string;
  receiptNumber: string;
  description: string;
  attachReceipt: string;
  submitExpense: string;
  maintenanceRequest: string;
  maintenanceHelp: string;
  serviceType: string;
  odometer: string;
  estimate: string;
  shopName: string;
  issue: string;
  attachQuote: string;
  submitMaintenance: string;
  needDriver: string;
};

const driverTranslations: Record<Language, DriverStrings> = {
  en: {
    driverSignIn: 'Driver sign in',
    driverAccessOnly: 'Driver portal access only',
    loginHelp: 'Enter the mobile number assigned to your account.',
    language: 'Language',
    mobileNumber: 'Mobile number',
    signIn: 'Sign in',
    driverPortal: 'Driver portal',
    signedInAs: 'Signed in as',
    signOut: 'Sign out',
    dashboard: 'Dashboard',
    addTrip: 'Add trip',
    expense: 'Expense',
    maintenance: 'Maintenance',
    selectTab: 'Select a tab to open driver page content.',
    noTruck: 'No truck',
    tripMoney: 'Trip money',
    approved: 'Approved',
    pending: 'Pending',
    myRecords: 'My records',
    addTripLog: 'Add trip log',
    tripHelp: 'Fill in the route and payment details for the current trip.',
    startPoint: 'Start point',
    endPoint: 'End point',
    startDate: 'Start date',
    endDate: 'End date',
    tripNotes: 'Trip notes',
    submitTripLog: 'Submit trip log',
    claimExpense: 'Claim expense',
    expenseHelp: 'Submit a receipt or challan with the appropriate category and location.',
    expenseType: 'Expense type',
    amount: 'Amount',
    vendorPlace: 'Vendor/place',
    location: 'Location',
    paymentMethod: 'Payment method',
    receiptNumber: 'Receipt or challan number',
    description: 'Description',
    attachReceipt: 'Attach receipt/challan',
    submitExpense: 'Submit expense for approval',
    maintenanceRequest: 'Maintenance request',
    maintenanceHelp: 'Describe the issue and attach any estimate or quote from the shop.',
    serviceType: 'Service type',
    odometer: 'Odometer',
    estimate: 'Estimate',
    shopName: 'Shop name',
    issue: 'Issue',
    attachQuote: 'Attach quote/invoice',
    submitMaintenance: 'Submit maintenance request',
    needDriver: 'This vendor needs at least one driver and assigned vehicle.'
  },
  hi: {
    driverSignIn: 'ड्राइवर साइन इन',
    driverAccessOnly: 'केवल ड्राइवर पोर्टल पहुंच',
    loginHelp: 'अपने खाते को सौंपा गया मोबाइल नंबर दर्ज करें।',
    language: 'भाषा',
    mobileNumber: 'मोबाइल नंबर',
    signIn: 'साइन इन करें',
    driverPortal: 'ड्राइवर पोर्टल',
    signedInAs: 'साइन इन किया',
    signOut: 'साइन आउट',
    dashboard: 'डैशबोर्ड',
    addTrip: 'ट्रिप जोड़ें',
    expense: 'खर्च',
    maintenance: 'रखरखाव',
    selectTab: 'ड्राइवर पेज सामग्री खोलने के लिए एक टैब चुनें।',
    noTruck: 'कोई ट्रक नहीं',
    tripMoney: 'ट्रिप राशि',
    approved: 'स्वीकृत',
    pending: 'लंबित',
    myRecords: 'मेरे रिकॉर्ड',
    addTripLog: 'ट्रिप लॉग जोड़ें',
    tripHelp: 'वर्तमान ट्रिप के लिए मार्ग और भुगतान विवरण भरें।',
    startPoint: 'प्रारंभ स्थान',
    endPoint: 'अंतिम स्थान',
    startDate: 'प्रारंभ तिथि',
    endDate: 'अंतिम तिथि',
    tripNotes: 'ट्रिप नोट्स',
    submitTripLog: 'ट्रिप लॉग जमा करें',
    claimExpense: 'खर्च का दावा करें',
    expenseHelp: 'उचित श्रेणी और स्थान के साथ रसीद या चालान जमा करें।',
    expenseType: 'खर्च का प्रकार',
    amount: 'राशि',
    vendorPlace: 'विक्रेता/स्थान',
    location: 'स्थान',
    paymentMethod: 'भुगतान विधि',
    receiptNumber: 'रसीद या चालान नंबर',
    description: 'विवरण',
    attachReceipt: 'रसीद/चालान संलग्न करें',
    submitExpense: 'अनुमोदन के लिए खर्च जमा करें',
    maintenanceRequest: 'रखरखाव अनुरोध',
    maintenanceHelp: 'समस्या का वर्णन करें और दुकान से कोई अनुमान या कोटेशन संलग्न करें।',
    serviceType: 'सेवा प्रकार',
    odometer: 'ओडोमीटर',
    estimate: 'अनुमान',
    shopName: 'दुकान का नाम',
    issue: 'समस्या',
    attachQuote: 'कोटेशन/चालान संलग्न करें',
    submitMaintenance: 'रखरखाव अनुरोध जमा करें',
    needDriver: 'इस विक्रेता को कम से कम एक ड्राइवर और सौंपा गया वाहन चाहिए।'
  }
};


type AdminPortalPage = 'dashboard' | 'vehicles' | 'drivers' | 'entries' | 'approvals' | 'roster';
type UserPortalPage = 'dashboard' | 'trip' | 'expense' | 'maintenance';
type ExpenseLookupDetail = 'claims' | 'maintenance' | 'salary';

type InsightTone = 'good' | 'warning' | 'danger';
type Insight = { title: string; detail: string; tone: InsightTone };

interface VendorForm {
  companyName: string;
  ownerName: string;
  phone: string;
  email: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
  subscriptionPlan: string;
  approvalLimit: string;
  requireReceiptProof: boolean;
  expenseCategories: string;
  maintenanceTypes: string;
  adminPassword?: string;
}

interface VehicleForm {
  unitNumber: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  plate: string;
  mileage: string;
  boughtDate: string;
  totalCost: string;
  loanBalance: string;
  monthlyPayment: string;
  photo?: Attachment;
}

interface DriverForm {
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  address: string;
  emergencyContact: string;
  assignedVehicleId?: string;
  photo?: Attachment;
  agreement?: Attachment;
  licenseDocument?: Attachment;
}

interface TripForm {
  startPoint: string;
  endPoint: string;
  startDate: string;
  endDate: string;
  tripMoney: string;
  notes: string;
}

interface ExpenseForm {
  category: string;
  amount: string;
  vendorPlace: string;
  location: string;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  description: string;
  attachments: Attachment[];
}

interface MaintenanceForm {
  odometer: string;
  serviceType: string;
  issue: string;
  estimatedCost: string;
  shopName: string;
  attachments: Attachment[];
}

interface AdminExpenseEntryForm {
  tripId: string;
  driverId: string;
  vehicleId: string;
  category: string;
  amount: string;
  vendorPlace: string;
  location: string;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  description: string;
}

interface AdminMaintenanceEntryForm {
  tripId: string;
  driverId: string;
  vehicleId: string;
  serviceType: string;
  odometer: string;
  estimatedCost: string;
  shopName: string;
  issue: string;
}

interface AdminSalaryEntryForm {
  driverId: string;
  vehicleId: string;
  amount: string;
  paymentDate: string;
  paymentMode: SalaryPaymentMode;
  note: string;
}

const defaultCategories = 'Toll, Fuel, Parking, Parts';
const defaultMaintenance = 'Oil change, Tires, Brake service, Engine';

const emptyVendorForm: VendorForm = {
  companyName: '',
  ownerName: '',
  phone: '',
  email: '',
  logoText: '',
  primaryColor: '#2563eb',
  accentColor: '#2563eb',
  subscriptionPlan: 'Enterprise',
  approvalLimit: '0',
  requireReceiptProof: false,
  expenseCategories: defaultCategories,
  maintenanceTypes: defaultMaintenance,
  adminPassword: ''
};

const emptyVehicleForm: VehicleForm = {
  unitNumber: '',
  make: '',
  model: '',
  year: '',
  vin: '',
  plate: '',
  mileage: '',
  boughtDate: '',
  totalCost: '',
  loanBalance: '0',
  monthlyPayment: '0'
};

const emptyDriverForm: DriverForm = {
  name: '',
  phone: '',
  email: '',
  licenseNumber: '',
  address: '',
  emergencyContact: '',
  assignedVehicleId: ''
};

const emptyTripForm: TripForm = {
  startPoint: '',
  endPoint: '',
  startDate: '',
  endDate: '',
  tripMoney: '',
  notes: ''
};


const emptyExpenseForm: ExpenseForm = {
  category: 'Toll',
  amount: '',
  vendorPlace: '',
  location: '',
  paymentMethod: 'driver_paid',
  receiptNumber: '',
  description: '',
  attachments: []
};

const emptyMaintenanceForm: MaintenanceForm = {
  odometer: '',
  serviceType: '',
  issue: '',
  estimatedCost: '',
  shopName: '',
  attachments: []
};

const emptyAdminExpenseEntryForm: AdminExpenseEntryForm = {
  tripId: '',
  driverId: '',
  vehicleId: '',
  category: 'Toll',
  amount: '',
  vendorPlace: '',
  location: '',
  paymentMethod: 'driver_paid',
  receiptNumber: '',
  description: ''
};

const emptyAdminMaintenanceEntryForm: AdminMaintenanceEntryForm = {
  tripId: '',
  driverId: '',
  vehicleId: '',
  serviceType: '',
  odometer: '',
  estimatedCost: '',
  shopName: '',
  issue: ''
};

const emptyAdminSalaryEntryForm: AdminSalaryEntryForm = {
  driverId: '',
  vehicleId: '',
  amount: '',
  paymentDate: '',
  paymentMode: 'cash',
  note: ''
};

const paymentLabels: Record<PaymentMethod, string> = {
  company_card: 'Company card',
  cash: 'Cash',
  driver_paid: 'Driver paid',
  fuel_card: 'Fuel card',
  other: 'Other'
};

const salaryPaymentModeLabels: Record<SalaryPaymentMode, string> = {
  cash: 'Cash',
  paytm: 'Paytm',
  bank_transfer: 'Bank transfer',
  upi: 'UPI',
  other: 'Other'
};

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const compactDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readNumber(value: string): number {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function money(value: number): string {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string): string {
  return value ? compactDateFormatter.format(new Date(value)) : 'Not synced';
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvCell(value: string | number | undefined): string {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function vendorToForm(vendor?: Vendor): VendorForm {
  if (!vendor) {
    return emptyVendorForm;
  }

  return {
    companyName: vendor.companyName,
    ownerName: vendor.ownerName,
    phone: vendor.phone,
    email: vendor.email,
    logoText: vendor.logoText,
    primaryColor: vendor.primaryColor,
    accentColor: vendor.accentColor,
    subscriptionPlan: vendor.subscriptionPlan,
    approvalLimit: String(vendor.approvalLimit),
    requireReceiptProof: vendor.requireReceiptProof,
    expenseCategories: vendor.expenseCategories.join(', '),
    maintenanceTypes: vendor.maintenanceTypes.join(', ')
    ,
    adminPassword: ''
  };
}

function queueItem(
  entity: SyncQueueItem['entity'],
  operation: SyncQueueItem['operation'],
  payload: SyncQueueItem['payload']
): SyncQueueItem {
  return {
    id: newId('queue'),
    entity,
    operation,
    payload,
    createdAt: new Date().toISOString()
  };
}

function getVendor(fleet: FleetState, vendorId: string): Vendor | undefined {
  return fleet.vendors.find((vendor) => vendor.id === vendorId);
}

function getDriver(fleet: FleetState, driverId: string): Driver | undefined {
  return fleet.drivers.find((driver) => driver.id === driverId);
}

function getVehicle(fleet: FleetState, vehicleId: string): Vehicle | undefined {
  return fleet.vehicles.find((vehicle) => vehicle.id === vehicleId);
}

function getAssignedVehicle(fleet: FleetState, driver?: Driver): Vehicle | undefined {
  return driver ? getVehicle(fleet, driver.assignedVehicleId) : undefined;
}

function vendorDrivers(fleet: FleetState, vendorId: string): Driver[] {
  return fleet.drivers.filter((driver) => driver.vendorId === vendorId);
}

function vendorVehicles(fleet: FleetState, vendorId: string): Vehicle[] {
  return fleet.vehicles.filter((vehicle) => vehicle.vendorId === vendorId);
}

function vendorTrips(fleet: FleetState, vendorId: string): TripLog[] {
  return fleet.tripLogs.filter((trip) => trip.vendorId === vendorId);
}

function vendorExpenses(fleet: FleetState, vendorId: string): ExpenseClaim[] {
  return fleet.expenseClaims.filter((claim) => claim.vendorId === vendorId);
}

function vendorMaintenance(fleet: FleetState, vendorId: string): MaintenanceRequest[] {
  return fleet.maintenanceRequests.filter((request) => request.vendorId === vendorId);
}

function totalTripMoney(fleet: FleetState, vendorId?: string): number {
  return fleet.tripLogs
    .filter((trip) => !vendorId || trip.vendorId === vendorId)
    .reduce((sum, trip) => sum + trip.tripMoney, 0);
}

function totalExpenses(fleet: FleetState, vendorId?: string, status?: ApprovalStatus): number {
  return fleet.expenseClaims
    .filter((claim) => (!vendorId || claim.vendorId === vendorId) && (!status || claim.status === status))
    .reduce((sum, claim) => sum + claim.amount, 0);
}

function totalLoans(fleet: FleetState, vendorId?: string): number {
  return fleet.vehicles
    .filter((vehicle) => !vendorId || vehicle.vendorId === vendorId)
    .reduce((sum, vehicle) => sum + vehicle.loanBalance, 0);
}

function statusTone(status: ApprovalStatus): { backgroundColor: string; borderColor: string; color: string } {
  if (status === 'approved') {
    return { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' };
  }

  if (status === 'rejected') {
    return { backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#be123c' };
  }

  return { backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#b45309' };
}

function buildVendorInsights(fleet: FleetState, vendor: Vendor): Insight[] {
  const claims = vendorExpenses(fleet, vendor.id);
  const pendingClaims = claims.filter((claim) => claim.status === 'pending');
  const missingProof = pendingClaims.filter((claim) => claim.attachments.length === 0 && !claim.receiptNumber);
  const pendingOverLimit = pendingClaims.filter((claim) => claim.amount > vendor.approvalLimit);
  const maintenance = vendorMaintenance(fleet, vendor.id).filter((request) => request.status === 'pending');
  const highMileage = vendorVehicles(fleet, vendor.id).filter((vehicle) => vehicle.mileage >= 250000);
  const revenue = totalTripMoney(fleet, vendor.id);
  const approved = totalExpenses(fleet, vendor.id, 'approved');
  const pending = totalExpenses(fleet, vendor.id, 'pending');
  const insights: Insight[] = [];

  if (missingProof.length > 0) {
    insights.push({
      title: `${missingProof.length} claim(s) missing proof`,
      detail: vendor.requireReceiptProof
        ? 'This vendor requires receipt or challan proof before approval.'
        : 'Proof is optional, but admin may still request it.',
      tone: 'warning'
    });
  }

  if (pendingOverLimit.length > 0) {
    insights.push({
      title: `${pendingOverLimit.length} claim(s) above approval limit`,
      detail: `Vendor approval limit is ${money(vendor.approvalLimit)}.`,
      tone: 'danger'
    });
  }

  if (maintenance.length > 0) {
    insights.push({
      title: `${maintenance.length} maintenance request(s) waiting`,
      detail: 'Review shop, odometer, and estimate before dispatch.',
      tone: 'warning'
    });
  }

  if (highMileage.length > 0) {
    insights.push({
      title: 'Maintenance watchlist',
      detail: `${highMileage.map((vehicle) => vehicle.unitNumber).join(', ')} over 250k miles.`,
      tone: 'warning'
    });
  }

  insights.push({
    title: revenue - approved >= 0 ? 'Profit signal positive' : 'Profit signal needs review',
    detail: `Trip money ${money(revenue)}, approved expenses ${money(approved)}, pending ${money(pending)}.`,
    tone: revenue - approved >= 0 ? 'good' : 'danger'
  });

  return insights.slice(0, 4);
}

function buildPlatformInsights(fleet: FleetState): Insight[] {
  const activeVendors = fleet.vendors.filter((vendor) => vendor.status === 'active').length;
  const pending = fleet.expenseClaims.filter((claim) => claim.status === 'pending');
  const missingProof = pending.filter((claim) => claim.attachments.length === 0 && !claim.receiptNumber);
  const trialVendors = fleet.vendors.filter((vendor) => vendor.status === 'trial').length;
  const revenue = totalTripMoney(fleet);
  const approved = totalExpenses(fleet, undefined, 'approved');

  return [
    {
      title: `${activeVendors} active vendor(s)`,
      detail: `${trialVendors} trial account(s) can be converted to paid plans.`,
      tone: 'good'
    },
    {
      title: `${pending.length} claim(s) pending across all vendors`,
      detail: `${missingProof.length} still need receipt, challan, or attachment proof.`,
      tone: pending.length > 0 ? 'warning' : 'good'
    },
    {
      title: 'Platform revenue signal',
      detail: `All vendor trip money ${money(revenue)} minus approved expenses ${money(approved)}.`,
      tone: revenue >= approved ? 'good' : 'danger'
    }
  ];
}

function claimRisk(claim: ExpenseClaim, vendor: Vendor): string {
  if (claim.status !== 'pending') {
    return claim.status === 'approved' ? 'Approved' : 'Rejected';
  }

  if (vendor.requireReceiptProof && claim.attachments.length === 0 && !claim.receiptNumber) {
    return 'Proof required by vendor settings';
  }

  if (claim.amount > vendor.approvalLimit) {
    return `Above ${money(vendor.approvalLimit)} approval limit`;
  }

  return 'Ready for review';
}

async function pickAttachments(): Promise<Attachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true,
    type: ['image/*', 'application/pdf']
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset) => ({
    id: newId('attach'),
    name: asset.name,
    uri: asset.uri,
    mimeType: asset.mimeType,
    size: asset.size
  }));
}

async function pickSingleAttachment(): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ['image/*', 'application/pdf']
  });

  if (result.canceled || !result.assets.length) {
    return null;
  }

  const asset = result.assets[0];
  return {
    id: newId('attach'),
    name: asset.name,
    uri: asset.uri,
    mimeType: asset.mimeType,
    size: asset.size
  };
}

export default function App() {
  const [fleet, setFleet] = useState<FleetState | null>(null);
  const [role, setRole] = useState<AppRole>('platform');
  const [showLanding, setShowLanding] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [newVendorForm, setNewVendorForm] = useState<VendorForm>(emptyVendorForm);
  const [vendorSettingsForm, setVendorSettingsForm] = useState<VendorForm>(emptyVendorForm);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(emptyVehicleForm);
  const [driverForm, setDriverForm] = useState<DriverForm>(emptyDriverForm);
  const [tripForm, setTripForm] = useState<TripForm>(emptyTripForm);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpenseForm);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceForm>(emptyMaintenanceForm);
  const [adminExpenseEntryForm, setAdminExpenseEntryForm] = useState<AdminExpenseEntryForm>(emptyAdminExpenseEntryForm);
  const [adminMaintenanceEntryForm, setAdminMaintenanceEntryForm] = useState<AdminMaintenanceEntryForm>(emptyAdminMaintenanceEntryForm);
  const [adminSalaryEntryForm, setAdminSalaryEntryForm] = useState<AdminSalaryEntryForm>(emptyAdminSalaryEntryForm);
  const [notice, setNotice] = useState('Multi-vendor app is ready.');
  const [syncing, setSyncing] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changeOldPassword, setChangeOldPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [loggedInPhone, setLoggedInPhone] = useState('');
  const [loggedInRole, setLoggedInRole] = useState<AppRole | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminPage, setAdminPage] = useState<AdminPortalPage | null>(null);
  const [driverPage, setDriverPage] = useState<UserPortalPage | null>(null);

  useEffect(() => {
    loadFleetState().then((saved) => {
      const firstVendorId = saved.vendors[0]?.id || '';
      const firstDriverId = saved.drivers.find((driver) => driver.vendorId === firstVendorId)?.id || '';
      const firstVehicleId = saved.vehicles.find((vehicle) => vehicle.vendorId === firstVendorId)?.id || '';
      setFleet(saved);
      setSelectedVendorId(firstVendorId);
      setSelectedDriverId(firstDriverId);
      setVendorSettingsForm(vendorToForm(saved.vendors[0]));
      setDriverForm({ ...emptyDriverForm, assignedVehicleId: firstVehicleId });
      setExpenseForm({ ...emptyExpenseForm, category: saved.vendors[0]?.expenseCategories[0] || 'Toll' });
      setMaintenanceForm({ ...emptyMaintenanceForm, serviceType: saved.vendors[0]?.maintenanceTypes[0] || '' });
      setAdminExpenseEntryForm({
        ...emptyAdminExpenseEntryForm,
        category: saved.vendors[0]?.expenseCategories[0] || 'Toll',
        driverId: firstDriverId,
        vehicleId: firstVehicleId
      });
      setAdminMaintenanceEntryForm({
        ...emptyAdminMaintenanceEntryForm,
        serviceType: saved.vendors[0]?.maintenanceTypes[0] || '',
        driverId: firstDriverId,
        vehicleId: firstVehicleId
      });
      setAdminSalaryEntryForm({
        ...emptyAdminSalaryEntryForm,
        driverId: firstDriverId,
        vehicleId: firstVehicleId,
        paymentDate: new Date().toISOString().slice(0, 10)
      });
    });
  }, []);

  const selectedVendor = useMemo(
    () => (fleet ? getVendor(fleet, selectedVendorId) : undefined),
    [fleet, selectedVendorId]
  );

  const selectedDriver = useMemo(
    () => fleet?.drivers.find((driver) => driver.id === selectedDriverId),
    [fleet?.drivers, selectedDriverId]
  );

  const selectedVehicle = useMemo(
    () => (fleet && selectedDriver ? getAssignedVehicle(fleet, selectedDriver) : undefined),
    [fleet, selectedDriver]
  );

  const requiresLogin = (role === 'platform' || role === 'admin' || role === 'driver') && loggedInRole !== role;
  const isPortalActive = !requiresLogin && (role === 'admin' || role === 'driver');
  const showVendorSelector = role === 'platform' ? loggedInRole === 'platform' : !isPortalActive;

  useEffect(() => {
    if (!fleet || !selectedVendor) {
      return;
    }

    const firstDriver = fleet.drivers.find((driver) => driver.vendorId === selectedVendor.id);
    const firstVehicle = fleet.vehicles.find((vehicle) => vehicle.vendorId === selectedVendor.id);
    setVendorSettingsForm(vendorToForm(selectedVendor));
    setSelectedDriverId((current) =>
      fleet.drivers.some((driver) => driver.id === current && driver.vendorId === selectedVendor.id)
        ? current
        : firstDriver?.id || ''
    );
    setDriverForm((current) => ({ ...current, assignedVehicleId: firstVehicle?.id || '' }));
    setExpenseForm((current) => ({ ...current, category: selectedVendor.expenseCategories[0] || 'Other' }));
    setMaintenanceForm((current) => ({ ...current, serviceType: selectedVendor.maintenanceTypes[0] || '' }));
    setAdminExpenseEntryForm((current) => ({
      ...current,
      category: selectedVendor.expenseCategories[0] || 'Other',
      driverId: firstDriver?.id || '',
      vehicleId: firstVehicle?.id || '',
      tripId: ''
    }));
    setAdminMaintenanceEntryForm((current) => ({
      ...current,
      serviceType: selectedVendor.maintenanceTypes[0] || '',
      driverId: firstDriver?.id || '',
      vehicleId: firstVehicle?.id || '',
      tripId: ''
    }));
    setAdminSalaryEntryForm((current) => ({
      ...current,
      driverId: firstDriver?.id || '',
      vehicleId: firstVehicle?.id || '',
      paymentDate: current.paymentDate || new Date().toISOString().slice(0, 10)
    }));
  }, [fleet, selectedVendorId, selectedVendor]);

  function persist(next: FleetState) {
    setFleet(next);
    saveFleetState(next).catch(() => {
      setNotice('The app updated, but local storage rejected the save.');
    });
  }

  async function runSync(currentFleet: FleetState, silent = false) {
    if (syncing) {
      return;
    }

    setSyncing(true);

    try {
      const result = await syncFleetChanges(currentFleet.syncQueue, authToken || undefined);
      if (!silent) {
        setNotice(result.message);
      }

      if (result.ok && !result.skipped) {
        persist({
          ...currentFleet,
          tripLogs: currentFleet.tripLogs.map((trip) => ({ ...trip, syncStatus: 'synced' })),
          expenseClaims: currentFleet.expenseClaims.map((claim) => ({ ...claim, syncStatus: 'synced' })),
          maintenanceRequests: currentFleet.maintenanceRequests.map((request) => ({ ...request, syncStatus: 'synced' })),
          salaryPayments: currentFleet.salaryPayments.map((payment) => ({ ...payment, syncStatus: 'synced' })),
          syncQueue: [],
          lastSyncedAt: new Date().toISOString()
        });
      }
    } catch {
      if (!silent) {
        setNotice('Could not reach the live API. Updates are still saved locally.');
      }
    } finally {
      setSyncing(false);
    }
  }

  function normalizePhone(phone: string) {
    return phone.replace(/\D/g, '');
  }

  function phoneMatches(storedPhone: string, inputPhone: string) {
    const normalizedStored = normalizePhone(storedPhone);
    const normalizedInput = normalizePhone(inputPhone);
    return normalizedStored.endsWith(normalizedInput) || normalizedInput.endsWith(normalizedStored);
  }

  useEffect(() => {
    if (!fleet || !environment.apiBaseUrl || fleet.syncQueue.length === 0 || syncing) {
      return;
    }

    runSync(fleet, true);
  }, [fleet?.syncQueue.length, environment.apiBaseUrl, authToken]);

  async function handleLogin() {
    if (!fleet) {
      return;
    }

    const entry = loginPhone.trim();
    if (role === 'driver') {
      if (!entry) {
        setLoginError('Enter a valid mobile number to continue.');
        return;
      }

      if (environment.apiBaseUrl) {
        try {
          const response = await loginWithBackend({
            role: 'driver',
            phone: entry
          });
          if (response.driver?.vendorId) {
            setSelectedVendorId(response.driver.vendorId);
          }
          if (response.driver?.id) {
            setSelectedDriverId(response.driver.id);
          }
          setLoggedInPhone(response.driver?.phone || entry);
          setLoggedInRole('driver');
          setDriverPage(null);
          setAuthToken(response.token);
          setLoginError('');
          setNotice(`Driver ${response.driver?.name || ''} signed in with backend auth.`.trim());
          return;
        } catch (error) {
          // Backend could not authenticate (e.g. driver not yet synced). Fall back to local auth.
        }
      }

      const driver = fleet.drivers.find((driver) => phoneMatches(driver.phone, entry));
      if (!driver) {
        setLoginError('No driver found for that mobile number.');
        return;
      }

      setSelectedVendorId(driver.vendorId);
      setSelectedDriverId(driver.id);
      setLoggedInPhone(driver.phone);
      setLoggedInRole('driver');
      setDriverPage(null);
      setAuthToken('');
      setLoginError('');
      setNotice(`Driver ${driver.name} signed in for ${fleet.vendors.find((vendor) => vendor.id === driver.vendorId)?.companyName || 'vendor'}.`);
      return;
    }

    if (role === 'platform') {
      const platformPassword = loginPassword;
      if (!platformPassword) {
        setLoginError('Enter the Super Admin password.');
        return;
      }

      if (environment.apiBaseUrl) {
        try {
          const response = await loginWithBackend({
            role: 'platform',
            password: platformPassword
          });
          setAuthToken(response.token);
          setLoggedInRole('platform');
          setAdminPage(null);
          setDriverPage(null);
          setLoggedInPhone('');
          setLoginPassword('');
          setLoginError('');
          setNotice('Platform Super Admin signed in with backend auth.');
          return;
        } catch (error) {
          // Backend platform login not configured. Fall back to local auth.
        }
      }

      // Local fallback when API base URL is not configured.
      if (!fleet.platformPasswordHash) {
        const updated = { ...fleet, platformPasswordHash: hashPassword(platformPassword) };
        persist(updated);
        setLoggedInRole('platform');
        setAdminPage(null);
        setDriverPage(null);
        setLoggedInPhone('');
        setAuthToken('');
        setLoginPassword('');
        setLoginError('');
        setNotice('Platform Super Admin signed in.');
        return;
      }

      if (hashPassword(platformPassword) !== fleet.platformPasswordHash) {
        setLoginError('Invalid Super Admin password.');
        return;
      }

      setLoggedInRole('platform');
      setAdminPage(null);
      setDriverPage(null);
      setLoggedInPhone('');
      setAuthToken('');
      setLoginPassword('');
      setLoginError('');
      setNotice('Platform Super Admin signed in.');
      return;
    }

    if (role === 'admin') {
      if (!entry) {
        setLoginError('Enter a valid mobile number to continue.');
        return;
      }

      if (!loginPassword) {
        setLoginError('Enter the admin password.');
        return;
      }

      if (environment.apiBaseUrl) {
        try {
          const response = await loginWithBackend({
            role: 'admin',
            phone: entry,
            password: loginPassword
          });
          const backendVendorId = response.vendor?.id;
          if (backendVendorId) {
            setSelectedVendorId(backendVendorId);
          }
          setAuthToken(response.token);
          setLoggedInPhone(response.vendor?.phone || entry);
          setLoggedInRole('admin');
          setAdminPage(null);
          setLoginError('');
          setLoginPassword('');
          setNotice(`Admin signed in for ${response.vendor?.companyName || 'vendor'} with backend auth.`);
          return;
        } catch (error) {
          // Backend could not authenticate (e.g. vendor not yet synced). Fall back to local auth.
        }
      }

      const vendor = fleet.vendors.find((item) => phoneMatches(item.phone, entry));
      if (!vendor) {
        setLoginError('No admin account found for that mobile number.');
        return;
      }

      if (!vendor.adminPasswordHash) {
        setLoginError('This vendor does not have an admin password set.');
        return;
      }

      if (hashPassword(loginPassword) !== vendor.adminPasswordHash) {
        setLoginError('Invalid password for admin account.');
        return;
      }

      setSelectedVendorId(vendor.id);
      setAuthToken('');
      setLoggedInPhone(vendor.phone);
      setLoggedInRole('admin');
      setAdminPage(null);
      setLoginError('');
      setLoginPassword('');
      setNotice(`Admin ${vendor.ownerName} signed in for ${vendor.companyName}.`);
      return;
    }

    setLoginError('Select a role and enter your mobile number.');
  }

  function handleLogout() {
    setAuthToken('');
    setLoggedInPhone('');
    setLoggedInRole(null);
    setAdminPage(null);
    setDriverPage(null);
    setLoginPhone('');
    setLoginError('');
    setLoginPassword('');
    setNotice('Signed out. Select a role to continue.');
  }

  function addVendor() {
    if (!fleet) {
      return;
    }

    const approvalLimit = readNumber(newVendorForm.approvalLimit || '0');
    const categories = splitList(newVendorForm.expenseCategories);
    const maintenanceTypes = splitList(newVendorForm.maintenanceTypes);

    if (!newVendorForm.companyName.trim() || !newVendorForm.ownerName.trim()) {
      setNotice('Vendor company name and owner name are required.');
      return;
    }

    if (!newVendorForm.adminPassword || !newVendorForm.adminPassword.trim()) {
      setNotice('Set an admin password for this vendor.');
      return;
    }

    const vendor: Vendor = {
      id: newId('vendor'),
      companyName: newVendorForm.companyName.trim(),
      ownerName: newVendorForm.ownerName.trim(),
      phone: newVendorForm.phone.trim(),
      email: newVendorForm.email.trim(),
      logoText: newVendorForm.logoText.trim() || newVendorForm.companyName.trim().slice(0, 2).toUpperCase(),
      primaryColor: newVendorForm.primaryColor.trim() || '#2563eb',
      accentColor: newVendorForm.accentColor.trim() || '#2563eb',
      subscriptionPlan: newVendorForm.subscriptionPlan.trim() || 'Enterprise',
      status: 'trial',
      approvalLimit: Number.isFinite(approvalLimit) ? approvalLimit : 0,
      requireReceiptProof: newVendorForm.requireReceiptProof,
      expenseCategories: categories.length > 0 ? categories : splitList(defaultCategories),
      maintenanceTypes: maintenanceTypes.length > 0 ? maintenanceTypes : splitList(defaultMaintenance),
      adminPasswordHash: newVendorForm.adminPassword ? hashPassword(newVendorForm.adminPassword) : undefined,
      createdAt: new Date().toISOString()
    };

    persist({
      ...fleet,
      vendors: [vendor, ...fleet.vendors],
      syncQueue: [queueItem('vendor', 'create', vendor), ...fleet.syncQueue]
    });
    setSelectedVendorId(vendor.id);
    setNewVendorForm(emptyVendorForm);
    setNotice(`${vendor.companyName} added as a new vendor in the same app.`);
  }

  function saveVendorSettings() {
    if (!fleet || !selectedVendor) {
      return;
    }

    const approvalLimit = readNumber(vendorSettingsForm.approvalLimit || '0');
    const updated: Vendor = {
      ...selectedVendor,
      companyName: vendorSettingsForm.companyName.trim() || selectedVendor.companyName,
      ownerName: vendorSettingsForm.ownerName.trim() || selectedVendor.ownerName,
      phone: vendorSettingsForm.phone.trim(),
      email: vendorSettingsForm.email.trim(),
      logoText: vendorSettingsForm.logoText.trim() || selectedVendor.logoText,
      primaryColor: vendorSettingsForm.primaryColor.trim() || selectedVendor.primaryColor,
      accentColor: vendorSettingsForm.accentColor.trim() || selectedVendor.accentColor,
      subscriptionPlan: vendorSettingsForm.subscriptionPlan.trim() || selectedVendor.subscriptionPlan,
      approvalLimit: Number.isFinite(approvalLimit) ? approvalLimit : selectedVendor.approvalLimit,
      requireReceiptProof: vendorSettingsForm.requireReceiptProof,
      expenseCategories: splitList(vendorSettingsForm.expenseCategories),
      maintenanceTypes: splitList(vendorSettingsForm.maintenanceTypes)
    };

    persist({
      ...fleet,
      vendors: fleet.vendors.map((vendor) => (vendor.id === selectedVendor.id ? updated : vendor)),
      syncQueue: [queueItem('vendor', 'update', updated), ...fleet.syncQueue]
    });
    setNotice(`${updated.companyName} customization saved.`);
  }

  function addVehicle() {
    if (!fleet || !selectedVendor) {
      return;
    }

    const mileage = readNumber(vehicleForm.mileage);
    const totalCost = readNumber(vehicleForm.totalCost);
    const loanBalance = readNumber(vehicleForm.loanBalance || '0');
    const monthlyPayment = readNumber(vehicleForm.monthlyPayment || '0');

    if (!vehicleForm.unitNumber.trim() || !vehicleForm.make.trim() || !vehicleForm.model.trim()) {
      setNotice('Vehicle unit number, make, and model are required.');
      return;
    }

    if (!Number.isFinite(mileage) || !Number.isFinite(totalCost)) {
      setNotice('Vehicle mileage and total cost must be valid numbers.');
      return;
    }

    const vehicle: Vehicle = {
      id: newId('vehicle'),
      vendorId: selectedVendor.id,
      unitNumber: vehicleForm.unitNumber.trim(),
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      year: vehicleForm.year.trim(),
      vin: vehicleForm.vin.trim(),
      plate: vehicleForm.plate.trim(),
      mileage,
      boughtDate: vehicleForm.boughtDate.trim(),
      totalCost,
      loanBalance: Number.isFinite(loanBalance) ? loanBalance : 0,
      monthlyPayment: Number.isFinite(monthlyPayment) ? monthlyPayment : 0,
      active: true,
      photo: vehicleForm.photo
    };

    persist({
      ...fleet,
      vehicles: [vehicle, ...fleet.vehicles],
      syncQueue: [queueItem('vehicle', 'create', vehicle), ...fleet.syncQueue]
    });
    setVehicleForm(emptyVehicleForm);
    setDriverForm((current) => ({ ...current, assignedVehicleId: vehicle.id }));
    setNotice(`${vehicle.unitNumber} added for ${selectedVendor.companyName}.`);
  }

  function addDriver() {
    if (!fleet || !selectedVendor) {
      return;
    }

    const vehicleId = driverForm.assignedVehicleId || vendorVehicles(fleet, selectedVendor.id)[0]?.id || '';

    if (!driverForm.name.trim() || !driverForm.phone.trim() || !driverForm.licenseNumber.trim()) {
      setNotice('Driver name, phone, and license number are required.');
      return;
    }

    if (!vehicleId) {
      setNotice('Add a vehicle for this vendor before adding a driver.');
      return;
    }

    const driver: Driver = {
      id: newId('driver'),
      vendorId: selectedVendor.id,
      name: driverForm.name.trim(),
      phone: driverForm.phone.trim(),
      email: driverForm.email.trim(),
      licenseNumber: driverForm.licenseNumber.trim(),
      address: driverForm.address.trim(),
      emergencyContact: driverForm.emergencyContact.trim(),
      assignedVehicleId: vehicleId,
      active: true,
      photo: driverForm.photo,
      agreement: driverForm.agreement,
      licenseDocument: driverForm.licenseDocument
    };

    persist({
      ...fleet,
      drivers: [driver, ...fleet.drivers],
      syncQueue: [queueItem('driver', 'create', driver), ...fleet.syncQueue]
    });
    setSelectedDriverId(driver.id);
    setDriverForm({ ...emptyDriverForm, assignedVehicleId: vehicleId });
    setNotice(`${driver.name} added for ${selectedVendor.companyName}.`);
  }

  function addTripLog() {
    if (!fleet || !selectedVendor || !selectedDriver || !selectedVehicle) {
      return;
    }

    const tripMoney = readNumber(tripForm.tripMoney);

    if (!tripForm.startPoint.trim() || !tripForm.endPoint.trim() || !Number.isFinite(tripMoney)) {
      setNotice('Trip start point, end point, and trip money are required.');
      return;
    }

    const trip: TripLog = {
      id: newId('trip'),
      vendorId: selectedVendor.id,
      driverId: selectedDriver.id,
      vehicleId: selectedVehicle.id,
      startPoint: tripForm.startPoint.trim(),
      endPoint: tripForm.endPoint.trim(),
      startDate: tripForm.startDate.trim(),
      endDate: tripForm.endDate.trim(),
      tripMoney,
      notes: tripForm.notes.trim(),
      createdAt: new Date().toISOString(),
      syncStatus: 'queued'
    };

    persist({
      ...fleet,
      tripLogs: [trip, ...fleet.tripLogs],
      syncQueue: [queueItem('trip_log', 'create', trip), ...fleet.syncQueue]
    });
    setTripForm(emptyTripForm);
    setNotice(`Trip submitted under ${selectedVendor.companyName}.`);
  }

  function addExpenseClaim() {
    if (!fleet || !selectedVendor || !selectedDriver || !selectedVehicle) {
      return;
    }

    const amount = readNumber(expenseForm.amount);

    if (!Number.isFinite(amount) || amount <= 0 || !expenseForm.vendorPlace.trim()) {
      setNotice('Expense amount and vendor/place are required.');
      return;
    }

    if (selectedVendor.requireReceiptProof && !expenseForm.receiptNumber.trim() && expenseForm.attachments.length === 0) {
      setNotice(`${selectedVendor.companyName} requires receipt/challan proof for claims.`);
      return;
    }

    const latestTrip = fleet.tripLogs.find((trip) => trip.driverId === selectedDriver.id);
    const claim: ExpenseClaim = {
      id: newId('expense'),
      vendorId: selectedVendor.id,
      driverId: selectedDriver.id,
      vehicleId: selectedVehicle.id,
      tripId: latestTrip?.id,
      category: expenseForm.category || selectedVendor.expenseCategories[0] || 'Other',
      amount,
      vendorPlace: expenseForm.vendorPlace.trim(),
      location: expenseForm.location.trim(),
      paymentMethod: expenseForm.paymentMethod,
      receiptNumber: expenseForm.receiptNumber.trim(),
      description: expenseForm.description.trim(),
      attachments: expenseForm.attachments,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      syncStatus: 'queued'
    };

    persist({
      ...fleet,
      expenseClaims: [claim, ...fleet.expenseClaims],
      syncQueue: [queueItem('expense_claim', 'create', claim), ...fleet.syncQueue]
    });
    setExpenseForm({ ...emptyExpenseForm, category: selectedVendor.expenseCategories[0] || 'Other' });
    setNotice(`${claim.category} claim submitted for ${selectedVendor.companyName} admin approval.`);
  }

  function addMaintenanceRequest() {
    if (!fleet || !selectedVendor || !selectedDriver || !selectedVehicle) {
      return;
    }

    const odometer = readNumber(maintenanceForm.odometer);
    const estimatedCost = readNumber(maintenanceForm.estimatedCost || '0');

    if (!Number.isFinite(odometer) || !maintenanceForm.serviceType.trim() || !maintenanceForm.issue.trim()) {
      setNotice('Maintenance odometer, service type, and issue are required.');
      return;
    }

    const request: MaintenanceRequest = {
      id: newId('maint'),
      vendorId: selectedVendor.id,
      driverId: selectedDriver.id,
      vehicleId: selectedVehicle.id,
      odometer,
      serviceType: maintenanceForm.serviceType.trim(),
      issue: maintenanceForm.issue.trim(),
      estimatedCost: Number.isFinite(estimatedCost) ? estimatedCost : 0,
      shopName: maintenanceForm.shopName.trim(),
      attachments: maintenanceForm.attachments,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      syncStatus: 'queued'
    };

    persist({
      ...fleet,
      maintenanceRequests: [request, ...fleet.maintenanceRequests],
      syncQueue: [queueItem('maintenance_request', 'create', request), ...fleet.syncQueue]
    });
    setMaintenanceForm({ ...emptyMaintenanceForm, serviceType: selectedVendor.maintenanceTypes[0] || '' });
    setNotice(`Maintenance request submitted for ${selectedVendor.companyName}.`);
  }

  function addAdminExpenseEntry() {
    if (!fleet || !selectedVendor) {
      return;
    }

    const amount = readNumber(adminExpenseEntryForm.amount);
    if (!adminExpenseEntryForm.driverId || !adminExpenseEntryForm.vehicleId) {
      setNotice('Select driver and vehicle for the expense.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0 || !adminExpenseEntryForm.vendorPlace.trim()) {
      setNotice('Expense amount and vendor/place are required.');
      return;
    }

    const claim: ExpenseClaim = {
      id: newId('expense'),
      vendorId: selectedVendor.id,
      driverId: adminExpenseEntryForm.driverId,
      vehicleId: adminExpenseEntryForm.vehicleId,
      tripId: adminExpenseEntryForm.tripId || undefined,
      category: adminExpenseEntryForm.category || selectedVendor.expenseCategories[0] || 'Other',
      amount,
      vendorPlace: adminExpenseEntryForm.vendorPlace.trim(),
      location: adminExpenseEntryForm.location.trim(),
      paymentMethod: adminExpenseEntryForm.paymentMethod,
      receiptNumber: adminExpenseEntryForm.receiptNumber.trim(),
      description: adminExpenseEntryForm.description.trim(),
      attachments: [],
      status: 'pending',
      submittedAt: new Date().toISOString(),
      decidedBy: 'Vendor Admin',
      syncStatus: 'queued'
    };

    persist({
      ...fleet,
      expenseClaims: [claim, ...fleet.expenseClaims],
      syncQueue: [queueItem('expense_claim', 'create', claim), ...fleet.syncQueue]
    });

    setAdminExpenseEntryForm({
      ...emptyAdminExpenseEntryForm,
      category: selectedVendor.expenseCategories[0] || 'Other',
      driverId: adminExpenseEntryForm.driverId,
      vehicleId: adminExpenseEntryForm.vehicleId
    });
    setNotice('Admin expense entry added.');
  }

  function addAdminMaintenanceEntry() {
    if (!fleet || !selectedVendor) {
      return;
    }

    const odometer = readNumber(adminMaintenanceEntryForm.odometer);
    const estimatedCost = readNumber(adminMaintenanceEntryForm.estimatedCost || '0');

    if (!adminMaintenanceEntryForm.driverId || !adminMaintenanceEntryForm.vehicleId) {
      setNotice('Select driver and vehicle for maintenance.');
      return;
    }

    if (!Number.isFinite(odometer) || !adminMaintenanceEntryForm.serviceType.trim() || !adminMaintenanceEntryForm.issue.trim()) {
      setNotice('Maintenance odometer, service type, and issue are required.');
      return;
    }

    const request: MaintenanceRequest = {
      id: newId('maint'),
      vendorId: selectedVendor.id,
      driverId: adminMaintenanceEntryForm.driverId,
      vehicleId: adminMaintenanceEntryForm.vehicleId,
      odometer,
      serviceType: adminMaintenanceEntryForm.serviceType.trim(),
      issue: adminMaintenanceEntryForm.issue.trim(),
      estimatedCost: Number.isFinite(estimatedCost) ? estimatedCost : 0,
      shopName: adminMaintenanceEntryForm.shopName.trim(),
      attachments: [],
      status: 'pending',
      submittedAt: new Date().toISOString(),
      decidedBy: 'Vendor Admin',
      syncStatus: 'queued'
    };

    persist({
      ...fleet,
      maintenanceRequests: [request, ...fleet.maintenanceRequests],
      syncQueue: [queueItem('maintenance_request', 'create', request), ...fleet.syncQueue]
    });

    setAdminMaintenanceEntryForm({
      ...emptyAdminMaintenanceEntryForm,
      serviceType: selectedVendor.maintenanceTypes[0] || '',
      driverId: adminMaintenanceEntryForm.driverId,
      vehicleId: adminMaintenanceEntryForm.vehicleId
    });
    setNotice('Admin maintenance entry added.');
  }

  function addAdminSalaryEntry() {
    if (!fleet || !selectedVendor) {
      return;
    }

    const amount = readNumber(adminSalaryEntryForm.amount);
    if (!adminSalaryEntryForm.driverId) {
      setNotice('Select driver for salary payment.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0 || !adminSalaryEntryForm.paymentDate.trim()) {
      setNotice('Salary amount and payment date are required.');
      return;
    }

    const payment: SalaryPayment = {
      id: newId('salary'),
      vendorId: selectedVendor.id,
      driverId: adminSalaryEntryForm.driverId,
      vehicleId: adminSalaryEntryForm.vehicleId || undefined,
      amount,
      paymentDate: adminSalaryEntryForm.paymentDate.trim(),
      paymentMode: adminSalaryEntryForm.paymentMode,
      note: adminSalaryEntryForm.note.trim() || undefined,
      createdAt: new Date().toISOString(),
      syncStatus: 'queued'
    };

    persist({
      ...fleet,
      salaryPayments: [payment, ...fleet.salaryPayments],
      syncQueue: [queueItem('salary_payment', 'create', payment), ...fleet.syncQueue]
    });

    setAdminSalaryEntryForm({
      ...emptyAdminSalaryEntryForm,
      driverId: adminSalaryEntryForm.driverId,
      vehicleId: adminSalaryEntryForm.vehicleId,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: adminSalaryEntryForm.paymentMode
    });
    setNotice('Driver salary payment recorded.');
  }

  function decideExpense(claimId: string, status: ApprovalStatus) {
    if (!fleet || status === 'pending') {
      return;
    }

    const claims = fleet.expenseClaims.map((claim) =>
      claim.id === claimId
        ? {
            ...claim,
            status,
            decidedAt: new Date().toISOString(),
            decidedBy: 'Vendor Admin',
            adminNote: status === 'approved' ? 'Approved by vendor admin.' : 'Rejected. Driver should correct proof/details.',
            syncStatus: 'queued' as const
          }
        : claim
    );
    const updated = claims.find((claim) => claim.id === claimId);

    if (!updated) {
      return;
    }

    persist({
      ...fleet,
      expenseClaims: claims,
      syncQueue: [queueItem('expense_claim', 'update', updated), ...fleet.syncQueue]
    });
    setNotice(`Expense ${status}.`);
  }

  function decideMaintenance(requestId: string, status: ApprovalStatus) {
    if (!fleet || status === 'pending') {
      return;
    }

    const requests = fleet.maintenanceRequests.map((request) =>
      request.id === requestId
        ? {
            ...request,
            status,
            decidedAt: new Date().toISOString(),
            decidedBy: 'Vendor Admin',
            adminNote: status === 'approved' ? 'Maintenance approved.' : 'Maintenance rejected. More detail needed.',
            syncStatus: 'queued' as const
          }
        : request
    );
    const updated = requests.find((request) => request.id === requestId);

    if (!updated) {
      return;
    }

    persist({
      ...fleet,
      maintenanceRequests: requests,
      syncQueue: [queueItem('maintenance_request', 'update', updated), ...fleet.syncQueue]
    });
    setNotice(`Maintenance request ${status}.`);
  }

  async function addExpenseAttachments() {
    try {
      const attachments = await pickAttachments();
      if (attachments.length > 0) {
        setExpenseForm((current) => ({ ...current, attachments: [...current.attachments, ...attachments] }));
        setNotice(`${attachments.length} receipt/challan file attached.`);
      }
    } catch {
      setNotice('Could not attach file. Try a receipt image or PDF.');
    }
  }

  async function addMaintenanceAttachments() {
    try {
      const attachments = await pickAttachments();
      if (attachments.length > 0) {
        setMaintenanceForm((current) => ({ ...current, attachments: [...current.attachments, ...attachments] }));
        setNotice(`${attachments.length} maintenance file attached.`);
      }
    } catch {
      setNotice('Could not attach file. Try a quote, invoice, receipt image, or PDF.');
    }
  }

  async function attachDriverPhoto() {
    try {
      const attachment = await pickSingleAttachment();
      if (attachment) {
        setDriverForm((current) => ({ ...current, photo: attachment }));
        setNotice('Driver photo attached.');
      }
    } catch {
      setNotice('Could not attach driver photo. Try an image or PDF.');
    }
  }

  async function attachDriverAgreement() {
    try {
      const attachment = await pickSingleAttachment();
      if (attachment) {
        setDriverForm((current) => ({ ...current, agreement: attachment }));
        setNotice('Driver agreement attached.');
      }
    } catch {
      setNotice('Could not attach agreement. Try an image or PDF.');
    }
  }

  async function attachDriverLicense() {
    try {
      const attachment = await pickSingleAttachment();
      if (attachment) {
        setDriverForm((current) => ({ ...current, licenseDocument: attachment }));
        setNotice('Driving license attached.');
      }
    } catch {
      setNotice('Could not attach license. Try an image or PDF.');
    }
  }

  async function attachVehiclePhoto() {
    try {
      const attachment = await pickSingleAttachment();
      if (attachment) {
        setVehicleForm((current) => ({ ...current, photo: attachment }));
        setNotice('Vehicle photo attached.');
      }
    } catch {
      setNotice('Could not attach vehicle photo. Try an image or PDF.');
    }
  }

  async function handleSync() {
    if (!fleet) {
      return;
    }

    await runSync(fleet);
  }

  function changeAdminPassword() {
    if (!fleet || !selectedVendor) return;

    if (!selectedVendor.adminPasswordHash) {
      setChangePasswordError('This vendor does not have a password set.');
      return;
    }

    if (!changeOldPassword) {
      setChangePasswordError('Enter your current password.');
      return;
    }

    if (hashPassword(changeOldPassword) !== selectedVendor.adminPasswordHash) {
      setChangePasswordError('Current password is incorrect.');
      return;
    }

    if (!changeNewPassword || changeNewPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }

    if (changeNewPassword !== changeConfirmPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }

    const updated: Vendor = { ...selectedVendor, adminPasswordHash: hashPassword(changeNewPassword) };
    persist({
      ...fleet,
      vendors: fleet.vendors.map((v) => (v.id === selectedVendor.id ? updated : v)),
      syncQueue: [queueItem('vendor', 'update', updated), ...fleet.syncQueue]
    });

    setShowChangePassword(false);
    setChangeOldPassword('');
    setChangeNewPassword('');
    setChangeConfirmPassword('');
    setChangePasswordError('');
    setNotice('Admin password updated.');
  }

  function handleReset() {
    Alert.alert('Reset demo data?', 'This clears local demo entries on this device only.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetFleetState().then((next) => {
            const firstVendorId = next.vendors[0]?.id || '';
            setFleet(next);
            setSelectedVendorId(firstVendorId);
            setSelectedDriverId(next.drivers.find((driver) => driver.vendorId === firstVendorId)?.id || '');
            setNotice('Demo multi-vendor data has been reset.');
          });
        }
      }
    ]);
  }

  if (!fleet) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" />
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={styles.loadingText}>Loading multi-vendor workspace...</Text>
      </SafeAreaView>
    );
  }

  if (showLanding) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <StatusBar style="light" />
        <View style={styles.landingCard}>
          <View style={styles.landingMark}>
            <Text style={styles.landingMarkText}>FC</Text>
          </View>
          <Text style={styles.landingKicker}>One app · many vendors</Text>
          <Text style={styles.landingTitle}>FleetCommand</Text>
          <Text style={styles.landingSubtitle}>Choose a portal to continue.</Text>

          <View style={styles.landingButtons}>
            <ActionButton
              label="Platform"
              tone="blue"
              icon={<ShieldCheck color="#ffffff" size={18} />}
              onPress={() => {
                setRole('platform');
                setShowLanding(false);
              }}
            />
            <ActionButton
              label="Admin"
              tone="amber"
              icon={<Users color="#ffffff" size={18} />}
              onPress={() => {
                setRole('admin');
                setShowLanding(false);
              }}
            />
            <ActionButton
              label="Driver"
              tone="green"
              icon={<Truck color="#ffffff" size={18} />}
              onPress={() => {
                setRole('driver');
                setShowLanding(false);
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Header
            fleet={fleet}
            role={role}
            selectedVendor={selectedVendor}
            notice={notice}
            syncing={syncing}
            loggedInRole={loggedInRole}
            onRoleChange={setRole}
            onSync={handleSync}
          />

          <View style={styles.body}>
            {/* Vendor selector and vendor list are shown inside Platform/Admin workspaces after login. */}

            {role === 'admin' && isPortalActive && selectedVendor ? (
              <PortalSummary role={role} vendor={selectedVendor} selectedDriver={selectedDriver} />
            ) : null}

            {role === 'platform' ? (
              loggedInRole === 'platform' ? (
                <PlatformWorkspace
                  fleet={fleet}
                  selectedVendor={selectedVendor}
                  selectedVendorId={selectedVendorId}
                  newVendorForm={newVendorForm}
                  vendorSettingsForm={vendorSettingsForm}
                  onNewVendorFormChange={setNewVendorForm}
                  onVendorSettingsFormChange={setVendorSettingsForm}
                  onSelectVendor={setSelectedVendorId}
                  onAddVendor={addVendor}
                  onSaveVendorSettings={saveVendorSettings}
                  onReset={handleReset}
                />
              ) : (
                <View style={styles.panel}>
                  <LoginCard
                    role="platform"
                    loginPhone={loginPhone}
                    loginPassword={loginPassword}
                    onChangePassword={setLoginPassword}
                    onChangePhone={setLoginPhone}
                    onSubmit={handleLogin}
                    loginError={loginError}
                  />
                </View>
              )
            ) : null}

            {role === 'admin' ? (
              requiresLogin ? (
                <LoginCard
                  role="admin"
                  loginPhone={loginPhone}
                  loginPassword={loginPassword}
                  onChangePassword={setLoginPassword}
                  onChangePhone={setLoginPhone}
                  onSubmit={handleLogin}
                  loginError={loginError}
                />
              ) : selectedVendor ? (
                <AdminWorkspace
                  fleet={fleet}
                  vendor={selectedVendor}
                  vehicleForm={vehicleForm}
                  driverForm={driverForm}
                  onVehicleFormChange={setVehicleForm}
                  onDriverFormChange={setDriverForm}
                  onAddVehicle={addVehicle}
                  onAddDriver={addDriver}
                  onAttachDriverPhoto={attachDriverPhoto}
                  onAttachDriverAgreement={attachDriverAgreement}
                  onAttachDriverLicense={attachDriverLicense}
                  onAttachVehiclePhoto={attachVehiclePhoto}
                  adminExpenseEntryForm={adminExpenseEntryForm}
                  adminMaintenanceEntryForm={adminMaintenanceEntryForm}
                  adminSalaryEntryForm={adminSalaryEntryForm}
                  onAdminExpenseEntryFormChange={setAdminExpenseEntryForm}
                  onAdminMaintenanceEntryFormChange={setAdminMaintenanceEntryForm}
                  onAdminSalaryEntryFormChange={setAdminSalaryEntryForm}
                  onAddAdminExpenseEntry={addAdminExpenseEntry}
                  onAddAdminMaintenanceEntry={addAdminMaintenanceEntry}
                  onAddAdminSalaryEntry={addAdminSalaryEntry}
                  onDecideExpense={decideExpense}
                  onDecideMaintenance={decideMaintenance}
                    loggedInPhone={loggedInPhone}
                    onLogout={handleLogout}
                    showChangePassword={showChangePassword}
                    onToggleChangePassword={() => setShowChangePassword((s) => !s)}
                    changeOldPassword={changeOldPassword}
                    onChangeOldPassword={setChangeOldPassword}
                    changeNewPassword={changeNewPassword}
                    onChangeNewPassword={setChangeNewPassword}
                    changeConfirmPassword={changeConfirmPassword}
                    onChangeConfirmPassword={setChangeConfirmPassword}
                    changePasswordError={changePasswordError}
                    onSubmitChangePassword={changeAdminPassword}
                  activePage={adminPage}
                  onPageChange={setAdminPage}
                />
              ) : null
            ) : null}

            {role === 'driver' ? (
              requiresLogin ? (
                <LoginCard
                  role="driver"
                  loginPhone={loginPhone}
                  onChangePhone={setLoginPhone}
                  onSubmit={handleLogin}
                  loginError={loginError}
                  language={language}
                  onChangeLanguage={setLanguage}
                />
              ) : selectedVendor ? (
                <DriverWorkspace
                  fleet={fleet}
                  vendor={selectedVendor}
                  selectedDriver={selectedDriver}
                  selectedDriverId={selectedDriverId}
                  selectedVehicle={selectedVehicle}
                  tripForm={tripForm}
                  expenseForm={expenseForm}
                  maintenanceForm={maintenanceForm}
                  onSelectDriver={setSelectedDriverId}
                  onTripFormChange={setTripForm}
                  onExpenseFormChange={setExpenseForm}
                  onMaintenanceFormChange={setMaintenanceForm}
                  onAddTrip={addTripLog}
                  onAddExpense={addExpenseClaim}
                  onAddMaintenance={addMaintenanceRequest}
                  onAttachExpense={addExpenseAttachments}
                  onAttachMaintenance={addMaintenanceAttachments}
                  loggedInPhone={loggedInPhone}
                  onLogout={handleLogout}
                  activePage={driverPage}
                  onPageChange={setDriverPage}
                  language={language}
                />
              ) : null
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({
  fleet,
  role,
  selectedVendor,
  notice,
  syncing,
  loggedInRole,
  onRoleChange,
  onSync
}: {
  fleet: FleetState;
  role: AppRole;
  selectedVendor?: Vendor;
  notice: string;
  syncing: boolean;
  loggedInRole: AppRole | null;
  onRoleChange: (role: AppRole) => void;
  onSync: () => void;
}) {
  const { width } = useWindowDimensions();
  const compactHeader = width < 760;
  const headerGradient: readonly [string, string, ...string[]] = role === 'admin'
    ? ['#4338ca', '#6d28d9', '#7c3aed']
    : role === 'driver'
      ? ['#4f46e5', '#6366f1', '#0ea5e9']
      : ['#4f46e5', '#6d28d9', '#9333ea'];
  const hasRoleSession = loggedInRole === role;
  const showVendorInfo = (role === 'admin' || role === 'driver') && hasRoleSession && Boolean(selectedVendor);
  const vendorMark = selectedVendor?.companyName
    ? selectedVendor.companyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() || '')
      .join('')
    : 'FC';
  const titleText = role === 'platform'
    ? 'FleetCommand'
    : role === 'admin'
      ? selectedVendor?.companyName || 'Vendor Admin'
      : selectedVendor?.companyName || 'Driver Portal';
  const subtitleText = role === 'platform'
    ? hasRoleSession ? 'Platform owner workspace' : 'Platform sign in required'
    : role === 'admin'
      ? hasRoleSession ? 'Vendor admin portal' : 'Admin sign in required'
      : hasRoleSession ? 'Driver workspace' : 'Driver sign in required';

  return (
    <LinearGradient
      colors={headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={[styles.brandRow, compactHeader && styles.brandRowCompact]}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>{showVendorInfo ? vendorMark : 'FC'}</Text>
        </View>
        <View style={[styles.brandCopy, compactHeader && styles.brandCopyCompact]}>
          <Text style={styles.eyebrow}>One app · many vendors</Text>
          <Text style={[styles.title, compactHeader && styles.titleCompact]} numberOfLines={2}>{titleText}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>
        </View>
        <View style={[styles.syncBadge, compactHeader && styles.syncBadgeCompact]}>
          <Clock color="#dbeafe" size={16} />
          <Text style={styles.syncBadgeText}>{fleet.syncQueue.length} queued</Text>
        </View>
      </View>

      {role === 'platform' && hasRoleSession ? (
        <View style={[styles.metricsRow, compactHeader && styles.metricsRowCompact]}>
          <Metric label="Vendors" value={String(fleet.vendors.length)} compact={compactHeader} />
          <Metric label="Trip money" value={money(totalTripMoney(fleet))} compact={compactHeader} />
          <Metric label="Pending" value={money(totalExpenses(fleet, undefined, 'pending'))} compact={compactHeader} />
        </View>
      ) : null}

      {role === 'admin' && showVendorInfo && selectedVendor ? (
        <View style={[styles.metricsRow, compactHeader && styles.metricsRowCompact]}>
          <Metric label="Drivers" value={String(vendorDrivers(fleet, selectedVendor.id).length)} compact={compactHeader} />
          <Metric label="Trip money" value={money(totalTripMoney(fleet, selectedVendor.id))} compact={compactHeader} />
          <Metric label="Pending" value={money(totalExpenses(fleet, selectedVendor.id, 'pending'))} compact={compactHeader} />
        </View>
      ) : null}

      {role === 'admin' ? (
        <View style={styles.modeRow}>
          <SegmentButton
            active={role === 'admin'}
            icon={<Users color={role === 'admin' ? '#0f172a' : '#cbd5e1'} size={16} />}
            label="Admin"
            onPress={() => onRoleChange('admin')}
          />
          <SegmentButton
            active={false}
            icon={<Truck color="#cbd5e1" size={16} />}
            label="Driver"
            onPress={() => onRoleChange('driver')}
          />
        </View>
      ) : null}

      <View style={styles.noticeRow}>
        <AlertTriangle color="#fde68a" size={18} />
        <Text style={styles.noticeText}>{notice}</Text>
      </View>

      <Pressable style={styles.syncButton} onPress={onSync}>
        {syncing ? <RefreshCw color="#ffffff" size={18} /> : <Send color="#ffffff" size={18} />}
        <Text style={styles.syncButtonText}>{syncing ? 'Syncing...' : 'Sync live updates'}</Text>
      </Pressable>
    </LinearGradient>
  );
}

function VendorSelector({
  vendors,
  selectedVendorId,
  onSelect
}: {
  vendors: Vendor[];
  selectedVendorId: string;
  onSelect: (vendorId: string) => void;
}) {
  return (
    <View style={styles.panel}>
      <SectionTitle icon={<Users color="#2563eb" size={20} />} title="Vendor account" />
      <View style={styles.optionRow}>
        {vendors.map((vendor) => {
          const active = vendor.id === selectedVendorId;
          return (
            <Pressable
              key={vendor.id}
              style={[styles.vendorChip, active && { borderColor: vendor.primaryColor, backgroundColor: '#ecfdf5' }]}
              onPress={() => onSelect(vendor.id)}
            >
              <View style={[styles.vendorLogo, { backgroundColor: vendor.primaryColor }]}>
                <Text style={styles.vendorLogoText}>{vendor.logoText}</Text>
              </View>
              <View style={styles.vendorChipText}>
                <Text style={styles.vendorChipName}>{vendor.companyName}</Text>
                <Text style={styles.mutedText}>{vendor.subscriptionPlan} · {vendor.status}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PortalSummary({
  role,
  vendor,
  selectedDriver
}: {
  role: 'admin' | 'driver';
  vendor: Vendor;
  selectedDriver?: Driver;
}) {
  return (
    <View style={styles.portalSummary}>
      <View style={styles.portalSummaryHeader}>
        <Text style={styles.portalSummaryTitle}>{role === 'admin' ? 'Vendor admin access' : 'Driver portal access'}</Text>
        <View style={[styles.portalSummaryBadge, role === 'admin' ? styles.portalBadgeAdmin : styles.portalBadgeDriver]}>
          <Text style={styles.portalSummaryBadgeText}>{role === 'admin' ? 'Admin' : 'Driver'}</Text>
        </View>
      </View>
      <Text style={styles.portalSummaryText}>{vendor.companyName} · {vendor.subscriptionPlan} · {vendor.status}</Text>
      {role === 'driver' && selectedDriver ? (
        <Text style={styles.portalSummaryText}>{selectedDriver.name} · {selectedDriver.phone}</Text>
      ) : null}
    </View>
  );
}

function PlatformWorkspace({
  fleet,
  selectedVendor,
  selectedVendorId,
  newVendorForm,
  vendorSettingsForm,
  onNewVendorFormChange,
  onVendorSettingsFormChange,
  onSelectVendor,
  onAddVendor,
  onSaveVendorSettings,
  onReset
}: {
  fleet: FleetState;
  selectedVendor?: Vendor;
  selectedVendorId: string;
  newVendorForm: VendorForm;
  vendorSettingsForm: VendorForm;
  onNewVendorFormChange: (form: VendorForm) => void;
  onVendorSettingsFormChange: (form: VendorForm) => void;
  onSelectVendor: (vendorId: string) => void;
  onAddVendor: () => void;
  onSaveVendorSettings: () => void;
  onReset: () => void;
}) {
  const [activePanel, setActivePanel] = useState<'add' | 'customize' | null>(null);

  return (
    <>
      <SectionTitle
        icon={<ShieldCheck color="#2563eb" size={20} />}
        title="Vendor management"
      />

      <View style={styles.tabRow}>
        <PortalTabButton
          label="Add vendor"
          active={activePanel === 'add'}
          brandColor="#2563eb"
          onPress={() => setActivePanel('add')}
        />
        <PortalTabButton
          label="Customize vendor"
          active={activePanel === 'customize'}
          brandColor="#2563eb"
          onPress={() => setActivePanel('customize')}
        />
      </View>

      <View style={styles.panel}>
        <SectionTitle icon={<Users color="#2563eb" size={20} />} title="Select vendor" />
        <Dropdown
          label="Vendor"
          options={fleet.vendors.map((vendor) => vendor.id)}
          value={selectedVendorId}
          placeholder="Select vendor"
          getLabel={(id) => fleet.vendors.find((vendor) => vendor.id === id)?.companyName || id}
          onChange={(vendorId) => {
            onSelectVendor(vendorId);
            setActivePanel('customize');
          }}
        />
      </View>

      {activePanel === null ? (
        <View style={styles.panel}>
          <EmptyState text="Choose Add vendor or Customize vendor to open a form." />
        </View>
      ) : null}

      {activePanel === 'add' ? (
        <View style={styles.panel}>
          <SectionTitle icon={<Plus color="#2563eb" size={20} />} title="Add vendor" />
          <VendorFormFields form={newVendorForm} onChange={onNewVendorFormChange} />
          <Field label="Admin password" value={newVendorForm.adminPassword || ''} placeholder="Strong temporary password" autoCapitalize="none" onChangeText={(adminPassword) => onNewVendorFormChange({ ...newVendorForm, adminPassword })} />
          <ActionButton label="Create vendor" tone="green" icon={<Plus color="#ffffff" size={18} />} onPress={onAddVendor} />
        </View>
      ) : null}

      {activePanel === 'customize' && selectedVendor ? (
        <View style={styles.panel}>
          <SectionTitle icon={<Wrench color="#d97706" size={20} />} title="Customize selected vendor" />
          <VendorFormFields form={vendorSettingsForm} onChange={onVendorSettingsFormChange} />
          <ToggleRow
            label="Receipt/challan proof required"
            value={vendorSettingsForm.requireReceiptProof}
            onChange={(requireReceiptProof) => onVendorSettingsFormChange({ ...vendorSettingsForm, requireReceiptProof })}
          />
          <ActionButton label="Save vendor customization" tone="blue" icon={<CheckCircle2 color="#ffffff" size={18} />} onPress={onSaveVendorSettings} />
        </View>
      ) : null}

      {activePanel === 'customize' && !selectedVendor ? (
        <View style={styles.panel}>
          <EmptyState text="Select a vendor from dropdown or vendor list to open customization form." />
        </View>
      ) : null}

      <View style={styles.panel}>
        <SectionTitle icon={<Users color="#2563eb" size={20} />} title="Vendor list" />
        {fleet.vendors.map((vendor) => (
          <VendorCard key={vendor.id} fleet={fleet} vendor={vendor} />
        ))}
      </View>
    </>
  );
}

function VendorFormFields({
  form,
  onChange
}: {
  form: VendorForm;
  onChange: (form: VendorForm) => void;
}) {
  return (
    <>
      <Field label="Company name" value={form.companyName} placeholder="Vendor trucking company" onChangeText={(companyName) => onChange({ ...form, companyName })} />
      <View style={styles.twoColumn}>
        <Field label="Owner name" value={form.ownerName} placeholder="Owner/admin" onChangeText={(ownerName) => onChange({ ...form, ownerName })} />
        <Field label="Logo text" value={form.logoText} placeholder="NS" autoCapitalize="characters" onChangeText={(logoText) => onChange({ ...form, logoText })} />
      </View>
      <View style={styles.twoColumn}>
        <Field label="Phone" value={form.phone} placeholder="+1..." keyboardType="phone-pad" onChangeText={(phone) => onChange({ ...form, phone })} />
        <Field label="Email" value={form.email} placeholder="admin@company.com" keyboardType="email-address" autoCapitalize="none" onChangeText={(email) => onChange({ ...form, email })} />
      </View>
      <View style={styles.twoColumn}>
        <Field label="Primary color" value={form.primaryColor} placeholder="#2563eb" autoCapitalize="none" onChangeText={(primaryColor) => onChange({ ...form, primaryColor })} />
        <Field label="Accent color" value={form.accentColor} placeholder="#2563eb" autoCapitalize="none" onChangeText={(accentColor) => onChange({ ...form, accentColor })} />
      </View>
      <View style={styles.twoColumn}>
        <Field label="Plan" value={form.subscriptionPlan} placeholder="Enterprise" onChangeText={(subscriptionPlan) => onChange({ ...form, subscriptionPlan })} />
        <Field label="Approval limit" value={form.approvalLimit} placeholder="500" keyboardType="decimal-pad" onChangeText={(approvalLimit) => onChange({ ...form, approvalLimit })} />
      </View>
      <Field label="Expense categories" value={form.expenseCategories} placeholder={defaultCategories} multiline onChangeText={(expenseCategories) => onChange({ ...form, expenseCategories })} />
      <Field label="Maintenance types" value={form.maintenanceTypes} placeholder={defaultMaintenance} multiline onChangeText={(maintenanceTypes) => onChange({ ...form, maintenanceTypes })} />
    </>
  );
}

function AdminWorkspace({
  fleet,
  vendor,
  vehicleForm,
  driverForm,
  onVehicleFormChange,
  onDriverFormChange,
  onAddVehicle,
  onAddDriver,
  onAttachDriverPhoto,
  onAttachDriverAgreement,
  onAttachDriverLicense,
  onAttachVehiclePhoto,
  adminExpenseEntryForm,
  adminMaintenanceEntryForm,
  adminSalaryEntryForm,
  onAdminExpenseEntryFormChange,
  onAdminMaintenanceEntryFormChange,
  onAdminSalaryEntryFormChange,
  onAddAdminExpenseEntry,
  onAddAdminMaintenanceEntry,
  onAddAdminSalaryEntry,
  onDecideExpense,
  onDecideMaintenance,
  activePage,
  onPageChange,
  loggedInPhone,
  onLogout,
  showChangePassword,
  onToggleChangePassword,
  changeOldPassword,
  onChangeOldPassword,
  changeNewPassword,
  onChangeNewPassword,
  changeConfirmPassword,
  onChangeConfirmPassword,
  changePasswordError,
  onSubmitChangePassword
}: {
  fleet: FleetState;
  vendor: Vendor;
  vehicleForm: VehicleForm;
  driverForm: DriverForm;
  onVehicleFormChange: (form: VehicleForm) => void;
  onDriverFormChange: (form: DriverForm) => void;
  onAddVehicle: () => void;
  onAddDriver: () => void;
  onAttachDriverPhoto: () => void;
  onAttachDriverAgreement: () => void;
  onAttachDriverLicense: () => void;
  onAttachVehiclePhoto: () => void;
  adminExpenseEntryForm: AdminExpenseEntryForm;
  adminMaintenanceEntryForm: AdminMaintenanceEntryForm;
  adminSalaryEntryForm: AdminSalaryEntryForm;
  onAdminExpenseEntryFormChange: (form: AdminExpenseEntryForm) => void;
  onAdminMaintenanceEntryFormChange: (form: AdminMaintenanceEntryForm) => void;
  onAdminSalaryEntryFormChange: (form: AdminSalaryEntryForm) => void;
  onAddAdminExpenseEntry: () => void;
  onAddAdminMaintenanceEntry: () => void;
  onAddAdminSalaryEntry: () => void;
  onDecideExpense: (claimId: string, status: ApprovalStatus) => void;
  onDecideMaintenance: (requestId: string, status: ApprovalStatus) => void;
  activePage: AdminPortalPage | null;
  onPageChange: (page: AdminPortalPage | null) => void;
  loggedInPhone: string;
  onLogout: () => void;
  showChangePassword: boolean;
  onToggleChangePassword: () => void;
  changeOldPassword: string;
  onChangeOldPassword: (v: string) => void;
  changeNewPassword: string;
  onChangeNewPassword: (v: string) => void;
  changeConfirmPassword: string;
  onChangeConfirmPassword: (v: string) => void;
  changePasswordError: string;
  onSubmitChangePassword: () => void;
}) {
  const insights = buildVendorInsights(fleet, vendor);
  const vehicles = vendorVehicles(fleet, vendor.id);
  const drivers = vendorDrivers(fleet, vendor.id);
  const trips = vendorTrips(fleet, vendor.id);
  const claims = vendorExpenses(fleet, vendor.id);
  const maintenance = vendorMaintenance(fleet, vendor.id);
  const salaryPayments = fleet.salaryPayments.filter((payment) => payment.vendorId === vendor.id);
  const [salaryFilterDriverId, setSalaryFilterDriverId] = useState('');
  const [salaryFilterFromDate, setSalaryFilterFromDate] = useState('');
  const [salaryFilterToDate, setSalaryFilterToDate] = useState('');
  const [expenseViewDriverId, setExpenseViewDriverId] = useState('');
  const [expenseViewVehicleId, setExpenseViewVehicleId] = useState('');
  const [driverDetailType, setDriverDetailType] = useState<ExpenseLookupDetail | null>(null);
  const [vehicleDetailType, setVehicleDetailType] = useState<ExpenseLookupDetail | null>(null);
  const [openDriverId, setOpenDriverId] = useState('');
  const [openVehicleId, setOpenVehicleId] = useState('');

  const filteredSalaryPayments = useMemo(
    () =>
      salaryPayments.filter((payment) => {
        if (salaryFilterDriverId && payment.driverId !== salaryFilterDriverId) {
          return false;
        }
        if (salaryFilterFromDate && payment.paymentDate < salaryFilterFromDate) {
          return false;
        }
        if (salaryFilterToDate && payment.paymentDate > salaryFilterToDate) {
          return false;
        }
        return true;
      }),
    [salaryPayments, salaryFilterDriverId, salaryFilterFromDate, salaryFilterToDate]
  );

  const selectedExpenseDriver = drivers.find((driver) => driver.id === expenseViewDriverId);
  const selectedExpenseVehicle = vehicles.find((vehicle) => vehicle.id === expenseViewVehicleId);

  const selectedDriverExpense = selectedExpenseDriver
    ? {
        claim: fleet.expenseClaims
          .filter((claim) => claim.vendorId === vendor.id && claim.driverId === selectedExpenseDriver.id)
          .reduce((sum, claim) => sum + claim.amount, 0),
        maintenance: fleet.maintenanceRequests
          .filter((request) => request.vendorId === vendor.id && request.driverId === selectedExpenseDriver.id)
          .reduce((sum, request) => sum + request.estimatedCost, 0),
        salary: fleet.salaryPayments
          .filter((payment) => payment.vendorId === vendor.id && payment.driverId === selectedExpenseDriver.id)
          .reduce((sum, payment) => sum + payment.amount, 0)
      }
    : null;

  const selectedVehicleExpense = selectedExpenseVehicle
    ? {
        claim: fleet.expenseClaims
          .filter((claim) => claim.vendorId === vendor.id && claim.vehicleId === selectedExpenseVehicle.id)
          .reduce((sum, claim) => sum + claim.amount, 0),
        maintenance: fleet.maintenanceRequests
          .filter((request) => request.vendorId === vendor.id && request.vehicleId === selectedExpenseVehicle.id)
          .reduce((sum, request) => sum + request.estimatedCost, 0),
        salary: fleet.salaryPayments
          .filter((payment) => payment.vendorId === vendor.id && payment.vehicleId === selectedExpenseVehicle.id)
          .reduce((sum, payment) => sum + payment.amount, 0)
      }
    : null;

  const selectedDriverClaims = selectedExpenseDriver
    ? fleet.expenseClaims.filter((claim) => claim.vendorId === vendor.id && claim.driverId === selectedExpenseDriver.id)
    : [];
  const selectedDriverMaintenance = selectedExpenseDriver
    ? fleet.maintenanceRequests.filter((request) => request.vendorId === vendor.id && request.driverId === selectedExpenseDriver.id)
    : [];
  const selectedDriverSalary = selectedExpenseDriver
    ? fleet.salaryPayments.filter((payment) => payment.vendorId === vendor.id && payment.driverId === selectedExpenseDriver.id)
    : [];

  const selectedVehicleClaims = selectedExpenseVehicle
    ? fleet.expenseClaims.filter((claim) => claim.vendorId === vendor.id && claim.vehicleId === selectedExpenseVehicle.id)
    : [];
  const selectedVehicleMaintenance = selectedExpenseVehicle
    ? fleet.maintenanceRequests.filter((request) => request.vendorId === vendor.id && request.vehicleId === selectedExpenseVehicle.id)
    : [];
  const selectedVehicleSalary = selectedExpenseVehicle
    ? fleet.salaryPayments.filter((payment) => payment.vendorId === vendor.id && payment.vehicleId === selectedExpenseVehicle.id)
    : [];

  function handleDriverSelectionChange(driverId: string) {
    setExpenseViewDriverId(driverId);
    setDriverDetailType(driverId ? 'claims' : null);
  }

  function handleVehicleSelectionChange(vehicleId: string) {
    setExpenseViewVehicleId(vehicleId);
    setVehicleDetailType(vehicleId ? 'claims' : null);
  }

  function exportSalaryHistoryCsv() {
    if (filteredSalaryPayments.length === 0) {
      Alert.alert('No records', 'No salary payments match the current filters.');
      return;
    }

    const header = ['payment_date', 'driver_name', 'vehicle_unit', 'amount', 'payment_mode', 'note', 'sync_status'];
    const rows = filteredSalaryPayments.map((payment) => {
      const driver = drivers.find((item) => item.id === payment.driverId);
      const vehicle = vehicles.find((item) => item.id === payment.vehicleId);
      return [
        csvCell(payment.paymentDate),
        csvCell(driver?.name || ''),
        csvCell(vehicle?.unitNumber || ''),
        csvCell(payment.amount),
        csvCell(payment.paymentMode),
        csvCell(payment.note || ''),
        csvCell(payment.syncStatus)
      ].join(',');
    });

    const csvText = [header.join(','), ...rows].join('\n');
    const canDownload = typeof document !== 'undefined';

    if (canDownload) {
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      const vendorSlug = vendor.companyName.replace(/\s+/g, '-').toLowerCase();
      anchor.href = url;
      anchor.download = `salary-history-${vendorSlug}-${stamp}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      Alert.alert('Export complete', 'Salary CSV has been downloaded.');
      return;
    }

    Alert.alert('CSV preview', csvText.slice(0, 3500));
  }

  const driverFinancials = drivers
    .map((driver) => {
      const tripIncome = fleet.tripLogs
        .filter((trip) => trip.vendorId === vendor.id && trip.driverId === driver.id)
        .reduce((sum, trip) => sum + trip.tripMoney, 0);
      const claimExpense = fleet.expenseClaims
        .filter((claim) => claim.vendorId === vendor.id && claim.driverId === driver.id)
        .reduce((sum, claim) => sum + claim.amount, 0);
      const maintenanceExpense = fleet.maintenanceRequests
        .filter((request) => request.vendorId === vendor.id && request.driverId === driver.id)
        .reduce((sum, request) => sum + request.estimatedCost, 0);
      const salaryExpense = fleet.salaryPayments
        .filter((payment) => payment.vendorId === vendor.id && payment.driverId === driver.id)
        .reduce((sum, payment) => sum + payment.amount, 0);
      const grossExpense = claimExpense + maintenanceExpense + salaryExpense;

      return {
        driver,
        tripIncome,
        grossExpense,
        net: tripIncome - grossExpense
      };
    })
    .sort((a, b) => b.tripIncome - a.tripIncome);

  const vehicleFinancials = vehicles
    .map((vehicle) => {
      const tripIncome = fleet.tripLogs
        .filter((trip) => trip.vendorId === vendor.id && trip.vehicleId === vehicle.id)
        .reduce((sum, trip) => sum + trip.tripMoney, 0);
      const claimExpense = fleet.expenseClaims
        .filter((claim) => claim.vendorId === vendor.id && claim.vehicleId === vehicle.id)
        .reduce((sum, claim) => sum + claim.amount, 0);
      const maintenanceExpense = fleet.maintenanceRequests
        .filter((request) => request.vendorId === vendor.id && request.vehicleId === vehicle.id)
        .reduce((sum, request) => sum + request.estimatedCost, 0);
      const salaryExpense = fleet.salaryPayments
        .filter((payment) => payment.vendorId === vendor.id && payment.vehicleId === vehicle.id)
        .reduce((sum, payment) => sum + payment.amount, 0);
      const grossExpense = claimExpense + maintenanceExpense + salaryExpense;

      return {
        vehicle,
        tripIncome,
        grossExpense,
        net: tripIncome - grossExpense
      };
    })
    .sort((a, b) => b.tripIncome - a.tripIncome);

  const showDriverResults = Boolean(expenseViewDriverId);
  const showVehicleResults = Boolean(expenseViewVehicleId);

  const visibleDriverFinancials = showDriverResults
    ? driverFinancials.filter((item) => item.driver.id === expenseViewDriverId)
    : [];

  const visibleVehicleFinancials = showVehicleResults
    ? vehicleFinancials.filter((item) => item.vehicle.id === expenseViewVehicleId)
    : [];

  const pageOptions: { id: AdminPortalPage; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'entries', label: 'Entries' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'roster', label: 'Roster' }
  ];

  return (
    <>
      <View style={styles.workspaceHeader}>
        <SectionTitle icon={<ShieldCheck color={vendor.primaryColor} size={20} />} title={`${vendor.companyName} admin`} />
        <View style={styles.loggedInRow}>
          <Text style={styles.mutedText}>Signed in as {loggedInPhone}</Text>
            <Pressable style={styles.textButton} onPress={onToggleChangePassword}>
              <Text style={styles.textButtonLabel}>Change password</Text>
            </Pressable>
            <Pressable style={styles.textButton} onPress={onLogout}>
              <Text style={styles.textButtonLabel}>Sign out</Text>
            </Pressable>
        </View>

        {showChangePassword ? (
          <View style={styles.panel}>
            <SectionTitle icon={<ShieldCheck color={vendor.primaryColor} size={20} />} title="Change admin password" />
            <Text style={styles.loginHelp}>Enter your current password and choose a new secure password.</Text>
            <Field label="Current password" value={changeOldPassword} placeholder="Current password" secureTextEntry autoCapitalize="none" onChangeText={onChangeOldPassword} />
            <Field label="New password" value={changeNewPassword} placeholder="New password" secureTextEntry autoCapitalize="none" onChangeText={onChangeNewPassword} />
            <Field label="Confirm new password" value={changeConfirmPassword} placeholder="Confirm new password" secureTextEntry autoCapitalize="none" onChangeText={onChangeConfirmPassword} />
            {changePasswordError ? <Text style={styles.errorText}>{changePasswordError}</Text> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 8 }}>
              <ActionButton label="Update password" tone="green" icon={<CheckCircle2 color="#ffffff" size={16} />} onPress={onSubmitChangePassword} />
              <ActionButton label="Cancel" tone="rose" icon={<XCircle color="#ffffff" size={16} />} onPress={onToggleChangePassword} />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.tabRow}>
        {pageOptions.map((option) => (
          <PortalTabButton
            key={option.id}
            label={option.label}
            active={activePage === option.id}
            brandColor={vendor.primaryColor}
            onPress={() => onPageChange(option.id)}
          />
        ))}
      </View>

      {activePage === null ? (
        <View style={styles.panel}>
          <EmptyState text="Select a tab to open admin page content." />
        </View>
      ) : null}

      <View style={styles.adminSummaryRow}>
        <SummaryTile label="Drivers" value={String(drivers.length)} icon={<Users color={vendor.primaryColor} size={20} />} />
        <SummaryTile label="Vehicles" value={String(vehicles.length)} icon={<Truck color={vendor.primaryColor} size={20} />} />
        <SummaryTile label="Pending approvals" value={String(claims.filter((claim) => claim.status === 'pending').length + maintenance.filter((request) => request.status === 'pending').length)} icon={<Clock color={vendor.primaryColor} size={20} />} />
      </View>

      {activePage === 'dashboard' ? (
        <>
          <View style={styles.summaryGrid}>
            <SummaryTile label="Trip money" value={money(totalTripMoney(fleet, vendor.id))} icon={<DollarSign color="#2563eb" size={20} />} />
            <SummaryTile label="Approved expenses" value={money(totalExpenses(fleet, vendor.id, 'approved'))} icon={<CheckCircle2 color="#1d4ed8" size={20} />} />
            <SummaryTile label="Pending claims" value={money(totalExpenses(fleet, vendor.id, 'pending'))} icon={<Clock color="#d97706" size={20} />} />
            <SummaryTile label="Loan balance" value={money(totalLoans(fleet, vendor.id))} icon={<FileText color="#2563eb" size={20} />} />
          </View>

          <View style={styles.panel}>
            <SectionTitle icon={<Receipt color="#2563eb" size={20} />} title="Expense lookup" />
            <Text style={styles.loginHelp}>Select a driver or vehicle to view expense totals.</Text>
            <View style={styles.twoColumn}>
              <Dropdown
                label="Driver"
                options={['', ...drivers.map((driver) => driver.id)]}
                value={expenseViewDriverId}
                placeholder="Select driver"
                getLabel={(id) => (id ? drivers.find((driver) => driver.id === id)?.name || id : 'Select driver')}
                onChange={handleDriverSelectionChange}
              />
              <Dropdown
                label="Vehicle"
                options={['', ...vehicles.map((vehicle) => vehicle.id)]}
                value={expenseViewVehicleId}
                placeholder="Select vehicle"
                getLabel={(id) => (id ? vehicles.find((vehicle) => vehicle.id === id)?.unitNumber || id : 'Select vehicle')}
                onChange={handleVehicleSelectionChange}
              />
            </View>

            {selectedDriverExpense && selectedExpenseDriver ? (
              <View style={styles.rosterRow}>
                <View style={styles.rosterTop}>
                  <Text style={styles.rosterName}>Driver: {selectedExpenseDriver.name}</Text>
                </View>
                <View style={styles.factRow}>
                  <Pressable style={[styles.fact, driverDetailType === 'claims' && styles.factActive]} onPress={() => setDriverDetailType((current) => (current === 'claims' ? null : 'claims'))}>
                    <Receipt color="#64748b" size={15} />
                    <Text style={styles.factText}>Claims {money(selectedDriverExpense.claim)}</Text>
                  </Pressable>
                  <Pressable style={[styles.fact, driverDetailType === 'maintenance' && styles.factActive]} onPress={() => setDriverDetailType((current) => (current === 'maintenance' ? null : 'maintenance'))}>
                    <Wrench color="#64748b" size={15} />
                    <Text style={styles.factText}>Maintenance {money(selectedDriverExpense.maintenance)}</Text>
                  </Pressable>
                  <Pressable style={[styles.fact, driverDetailType === 'salary' && styles.factActive]} onPress={() => setDriverDetailType((current) => (current === 'salary' ? null : 'salary'))}>
                    <DollarSign color="#64748b" size={15} />
                    <Text style={styles.factText}>Salary {money(selectedDriverExpense.salary)}</Text>
                  </Pressable>
                  <Fact icon={<FileText color="#64748b" size={15} />} label={`Total ${money(selectedDriverExpense.claim + selectedDriverExpense.maintenance + selectedDriverExpense.salary)}`} />
                </View>
                {driverDetailType === 'claims' ? (
                  <View style={styles.detailList}>
                    {selectedDriverClaims.length === 0 ? <EmptyState text="No claim records for this driver." /> : null}
                    {selectedDriverClaims.map((claim) => (
                      <RecordRow
                        key={claim.id}
                        icon={<Receipt color="#be123c" size={18} />}
                        title={`${claim.category} · ${money(claim.amount)}`}
                        detail={`${claim.vendorPlace || 'No vendor'} · ${claim.location || 'No location'}`}
                        right={claim.status}
                      />
                    ))}
                  </View>
                ) : null}
                {driverDetailType === 'maintenance' ? (
                  <View style={styles.detailList}>
                    {selectedDriverMaintenance.length === 0 ? <EmptyState text="No maintenance records for this driver." /> : null}
                    {selectedDriverMaintenance.map((request) => (
                      <RecordRow
                        key={request.id}
                        icon={<Wrench color="#d97706" size={18} />}
                        title={`${request.serviceType} · ${money(request.estimatedCost)}`}
                        detail={`${request.shopName || 'No shop'} · ${request.issue || 'No issue text'}`}
                        right={request.status}
                      />
                    ))}
                  </View>
                ) : null}
                {driverDetailType === 'salary' ? (
                  <View style={styles.detailList}>
                    {selectedDriverSalary.length === 0 ? <EmptyState text="No salary payments for this driver." /> : null}
                    {selectedDriverSalary.map((payment) => (
                      <RecordRow
                        key={payment.id}
                        icon={<DollarSign color="#2563eb" size={18} />}
                        title={`${money(payment.amount)} · ${salaryPaymentModeLabels[payment.paymentMode]}`}
                        detail={`Paid on ${payment.paymentDate}${payment.note ? ` · ${payment.note}` : ''}`}
                        right={payment.syncStatus}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {selectedVehicleExpense && selectedExpenseVehicle ? (
              <View style={styles.rosterRow}>
                <View style={styles.rosterTop}>
                  <Text style={styles.rosterName}>Vehicle: {selectedExpenseVehicle.unitNumber}</Text>
                </View>
                <View style={styles.factRow}>
                  <Pressable style={[styles.fact, vehicleDetailType === 'claims' && styles.factActive]} onPress={() => setVehicleDetailType((current) => (current === 'claims' ? null : 'claims'))}>
                    <Receipt color="#64748b" size={15} />
                    <Text style={styles.factText}>Claims {money(selectedVehicleExpense.claim)}</Text>
                  </Pressable>
                  <Pressable style={[styles.fact, vehicleDetailType === 'maintenance' && styles.factActive]} onPress={() => setVehicleDetailType((current) => (current === 'maintenance' ? null : 'maintenance'))}>
                    <Wrench color="#64748b" size={15} />
                    <Text style={styles.factText}>Maintenance {money(selectedVehicleExpense.maintenance)}</Text>
                  </Pressable>
                  <Pressable style={[styles.fact, vehicleDetailType === 'salary' && styles.factActive]} onPress={() => setVehicleDetailType((current) => (current === 'salary' ? null : 'salary'))}>
                    <DollarSign color="#64748b" size={15} />
                    <Text style={styles.factText}>Salary {money(selectedVehicleExpense.salary)}</Text>
                  </Pressable>
                  <Fact icon={<FileText color="#64748b" size={15} />} label={`Total ${money(selectedVehicleExpense.claim + selectedVehicleExpense.maintenance + selectedVehicleExpense.salary)}`} />
                </View>
                {vehicleDetailType === 'claims' ? (
                  <View style={styles.detailList}>
                    {selectedVehicleClaims.length === 0 ? <EmptyState text="No claim records for this vehicle." /> : null}
                    {selectedVehicleClaims.map((claim) => (
                      <RecordRow
                        key={claim.id}
                        icon={<Receipt color="#be123c" size={18} />}
                        title={`${claim.category} · ${money(claim.amount)}`}
                        detail={`${claim.vendorPlace || 'No vendor'} · ${claim.location || 'No location'}`}
                        right={claim.status}
                      />
                    ))}
                  </View>
                ) : null}
                {vehicleDetailType === 'maintenance' ? (
                  <View style={styles.detailList}>
                    {selectedVehicleMaintenance.length === 0 ? <EmptyState text="No maintenance records for this vehicle." /> : null}
                    {selectedVehicleMaintenance.map((request) => (
                      <RecordRow
                        key={request.id}
                        icon={<Wrench color="#d97706" size={18} />}
                        title={`${request.serviceType} · ${money(request.estimatedCost)}`}
                        detail={`${request.shopName || 'No shop'} · ${request.issue || 'No issue text'}`}
                        right={request.status}
                      />
                    ))}
                  </View>
                ) : null}
                {vehicleDetailType === 'salary' ? (
                  <View style={styles.detailList}>
                    {selectedVehicleSalary.length === 0 ? <EmptyState text="No salary payments for this vehicle." /> : null}
                    {selectedVehicleSalary.map((payment) => (
                      <RecordRow
                        key={payment.id}
                        icon={<DollarSign color="#2563eb" size={18} />}
                        title={`${money(payment.amount)} · ${salaryPaymentModeLabels[payment.paymentMode]}`}
                        detail={`Paid on ${payment.paymentDate}${payment.note ? ` · ${payment.note}` : ''}`}
                        right={payment.syncStatus}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {showDriverResults ? (
            <View style={styles.panel}>
              <SectionTitle icon={<Users color="#2563eb" size={20} />} title="Income vs expense by driver" />
              {visibleDriverFinancials.length === 0 ? <EmptyState text="No drivers match the selected filter." /> : null}
              {visibleDriverFinancials.map((item) => {
                const assignedVehicle = getAssignedVehicle(fleet, item.driver);
                return (
                  <View key={item.driver.id} style={styles.rosterRow}>
                    <View style={styles.rosterTop}>
                      <View>
                        <Text style={styles.rosterName}>{item.driver.name}</Text>
                        <Text style={styles.mutedText}>{assignedVehicle?.unitNumber || 'No assigned vehicle'}</Text>
                      </View>
                    </View>
                    <View style={styles.factRow}>
                      <Fact icon={<DollarSign color="#64748b" size={15} />} label={`Gross income ${money(item.tripIncome)}`} />
                      <Fact icon={<Receipt color="#64748b" size={15} />} label={`Gross expense ${money(item.grossExpense)}`} />
                      <Fact icon={<FileText color="#64748b" size={15} />} label={`Net ${money(item.net)}`} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {showVehicleResults ? (
            <View style={styles.panel}>
              <SectionTitle icon={<Truck color="#2563eb" size={20} />} title="Income vs expense by vehicle" />
              {visibleVehicleFinancials.length === 0 ? <EmptyState text="No vehicles match the selected filter." /> : null}
              {visibleVehicleFinancials.map((item) => (
                <View key={item.vehicle.id} style={styles.rosterRow}>
                  <View style={styles.rosterTop}>
                    <View>
                      <Text style={styles.rosterName}>{item.vehicle.unitNumber}</Text>
                      <Text style={styles.mutedText}>{item.vehicle.make} {item.vehicle.model}</Text>
                    </View>
                  </View>
                  <View style={styles.factRow}>
                    <Fact icon={<DollarSign color="#64748b" size={15} />} label={`Gross income ${money(item.tripIncome)}`} />
                    <Fact icon={<Receipt color="#64748b" size={15} />} label={`Gross expense ${money(item.grossExpense)}`} />
                    <Fact icon={<FileText color="#64748b" size={15} />} label={`Net ${money(item.net)}`} />
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.panel}>
            <SectionTitle icon={<Brain color="#7c3aed" size={20} />} title="Vendor AI review" />
            {insights.map((insight) => <InsightRow key={insight.title} insight={insight} />)}
          </View>
        </>
      ) : null}

      {activePage === 'vehicles' ? (
        <View style={styles.panel}>
          <SectionTitle icon={<Truck color="#2563eb" size={20} />} title="Add vehicle" />
          <Text style={styles.loginHelp}>Use this form to add a new truck or trailer to the selected vendor.</Text>
          <Field label="Unit number" value={vehicleForm.unitNumber} placeholder={`${vendor.logoText}-24`} onChangeText={(unitNumber) => onVehicleFormChange({ ...vehicleForm, unitNumber })} />
          <View style={styles.twoColumn}>
            <Field label="Make" value={vehicleForm.make} placeholder="Freightliner" onChangeText={(make) => onVehicleFormChange({ ...vehicleForm, make })} />
            <Field label="Model" value={vehicleForm.model} placeholder="Cascadia" onChangeText={(model) => onVehicleFormChange({ ...vehicleForm, model })} />
          </View>
          <View style={styles.twoColumn}>
            <Field label="Year" value={vehicleForm.year} placeholder="2022" keyboardType="numeric" onChangeText={(year) => onVehicleFormChange({ ...vehicleForm, year })} />
            <Field label="Mileage" value={vehicleForm.mileage} placeholder="125000" keyboardType="numeric" onChangeText={(mileage) => onVehicleFormChange({ ...vehicleForm, mileage })} />
          </View>
          <Field label="VIN" value={vehicleForm.vin} placeholder="Vehicle VIN" autoCapitalize="characters" onChangeText={(vin) => onVehicleFormChange({ ...vehicleForm, vin })} />
          <View style={styles.twoColumn}>
            <Field label="Plate" value={vehicleForm.plate} placeholder="TX plate" autoCapitalize="characters" onChangeText={(plate) => onVehicleFormChange({ ...vehicleForm, plate })} />
            <Field label="Bought date" value={vehicleForm.boughtDate} placeholder="2026-06-13" onChangeText={(boughtDate) => onVehicleFormChange({ ...vehicleForm, boughtDate })} />
          </View>
          <View style={styles.twoColumn}>
            <Field label="Total buying cost" value={vehicleForm.totalCost} placeholder="120000" keyboardType="decimal-pad" onChangeText={(totalCost) => onVehicleFormChange({ ...vehicleForm, totalCost })} />
            <Field label="Loan balance" value={vehicleForm.loanBalance} placeholder="75000" keyboardType="decimal-pad" onChangeText={(loanBalance) => onVehicleFormChange({ ...vehicleForm, loanBalance })} />
          </View>
          <Field label="Monthly payment" value={vehicleForm.monthlyPayment} placeholder="2200" keyboardType="decimal-pad" onChangeText={(monthlyPayment) => onVehicleFormChange({ ...vehicleForm, monthlyPayment })} />
          <Text style={styles.fieldLabel}>Vehicle photo (before hand over)</Text>
          <AttachmentBox attachments={vehicleForm.photo ? [vehicleForm.photo] : []} onAttach={onAttachVehiclePhoto} label="Upload vehicle photo" />
          <ActionButton label="Add vehicle to this vendor" tone="green" icon={<Plus color="#ffffff" size={18} />} onPress={onAddVehicle} />

          <View style={styles.detailDivider} />
          <SectionTitle icon={<Truck color="#2563eb" size={20} />} title={`Vehicles on file (${vehicles.length})`} />
          <Text style={styles.loginHelp}>Tap a vehicle to view its details and photo.</Text>
          {vehicles.length === 0 ? <EmptyState text="No vehicles added yet." /> : null}
          {vehicles.map((vehicle) => {
            const assignedDriver = drivers.find((driver) => driver.assignedVehicleId === vehicle.id);
            const open = openVehicleId === vehicle.id;
            return (
              <View key={vehicle.id} style={styles.rosterRow}>
                <Pressable style={styles.rosterTop} onPress={() => setOpenVehicleId(open ? '' : vehicle.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rosterName}>{vehicle.unitNumber} · {vehicle.make} {vehicle.model}</Text>
                    <Text style={styles.mutedText}>{vehicle.plate || 'No plate'} · {assignedDriver?.name || 'Unassigned'}</Text>
                  </View>
                  <Text style={styles.textButtonLabel}>{open ? 'Hide' : 'View'}</Text>
                </Pressable>
                {open ? (
                  <View style={styles.detailList}>
                    <DetailLine label="Year" value={vehicle.year} />
                    <DetailLine label="VIN" value={vehicle.vin} />
                    <DetailLine label="Plate" value={vehicle.plate} />
                    <DetailLine label="Mileage" value={vehicle.mileage ? String(vehicle.mileage) : ''} />
                    <DetailLine label="Bought date" value={vehicle.boughtDate} />
                    <DetailLine label="Total cost" value={vehicle.totalCost ? money(vehicle.totalCost) : ''} />
                    <DetailLine label="Loan balance" value={vehicle.loanBalance ? money(vehicle.loanBalance) : ''} />
                    <DetailLine label="Monthly payment" value={vehicle.monthlyPayment ? money(vehicle.monthlyPayment) : ''} />
                    <DetailLine label="Assigned driver" value={assignedDriver?.name || 'Unassigned'} />
                    <DetailLine label="Status" value={vehicle.active ? 'Active' : 'Inactive'} />
                    <AttachmentViewer label="Vehicle photo" attachment={vehicle.photo} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {activePage === 'entries' ? (
        <>
          <View style={styles.panel}>
            <SectionTitle icon={<Receipt color="#be123c" size={20} />} title="Add expense (admin)" />
            <Text style={styles.loginHelp}>Select trip/vehicle/driver and add expense for this vendor.</Text>
            <Dropdown
              label="Trip"
              options={trips.map((trip) => trip.id)}
              value={adminExpenseEntryForm.tripId}
              placeholder="Select trip"
              getLabel={(id) => {
                const trip = trips.find((item) => item.id === id);
                return trip ? `${trip.startPoint} to ${trip.endPoint} (${money(trip.tripMoney)})` : id;
              }}
              onChange={(tripId) => {
                const trip = trips.find((item) => item.id === tripId);
                onAdminExpenseEntryFormChange({
                  ...adminExpenseEntryForm,
                  tripId,
                  driverId: trip?.driverId || adminExpenseEntryForm.driverId,
                  vehicleId: trip?.vehicleId || adminExpenseEntryForm.vehicleId
                });
              }}
            />
            <View style={styles.twoColumn}>
              <Dropdown
                label="Driver"
                options={drivers.map((driver) => driver.id)}
                value={adminExpenseEntryForm.driverId}
                placeholder="Select driver"
                getLabel={(id) => drivers.find((driver) => driver.id === id)?.name || id}
                onChange={(driverId) => onAdminExpenseEntryFormChange({ ...adminExpenseEntryForm, driverId })}
              />
              <Dropdown
                label="Vehicle"
                options={vehicles.map((vehicle) => vehicle.id)}
                value={adminExpenseEntryForm.vehicleId}
                placeholder="Select vehicle"
                getLabel={(id) => vehicles.find((vehicle) => vehicle.id === id)?.unitNumber || id}
                onChange={(vehicleId) => onAdminExpenseEntryFormChange({ ...adminExpenseEntryForm, vehicleId })}
              />
            </View>
            <Dropdown label="Expense type" options={vendor.expenseCategories} value={adminExpenseEntryForm.category} onChange={(category) => onAdminExpenseEntryFormChange({ ...adminExpenseEntryForm, category })} />
            <View style={styles.twoColumn}>
              <Field label="Amount" value={adminExpenseEntryForm.amount} placeholder="0.00" keyboardType="decimal-pad" onChangeText={(amount) => onAdminExpenseEntryFormChange({ ...adminExpenseEntryForm, amount })} />
              <Field label="Vendor/place" value={adminExpenseEntryForm.vendorPlace} placeholder="Pilot, toll plaza" onChangeText={(vendorPlace) => onAdminExpenseEntryFormChange({ ...adminExpenseEntryForm, vendorPlace })} />
            </View>
            <Field label="Location" value={adminExpenseEntryForm.location} placeholder="City, state" onChangeText={(location) => onAdminExpenseEntryFormChange({ ...adminExpenseEntryForm, location })} />
            <Dropdown label="Payment method" options={Object.keys(paymentLabels) as PaymentMethod[]} value={adminExpenseEntryForm.paymentMethod} getLabel={(option) => paymentLabels[option]} onChange={(paymentMethod) => onAdminExpenseEntryFormChange({ ...adminExpenseEntryForm, paymentMethod })} />
            <Field label="Receipt number" value={adminExpenseEntryForm.receiptNumber} placeholder="Receipt/challan number" onChangeText={(receiptNumber) => onAdminExpenseEntryFormChange({ ...adminExpenseEntryForm, receiptNumber })} />
            <Field label="Description" value={adminExpenseEntryForm.description} placeholder="What was paid and why" multiline onChangeText={(description) => onAdminExpenseEntryFormChange({ ...adminExpenseEntryForm, description })} />
            <ActionButton label="Add expense entry" tone="rose" icon={<Plus color="#ffffff" size={18} />} onPress={onAddAdminExpenseEntry} />
          </View>

          <View style={styles.panel}>
            <SectionTitle icon={<Wrench color="#d97706" size={20} />} title="Add maintenance (admin)" />
            <Text style={styles.loginHelp}>Link maintenance to a trip/vehicle and create a vendor maintenance request.</Text>
            <Dropdown
              label="Trip"
              options={trips.map((trip) => trip.id)}
              value={adminMaintenanceEntryForm.tripId}
              placeholder="Select trip"
              getLabel={(id) => {
                const trip = trips.find((item) => item.id === id);
                return trip ? `${trip.startPoint} to ${trip.endPoint} (${money(trip.tripMoney)})` : id;
              }}
              onChange={(tripId) => {
                const trip = trips.find((item) => item.id === tripId);
                onAdminMaintenanceEntryFormChange({
                  ...adminMaintenanceEntryForm,
                  tripId,
                  driverId: trip?.driverId || adminMaintenanceEntryForm.driverId,
                  vehicleId: trip?.vehicleId || adminMaintenanceEntryForm.vehicleId
                });
              }}
            />
            <View style={styles.twoColumn}>
              <Dropdown
                label="Driver"
                options={drivers.map((driver) => driver.id)}
                value={adminMaintenanceEntryForm.driverId}
                placeholder="Select driver"
                getLabel={(id) => drivers.find((driver) => driver.id === id)?.name || id}
                onChange={(driverId) => onAdminMaintenanceEntryFormChange({ ...adminMaintenanceEntryForm, driverId })}
              />
              <Dropdown
                label="Vehicle"
                options={vehicles.map((vehicle) => vehicle.id)}
                value={adminMaintenanceEntryForm.vehicleId}
                placeholder="Select vehicle"
                getLabel={(id) => vehicles.find((vehicle) => vehicle.id === id)?.unitNumber || id}
                onChange={(vehicleId) => onAdminMaintenanceEntryFormChange({ ...adminMaintenanceEntryForm, vehicleId })}
              />
            </View>
            <Dropdown label="Service type" options={vendor.maintenanceTypes} value={adminMaintenanceEntryForm.serviceType} onChange={(serviceType) => onAdminMaintenanceEntryFormChange({ ...adminMaintenanceEntryForm, serviceType })} />
            <View style={styles.twoColumn}>
              <Field label="Odometer" value={adminMaintenanceEntryForm.odometer} placeholder="250000" keyboardType="numeric" onChangeText={(odometer) => onAdminMaintenanceEntryFormChange({ ...adminMaintenanceEntryForm, odometer })} />
              <Field label="Estimate" value={adminMaintenanceEntryForm.estimatedCost} placeholder="450" keyboardType="decimal-pad" onChangeText={(estimatedCost) => onAdminMaintenanceEntryFormChange({ ...adminMaintenanceEntryForm, estimatedCost })} />
            </View>
            <Field label="Shop name" value={adminMaintenanceEntryForm.shopName} placeholder="Shop or mechanic" onChangeText={(shopName) => onAdminMaintenanceEntryFormChange({ ...adminMaintenanceEntryForm, shopName })} />
            <Field label="Issue" value={adminMaintenanceEntryForm.issue} placeholder="Explain maintenance need" multiline onChangeText={(issue) => onAdminMaintenanceEntryFormChange({ ...adminMaintenanceEntryForm, issue })} />
            <ActionButton label="Add maintenance entry" tone="amber" icon={<Plus color="#ffffff" size={18} />} onPress={onAddAdminMaintenanceEntry} />
          </View>

          <View style={styles.panel}>
            <SectionTitle icon={<DollarSign color="#2563eb" size={20} />} title="Pay driver salary" />
            <Text style={styles.loginHelp}>Record salary payouts with date and payment mode for each driver.</Text>
            <View style={styles.twoColumn}>
              <Dropdown
                label="Driver"
                options={drivers.map((driver) => driver.id)}
                value={adminSalaryEntryForm.driverId}
                placeholder="Select driver"
                getLabel={(id) => drivers.find((driver) => driver.id === id)?.name || id}
                onChange={(driverId) => {
                  const driver = drivers.find((item) => item.id === driverId);
                  onAdminSalaryEntryFormChange({
                    ...adminSalaryEntryForm,
                    driverId,
                    vehicleId: driver?.assignedVehicleId || adminSalaryEntryForm.vehicleId
                  });
                }}
              />
              <Dropdown
                label="Vehicle"
                options={vehicles.map((vehicle) => vehicle.id)}
                value={adminSalaryEntryForm.vehicleId}
                placeholder="Select vehicle"
                getLabel={(id) => vehicles.find((vehicle) => vehicle.id === id)?.unitNumber || id}
                onChange={(vehicleId) => onAdminSalaryEntryFormChange({ ...adminSalaryEntryForm, vehicleId })}
              />
            </View>
            <View style={styles.twoColumn}>
              <Field label="Salary amount" value={adminSalaryEntryForm.amount} placeholder="0.00" keyboardType="decimal-pad" onChangeText={(amount) => onAdminSalaryEntryFormChange({ ...adminSalaryEntryForm, amount })} />
              <Field label="Payment date" value={adminSalaryEntryForm.paymentDate} placeholder="YYYY-MM-DD" onChangeText={(paymentDate) => onAdminSalaryEntryFormChange({ ...adminSalaryEntryForm, paymentDate })} />
            </View>
            <Dropdown
              label="Mode of payment"
              options={Object.keys(salaryPaymentModeLabels) as SalaryPaymentMode[]}
              value={adminSalaryEntryForm.paymentMode}
              getLabel={(option) => salaryPaymentModeLabels[option]}
              onChange={(paymentMode) => onAdminSalaryEntryFormChange({ ...adminSalaryEntryForm, paymentMode })}
            />
            <Field label="Note" value={adminSalaryEntryForm.note} placeholder="Optional note" onChangeText={(note) => onAdminSalaryEntryFormChange({ ...adminSalaryEntryForm, note })} />
            <ActionButton label="Record salary payment" tone="blue" icon={<DollarSign color="#ffffff" size={18} />} onPress={onAddAdminSalaryEntry} />
          </View>

          <View style={styles.panel}>
            <SectionTitle icon={<FileText color="#2563eb" size={20} />} title="Salary payment history" actionLabel="Export CSV" onAction={exportSalaryHistoryCsv} />
            <Text style={styles.loginHelp}>Filter payouts by driver and date range.</Text>
            <View style={styles.twoColumn}>
              <Dropdown
                label="Driver"
                options={['', ...drivers.map((driver) => driver.id)]}
                value={salaryFilterDriverId}
                placeholder="All drivers"
                getLabel={(id) => (id ? drivers.find((driver) => driver.id === id)?.name || id : 'All drivers')}
                onChange={(driverId) => setSalaryFilterDriverId(driverId)}
              />
              <Field label="From date" value={salaryFilterFromDate} placeholder="YYYY-MM-DD" onChangeText={setSalaryFilterFromDate} />
            </View>
            <View style={styles.twoColumn}>
              <Field label="To date" value={salaryFilterToDate} placeholder="YYYY-MM-DD" onChangeText={setSalaryFilterToDate} />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Actions</Text>
                <Pressable
                  style={styles.textButton}
                  onPress={() => {
                    setSalaryFilterDriverId('');
                    setSalaryFilterFromDate('');
                    setSalaryFilterToDate('');
                  }}
                >
                  <Text style={styles.textButtonLabel}>Clear filters</Text>
                </Pressable>
              </View>
            </View>
            {salaryPayments.length === 0 ? <EmptyState text="No salary payments recorded yet." /> : null}
            {salaryPayments.length > 0 && filteredSalaryPayments.length === 0 ? <EmptyState text="No salary payments match the selected filters." /> : null}
            {filteredSalaryPayments.slice(0, 12).map((payment) => {
              const driver = drivers.find((item) => item.id === payment.driverId);
              const vehicle = vehicles.find((item) => item.id === payment.vehicleId);
              return (
                <View key={payment.id} style={styles.rosterRow}>
                  <View style={styles.rosterTop}>
                    <View>
                      <Text style={styles.rosterName}>{driver?.name || 'Driver'} · {money(payment.amount)}</Text>
                      <Text style={styles.mutedText}>{vehicle?.unitNumber || 'No vehicle'} · {salaryPaymentModeLabels[payment.paymentMode]}</Text>
                    </View>
                    <StatusPill status={payment.syncStatus === 'synced' ? 'approved' : 'pending'} label={payment.syncStatus === 'synced' ? 'Synced' : 'Queued'} />
                  </View>
                  <Text style={styles.detailLine}>Paid on {payment.paymentDate}{payment.note ? ` · ${payment.note}` : ''}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {activePage === 'drivers' ? (
        <View style={styles.panel}>
          <SectionTitle icon={<UserPlus color="#2563eb" size={20} />} title="Add driver" />
          <Text style={styles.loginHelp}>New drivers should have a phone number that they will sign in with later.</Text>
          <Field label="Driver name" value={driverForm.name} placeholder="Full name" onChangeText={(name) => onDriverFormChange({ ...driverForm, name })} />
          <View style={styles.twoColumn}>
            <Field label="Phone" value={driverForm.phone} placeholder="+1..." keyboardType="phone-pad" onChangeText={(phone) => onDriverFormChange({ ...driverForm, phone })} />
            <Field label="Email" value={driverForm.email} placeholder="driver@email.com" keyboardType="email-address" autoCapitalize="none" onChangeText={(email) => onDriverFormChange({ ...driverForm, email })} />
          </View>
          <Field label="License" value={driverForm.licenseNumber} placeholder="CDL number" autoCapitalize="characters" onChangeText={(licenseNumber) => onDriverFormChange({ ...driverForm, licenseNumber })} />
          <Field label="Address" value={driverForm.address} placeholder="Driver home city/address" onChangeText={(address) => onDriverFormChange({ ...driverForm, address })} />
          <Field label="Emergency contact" value={driverForm.emergencyContact} placeholder="Name and phone" onChangeText={(emergencyContact) => onDriverFormChange({ ...driverForm, emergencyContact })} />
          <VehiclePicker vehicles={vehicles} selectedVehicleId={driverForm.assignedVehicleId || vehicles[0]?.id || ''} onSelect={(assignedVehicleId) => onDriverFormChange({ ...driverForm, assignedVehicleId })} />
          <Text style={styles.fieldLabel}>Driver photo</Text>
          <AttachmentBox attachments={driverForm.photo ? [driverForm.photo] : []} onAttach={onAttachDriverPhoto} label="Upload driver photo" />
          <Text style={styles.fieldLabel}>Driving license</Text>
          <AttachmentBox attachments={driverForm.licenseDocument ? [driverForm.licenseDocument] : []} onAttach={onAttachDriverLicense} label="Upload driving license" />
          <Text style={styles.fieldLabel}>Agreement</Text>
          <AttachmentBox attachments={driverForm.agreement ? [driverForm.agreement] : []} onAttach={onAttachDriverAgreement} label="Upload agreement" />
          <ActionButton label="Add driver to this vendor" tone="blue" icon={<UserPlus color="#ffffff" size={18} />} onPress={onAddDriver} />

          <View style={styles.detailDivider} />
          <SectionTitle icon={<Users color="#2563eb" size={20} />} title={`Drivers on file (${drivers.length})`} />
          <Text style={styles.loginHelp}>Tap a driver to view their details, photo, license and agreement.</Text>
          {drivers.length === 0 ? <EmptyState text="No drivers added yet." /> : null}
          {drivers.map((driver) => {
            const assignedVehicle = getAssignedVehicle(fleet, driver);
            const open = openDriverId === driver.id;
            return (
              <View key={driver.id} style={styles.rosterRow}>
                <Pressable style={styles.rosterTop} onPress={() => setOpenDriverId(open ? '' : driver.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rosterName}>{driver.name}</Text>
                    <Text style={styles.mutedText}>{driver.phone} · {assignedVehicle?.unitNumber || 'No vehicle'}</Text>
                  </View>
                  <Text style={styles.textButtonLabel}>{open ? 'Hide' : 'View'}</Text>
                </Pressable>
                {open ? (
                  <View style={styles.detailList}>
                    <DetailLine label="Email" value={driver.email} />
                    <DetailLine label="License number" value={driver.licenseNumber} />
                    <DetailLine label="Address" value={driver.address} />
                    <DetailLine label="Emergency contact" value={driver.emergencyContact} />
                    <DetailLine label="Assigned vehicle" value={assignedVehicle ? `${assignedVehicle.unitNumber} · ${assignedVehicle.make} ${assignedVehicle.model}` : 'None'} />
                    <DetailLine label="Status" value={driver.active ? 'Active' : 'Inactive'} />
                    <AttachmentViewer label="Driver photo" attachment={driver.photo} />
                    <AttachmentViewer label="Driving license" attachment={driver.licenseDocument} />
                    <AttachmentViewer label="Agreement" attachment={driver.agreement} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {activePage === 'approvals' ? (
        <>
          <View style={styles.panel}>
            <SectionTitle icon={<Receipt color="#be123c" size={20} />} title="Expense approvals" />
            {claims.length === 0 ? <EmptyState text="No expense claims yet." /> : null}
            {claims.map((claim) => <ExpenseApprovalCard key={claim.id} claim={claim} fleet={fleet} vendor={vendor} onDecide={onDecideExpense} />)}
          </View>
          <View style={styles.panel}>
            <SectionTitle icon={<Wrench color="#d97706" size={20} />} title="Maintenance approvals" />
            {maintenance.length === 0 ? <EmptyState text="No maintenance requests yet." /> : null}
            {maintenance.map((request) => <MaintenanceApprovalCard key={request.id} request={request} fleet={fleet} onDecide={onDecideMaintenance} />)}
          </View>
        </>
      ) : null}

      {activePage === 'roster' ? (
        <View style={styles.panel}>
          <SectionTitle icon={<Users color="#2563eb" size={20} />} title="Vendor roster" />
          {drivers.map((driver) => {
            const vehicle = getAssignedVehicle(fleet, driver);
            const driverRevenue = fleet.tripLogs.filter((trip) => trip.driverId === driver.id).reduce((sum, trip) => sum + trip.tripMoney, 0);
            const driverClaims = fleet.expenseClaims.filter((claim) => claim.driverId === driver.id).reduce((sum, claim) => sum + claim.amount, 0);
            return (
              <View key={driver.id} style={styles.rosterRow}>
                <View style={styles.rosterTop}>
                  <View>
                    <Text style={styles.rosterName}>{driver.name}</Text>
                    <Text style={styles.mutedText}>{driver.phone} · {driver.licenseNumber}</Text>
                  </View>
                  <StatusPill status={driver.active ? 'approved' : 'rejected'} label={driver.active ? 'Active' : 'Inactive'} />
                </View>
                <Text style={styles.detailLine}>{vehicle?.unitNumber || 'No vehicle'} · {vehicle?.make || ''} {vehicle?.model || ''}</Text>
                <View style={styles.factRow}>
                  <Fact icon={<DollarSign color="#64748b" size={15} />} label={`Trips ${money(driverRevenue)}`} />
                  <Fact icon={<Receipt color="#64748b" size={15} />} label={`Claims ${money(driverClaims)}`} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

function DriverWorkspace({
  fleet,
  vendor,
  selectedDriver,
  selectedDriverId,
  selectedVehicle,
  tripForm,
  expenseForm,
  maintenanceForm,
  onSelectDriver,
  onTripFormChange,
  onExpenseFormChange,
  onMaintenanceFormChange,
  onAddTrip,
  onAddExpense,
  onAddMaintenance,
  onAttachExpense,
  onAttachMaintenance,
  activePage,
  onPageChange,
  loggedInPhone,
  onLogout,
  language
}: {
  fleet: FleetState;
  vendor: Vendor;
  selectedDriver?: Driver;
  selectedDriverId: string;
  selectedVehicle?: Vehicle;
  tripForm: TripForm;
  expenseForm: ExpenseForm;
  maintenanceForm: MaintenanceForm;
  onSelectDriver: (driverId: string) => void;
  onTripFormChange: (form: TripForm) => void;
  onExpenseFormChange: (form: ExpenseForm) => void;
  onMaintenanceFormChange: (form: MaintenanceForm) => void;
  onAddTrip: () => void;
  onAddExpense: () => void;
  onAddMaintenance: () => void;
  onAttachExpense: () => void;
  onAttachMaintenance: () => void;
  activePage: UserPortalPage | null;
  onPageChange: (page: UserPortalPage | null) => void;
  loggedInPhone: string;
  onLogout: () => void;
  language: Language;
}) {
  const t = driverTranslations[language];
  const drivers = vendorDrivers(fleet, vendor.id).filter((driver) => driver.id === selectedDriverId);
  const driverTrips = fleet.tripLogs.filter((trip) => trip.driverId === selectedDriverId);
  const driverClaims = fleet.expenseClaims.filter((claim) => claim.driverId === selectedDriverId);
  const approved = driverClaims.filter((claim) => claim.status === 'approved').reduce((sum, claim) => sum + claim.amount, 0);
  const pending = driverClaims.filter((claim) => claim.status === 'pending').reduce((sum, claim) => sum + claim.amount, 0);
  const revenue = driverTrips.reduce((sum, trip) => sum + trip.tripMoney, 0);

  const pageOptions: { id: UserPortalPage; label: string }[] = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'trip', label: t.addTrip },
    { id: 'expense', label: t.expense },
    { id: 'maintenance', label: t.maintenance }
  ];

  return (
    <>
      <View style={styles.workspaceHeader}>
        <SectionTitle icon={<Truck color={vendor.primaryColor} size={20} />} title={t.driverPortal} />
        <View style={styles.loggedInRow}>
          <Text style={styles.mutedText}>{t.signedInAs} {loggedInPhone}</Text>
          <Pressable style={styles.textButton} onPress={onLogout}>
            <Text style={styles.textButtonLabel}>{t.signOut}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabRow}>
        {pageOptions.map((option) => (
          <PortalTabButton
            key={option.id}
            label={option.label}
            active={activePage === option.id}
            brandColor={vendor.primaryColor}
            onPress={() => onPageChange(option.id)}
          />
        ))}
      </View>

      {activePage === null ? (
        <View style={styles.panel}>
          <EmptyState text={t.selectTab} />
        </View>
      ) : null}

      <View style={styles.driverPicker}>
        {drivers.map((driver) => {
          const vehicle = getAssignedVehicle(fleet, driver);
          const active = driver.id === selectedDriverId;
          return (
            <Pressable key={driver.id} style={[styles.driverChip, active && { borderColor: vendor.primaryColor, backgroundColor: '#ecfdf5' }]} onPress={() => onSelectDriver(driver.id)}>
              <Text style={[styles.driverChipName, active && { color: vendor.primaryColor }]}>{driver.name}</Text>
              <Text style={styles.driverChipTruck}>{vehicle?.unitNumber || t.noTruck} · {vehicle?.make || ''} {vehicle?.model || ''}</Text>
            </Pressable>
          );
        })}
      </View>

{selectedDriver && selectedVehicle ? (
        <>
          <View style={styles.identityPanel}>
            <View style={[styles.identityIcon, { backgroundColor: vendor.primaryColor }]}>
              <Truck color="#ffffff" size={26} />
            </View>
            <View style={styles.identityText}>
              <Text style={styles.identityTitle}>{selectedDriver.name}</Text>
              <Text style={styles.identityMeta}>{selectedVehicle.unitNumber} · {selectedVehicle.make} {selectedVehicle.model} · {selectedVehicle.plate}</Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryTile label={t.tripMoney} value={money(revenue)} icon={<DollarSign color="#2563eb" size={20} />} />
            <SummaryTile label={t.approved} value={money(approved)} icon={<CheckCircle2 color="#1d4ed8" size={20} />} />
            <SummaryTile label={t.pending} value={money(pending)} icon={<Clock color="#d97706" size={20} />} />
          </View>

          {activePage === 'dashboard' ? (
            <View style={styles.panel}>
              <SectionTitle icon={<FileText color="#2563eb" size={20} />} title={t.myRecords} />
              {driverTrips.slice(0, 4).map((trip) => (
                <RecordRow key={trip.id} icon={<MapPin color="#2563eb" size={18} />} title={`${trip.startPoint} to ${trip.endPoint}`} detail={`${money(trip.tripMoney)} · ${trip.startDate || 'Start'} to ${trip.endDate || 'Open'}`} right={formatDate(trip.createdAt)} />
              ))}
              {driverClaims.slice(0, 5).map((claim) => (
                <RecordRow key={claim.id} icon={<Receipt color="#be123c" size={18} />} title={`${claim.category} · ${money(claim.amount)}`} detail={`${claim.vendorPlace} · ${claim.receiptNumber || 'No receipt number'} · ${claim.attachments.length} file(s)`} right={claim.status} />
              ))}
            </View>
          ) : null}

          {activePage === 'trip' ? (
            <View style={styles.panel}>
              <SectionTitle icon={<MapPin color="#2563eb" size={20} />} title={t.addTripLog} />
              <Text style={styles.loginHelp}>{t.tripHelp}</Text>
              <View style={styles.twoColumn}>
                <Field label={t.startPoint} value={tripForm.startPoint} placeholder="Dallas, TX" onChangeText={(startPoint) => onTripFormChange({ ...tripForm, startPoint })} />
                <Field label={t.endPoint} value={tripForm.endPoint} placeholder="Atlanta, GA" onChangeText={(endPoint) => onTripFormChange({ ...tripForm, endPoint })} />
              </View>
              <View style={styles.twoColumn}>
                <Field label={t.startDate} value={tripForm.startDate} placeholder="2026-06-13" onChangeText={(startDate) => onTripFormChange({ ...tripForm, startDate })} />
                <Field label={t.endDate} value={tripForm.endDate} placeholder="2026-06-14" onChangeText={(endDate) => onTripFormChange({ ...tripForm, endDate })} />
              </View>
              <Field label={t.tripMoney} value={tripForm.tripMoney} placeholder="2500" keyboardType="decimal-pad" onChangeText={(tripMoney) => onTripFormChange({ ...tripForm, tripMoney })} />
              <Field label={t.tripNotes} value={tripForm.notes} placeholder="Load number, broker, receiver notes" multiline onChangeText={(notes) => onTripFormChange({ ...tripForm, notes })} />
              <ActionButton label={t.submitTripLog} tone="blue" icon={<Plus color="#ffffff" size={18} />} onPress={onAddTrip} />
            </View>
          ) : null}

          {activePage === 'expense' ? (
            <View style={styles.panel}>
              <SectionTitle icon={<Receipt color="#be123c" size={20} />} title={t.claimExpense} />
              <Text style={styles.loginHelp}>{t.expenseHelp}</Text>
              <Dropdown label={t.expenseType} options={vendor.expenseCategories} value={expenseForm.category} onChange={(category) => onExpenseFormChange({ ...expenseForm, category })} />
              <View style={styles.twoColumn}>
                <Field label={t.amount} value={expenseForm.amount} placeholder="0.00" keyboardType="decimal-pad" onChangeText={(amount) => onExpenseFormChange({ ...expenseForm, amount })} />
                <Field label={t.vendorPlace} value={expenseForm.vendorPlace} placeholder="Pilot, toll plaza" onChangeText={(vendorPlace) => onExpenseFormChange({ ...expenseForm, vendorPlace })} />
              </View>
              <Field label={t.location} value={expenseForm.location} placeholder="City, state" onChangeText={(location) => onExpenseFormChange({ ...expenseForm, location })} />
              <Dropdown label={t.paymentMethod} options={Object.keys(paymentLabels) as PaymentMethod[]} value={expenseForm.paymentMethod} getLabel={(option) => paymentLabels[option]} onChange={(paymentMethod) => onExpenseFormChange({ ...expenseForm, paymentMethod })} />
              <Field label={t.receiptNumber} value={expenseForm.receiptNumber} placeholder="Receipt, challan, ticket, invoice number" onChangeText={(receiptNumber) => onExpenseFormChange({ ...expenseForm, receiptNumber })} />
              <Field label={t.description} value={expenseForm.description} placeholder="What was paid and why" multiline onChangeText={(description) => onExpenseFormChange({ ...expenseForm, description })} />
              <AttachmentBox attachments={expenseForm.attachments} onAttach={onAttachExpense} label={t.attachReceipt} />
              <ActionButton label={t.submitExpense} tone="rose" icon={<Upload color="#ffffff" size={18} />} onPress={onAddExpense} />
            </View>
          ) : null}

          {activePage === 'maintenance' ? (
            <View style={styles.panel}>
              <SectionTitle icon={<Wrench color="#d97706" size={20} />} title={t.maintenanceRequest} />
              <Text style={styles.loginHelp}>{t.maintenanceHelp}</Text>
              <Dropdown label={t.serviceType} options={vendor.maintenanceTypes} value={maintenanceForm.serviceType} onChange={(serviceType) => onMaintenanceFormChange({ ...maintenanceForm, serviceType })} />
              <View style={styles.twoColumn}>
                <Field label={t.odometer} value={maintenanceForm.odometer} placeholder={String(selectedVehicle.mileage)} keyboardType="numeric" onChangeText={(odometer) => onMaintenanceFormChange({ ...maintenanceForm, odometer })} />
                <Field label={t.estimate} value={maintenanceForm.estimatedCost} placeholder="450" keyboardType="decimal-pad" onChangeText={(estimatedCost) => onMaintenanceFormChange({ ...maintenanceForm, estimatedCost })} />
              </View>
              <Field label={t.shopName} value={maintenanceForm.shopName} placeholder="Shop or mechanic" onChangeText={(shopName) => onMaintenanceFormChange({ ...maintenanceForm, shopName })} />
              <Field label={t.issue} value={maintenanceForm.issue} placeholder="Explain maintenance need" multiline onChangeText={(issue) => onMaintenanceFormChange({ ...maintenanceForm, issue })} />
              <AttachmentBox attachments={maintenanceForm.attachments} onAttach={onAttachMaintenance} label={t.attachQuote} />
              <ActionButton label={t.submitMaintenance} tone="amber" icon={<Wrench color="#ffffff" size={18} />} onPress={onAddMaintenance} />
            </View>
          ) : null}
        </>
      ) : (
        <EmptyState text={t.needDriver} />
      )}
    </>
  );
}

function VendorCard({ fleet, vendor }: { fleet: FleetState; vendor: Vendor }) {
  return (
    <View style={styles.rosterRow}>
      <View style={styles.rosterTop}>
        <View>
          <Text style={styles.rosterName}>{vendor.companyName}</Text>
          <Text style={styles.mutedText}>{vendor.ownerName} · {vendor.subscriptionPlan} · {vendor.status}</Text>
        </View>
        <View style={[styles.vendorLogo, { backgroundColor: vendor.primaryColor }]}>
          <Text style={styles.vendorLogoText}>{vendor.logoText}</Text>
        </View>
      </View>
      <View style={styles.factRow}>
        <Fact icon={<Truck color="#64748b" size={15} />} label={`${vendorVehicles(fleet, vendor.id).length} vehicles`} />
        <Fact icon={<Users color="#64748b" size={15} />} label={`${vendorDrivers(fleet, vendor.id).length} drivers`} />
        <Fact icon={<DollarSign color="#64748b" size={15} />} label={money(totalTripMoney(fleet, vendor.id))} />
      </View>
    </View>
  );
}

function ExpenseApprovalCard({
  claim,
  fleet,
  vendor,
  onDecide
}: {
  claim: ExpenseClaim;
  fleet: FleetState;
  vendor: Vendor;
  onDecide: (claimId: string, status: ApprovalStatus) => void;
}) {
  const driver = getDriver(fleet, claim.driverId);
  const vehicle = getVehicle(fleet, claim.vehicleId);

  return (
    <View style={styles.approvalCard}>
      <View style={styles.approvalTop}>
        <View style={styles.approvalMain}>
          <Text style={styles.cardTitle}>{claim.category} · {money(claim.amount)}</Text>
          <Text style={styles.mutedText}>{driver?.name || 'Driver'} · {vehicle?.unitNumber || 'Vehicle'} · {claim.vendorPlace}</Text>
        </View>
        <StatusPill status={claim.status} />
      </View>
      <Text style={styles.detailLine}>{claim.location || 'No location'} · {paymentLabels[claim.paymentMethod]} · {claim.receiptNumber || 'No receipt/challan number'}</Text>
      <Text style={styles.aiLine}>AI check: {claimRisk(claim, vendor)}</Text>
      <View style={styles.factRow}>
        <Fact icon={<Paperclip color="#64748b" size={15} />} label={`${claim.attachments.length} file(s)`} />
        <Fact icon={<Clock color="#64748b" size={15} />} label={formatDate(claim.submittedAt)} />
      </View>
      {claim.status === 'pending' ? (
        <View style={styles.approvalActions}>
          <SmallButton label="Approve" tone="green" icon={<CheckCircle2 color="#ffffff" size={16} />} onPress={() => onDecide(claim.id, 'approved')} />
          <SmallButton label="Reject" tone="red" icon={<XCircle color="#ffffff" size={16} />} onPress={() => onDecide(claim.id, 'rejected')} />
        </View>
      ) : null}
    </View>
  );
}

function MaintenanceApprovalCard({
  request,
  fleet,
  onDecide
}: {
  request: MaintenanceRequest;
  fleet: FleetState;
  onDecide: (requestId: string, status: ApprovalStatus) => void;
}) {
  const driver = getDriver(fleet, request.driverId);
  const vehicle = getVehicle(fleet, request.vehicleId);

  return (
    <View style={styles.approvalCard}>
      <View style={styles.approvalTop}>
        <View style={styles.approvalMain}>
          <Text style={styles.cardTitle}>{request.serviceType} · {money(request.estimatedCost)}</Text>
          <Text style={styles.mutedText}>{driver?.name || 'Driver'} · {vehicle?.unitNumber || 'Vehicle'} · {request.shopName || 'No shop'}</Text>
        </View>
        <StatusPill status={request.status} />
      </View>
      <Text style={styles.detailLine}>{request.issue}</Text>
      <View style={styles.factRow}>
        <Fact icon={<Gauge color="#64748b" size={15} />} label={`${request.odometer.toLocaleString()} mi`} />
        <Fact icon={<Paperclip color="#64748b" size={15} />} label={`${request.attachments.length} file(s)`} />
        <Fact icon={<Clock color="#64748b" size={15} />} label={formatDate(request.submittedAt)} />
      </View>
      {request.status === 'pending' ? (
        <View style={styles.approvalActions}>
          <SmallButton label="Approve" tone="green" icon={<CheckCircle2 color="#ffffff" size={16} />} onPress={() => onDecide(request.id, 'approved')} />
          <SmallButton label="Reject" tone="red" icon={<XCircle color="#ffffff" size={16} />} onPress={() => onDecide(request.id, 'rejected')} />
        </View>
      ) : null}
    </View>
  );
}

function LoginCard({
  role,
  loginPhone,
  loginPassword,
  onChangePhone,
  onChangePassword,
  onSubmit,
  loginError,
  language,
  onChangeLanguage
}: {
  role: 'platform' | 'admin' | 'driver';
  loginPhone: string;
  loginPassword?: string;
  onChangePhone: (value: string) => void;
  onChangePassword?: (value: string) => void;
  onSubmit: () => void;
  loginError: string;
  language?: Language;
  onChangeLanguage?: (language: Language) => void;
}) {
  const isPlatform = role === 'platform';
  const isAdmin = role === 'admin';
  const isDriver = role === 'driver';
  const t = driverTranslations[language || 'en'];

  return (
    <View style={[styles.panel, styles.loginPanel]}>
      <View style={styles.loginHeader}>
        <ShieldCheck color="#4f46e5" size={20} />
        <View style={styles.loginHeaderText}>
          <Text style={styles.sectionTitle}>{isPlatform ? 'Platform sign in' : isAdmin ? 'Admin sign in' : t.driverSignIn}</Text>
          <Text style={styles.loginSubtitle}>{isPlatform ? 'Platform owner access only' : isAdmin ? 'Vendor owner access only' : t.driverAccessOnly}</Text>
        </View>
      </View>
      {isDriver && language && onChangeLanguage ? (
        <Dropdown
          label={t.language}
          options={['en', 'hi'] as Language[]}
          value={language}
          getLabel={(option) => languageLabels[option]}
          onChange={onChangeLanguage}
        />
      ) : null}
      <Text style={styles.loginHelp}>
        {isPlatform
          ? 'Enter the platform password to manage vendors.'
          : isDriver
            ? t.loginHelp
            : 'Enter the mobile number assigned to your account. Drivers use their driver phone; admins use the vendor owner phone.'}
      </Text>
      {!isPlatform ? (
        <Field
          label={isDriver ? t.mobileNumber : 'Mobile number'}
          value={loginPhone}
          placeholder="+1 (555) 410-0188"
          keyboardType="phone-pad"
          onChangeText={onChangePhone}
        />
      ) : null}
      {isPlatform || isAdmin ? (
        <Field
          label={isPlatform ? 'Platform password' : 'Admin password'}
          value={loginPassword || ''}
          placeholder={isPlatform ? 'Enter platform password' : 'Enter admin password'}
          secureTextEntry
          autoCapitalize="none"
          onChangeText={(text) => onChangePassword && onChangePassword(text)}
        />
      ) : null}
      {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
      <ActionButton label={isDriver ? t.signIn : 'Sign in'} tone="blue" icon={<Send color="#ffffff" size={18} />} onPress={onSubmit} />
    </View>
  );
}

function PortalTabButton({
  label,
  active,
  brandColor,
  onPress
}: {
  label: string;
  active: boolean;
  brandColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive, active && brandColor ? { borderColor: brandColor, backgroundColor: '#ecfdf5' } : null]} onPress={onPress}>
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive, active && brandColor ? { color: brandColor } : null]}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({
  icon,
  title,
  actionLabel,
  onAction
}: {
  icon: ReactNode;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleLeft}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable style={styles.textButton} onPress={onAction}>
          <Text style={styles.textButtonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <View style={[styles.metric, compact && styles.metricCompact]}>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SegmentButton({
  active,
  icon,
  label,
  onPress
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}>
      {icon}
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SummaryTile({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  const { width } = useWindowDimensions();
  const compact = width < 760;

  return (
    <View style={[styles.summaryTile, compact && styles.summaryTileCompact]}>
      <View style={styles.summaryIcon}>{icon}</View>
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  const color = insight.tone === 'good' ? '#2563eb' : insight.tone === 'warning' ? '#d97706' : '#be123c';

  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightDot, { backgroundColor: color }]} />
      <View style={styles.insightText}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.mutedText}>{insight.detail}</Text>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  placeholder,
  keyboardType = 'default',
  multiline,
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  onChangeText
}: {
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
      />
    </View>
  );
}

function OptionPicker<T extends string>({
  label,
  options,
  value,
  getLabel,
  onChange
}: {
  label: string;
  options: T[];
  value: T;
  getLabel?: (option: T) => string;
  onChange: (option: T) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable key={option} style={[styles.optionChip, active && styles.optionChipActive]} onPress={() => onChange(option)}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{getLabel ? getLabel(option) : option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Dropdown<T extends string>({
  label,
  options,
  value,
  getLabel,
  placeholder,
  onChange
}: {
  label: string;
  options: T[];
  value: T;
  getLabel?: (option: T) => string;
  placeholder?: string;
  onChange: (option: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option === value);

  const containerStyle = [styles.dropdownContainer, open && styles.dropdownContainerOpen];

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={containerStyle}>
        <Pressable style={styles.dropdownButton} onPress={() => setOpen((current) => !current)}>
          <Text style={[styles.dropdownText, !selectedLabel && styles.dropdownPlaceholder]}>
            {selectedLabel ? (getLabel ? getLabel(selectedLabel) : selectedLabel) : placeholder || 'Select'}
          </Text>
        </Pressable>
        {open ? (
          <View style={styles.dropdownList}>
            {options.map((option) => {
              const active = option === value;
              return (
                <Pressable
                  key={option}
                  style={[styles.dropdownOption, active && styles.dropdownOptionActive]}
                  onPress={() => {
                    setOpen(false);
                    onChange(option);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, active && styles.dropdownOptionTextActive]}>
                    {getLabel ? getLabel(option) : option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function VehiclePicker({
  vehicles,
  selectedVehicleId,
  onSelect
}: {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onSelect: (vehicleId: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Assign vehicle</Text>
      <View style={styles.optionRow}>
        {vehicles.map((vehicle) => {
          const active = vehicle.id === selectedVehicleId;
          return (
            <Pressable key={vehicle.id} style={[styles.optionChip, active && styles.optionChipActive]} onPress={() => onSelect(vehicle.id)}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{vehicle.unitNumber}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleBox, value && styles.toggleBoxOn]}>
        <Text style={[styles.toggleText, value && styles.toggleTextOn]}>{value ? 'On' : 'Off'}</Text>
      </View>
    </Pressable>
  );
}

function AttachmentBox({
  attachments,
  label,
  onAttach
}: {
  attachments: Attachment[];
  label: string;
  onAttach: () => void;
}) {
  return (
    <View style={styles.attachmentBox}>
      <Pressable style={styles.attachButton} onPress={onAttach}>
        <Paperclip color="#2563eb" size={18} />
        <Text style={styles.attachButtonText}>{label}</Text>
      </Pressable>
      {attachments.length === 0 ? (
        <Text style={styles.mutedText}>No file attached yet.</Text>
      ) : (
        attachments.map((attachment) => (
          <View key={attachment.id} style={styles.attachmentRow}>
            <FileText color="#64748b" size={16} />
            <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function StatusPill({ status, label }: { status: ApprovalStatus; label?: string }) {
  const tone = statusTone(status);
  return (
    <View style={[styles.statusPill, tone]}>
      <Text style={[styles.statusPillText, { color: tone.color }]}>{label || status}</Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  tone,
  onPress
}: {
  label: string;
  icon: ReactNode;
  tone: 'green' | 'blue' | 'amber' | 'rose';
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.actionButton, actionTone(tone)]} onPress={onPress}>
      {icon}
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({
  label,
  icon,
  tone,
  onPress
}: {
  label: string;
  icon: ReactNode;
  tone: 'green' | 'red';
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.smallButton, tone === 'green' ? styles.smallGreen : styles.smallRed]} onPress={onPress}>
      {icon}
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

function actionTone(tone: 'green' | 'blue' | 'amber' | 'rose') {
  if (tone === 'green') {
    return styles.actionGreen;
  }
  if (tone === 'blue') {
    return styles.actionBlue;
  }
  if (tone === 'amber') {
    return styles.actionAmber;
  }
  return styles.actionRose;
}

function Fact({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View style={styles.fact}>
      {icon}
      <Text style={styles.factText}>{label}</Text>
    </View>
  );
}

function RecordRow({ icon, title, detail, right }: { icon: ReactNode; title: string; detail: string; right: string }) {
  return (
    <View style={styles.recordRow}>
      <View style={styles.recordIcon}>{icon}</View>
      <View style={styles.recordText}>
        <Text style={styles.recordTitle}>{title}</Text>
        <Text style={styles.mutedText}>{detail}</Text>
      </View>
      <Text style={styles.recordRight}>{right}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLineLabel}>{label}</Text>
      <Text style={styles.detailLineValue}>{value && value.trim() ? value : '—'}</Text>
    </View>
  );
}

function AttachmentViewer({ label, attachment }: { label: string; attachment?: Attachment }) {
  const isImage = !!attachment && (attachment.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic)$/i.test(attachment.name));
  const open = () => {
    if (attachment?.uri) {
      Linking.openURL(attachment.uri).catch(() => Alert.alert('Unable to open', 'This file could not be opened on your device.'));
    }
  };
  return (
    <View style={styles.attachmentViewer}>
      <Text style={styles.detailLineLabel}>{label}</Text>
      {!attachment ? (
        <Text style={styles.mutedText}>Not uploaded.</Text>
      ) : (
        <Pressable style={styles.attachmentViewerRow} onPress={open}>
          {isImage ? (
            <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} resizeMode="cover" />
          ) : (
            <View style={styles.attachmentThumbFile}>
              <FileText color="#2563eb" size={20} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
            <Text style={styles.attachmentOpenLink}>Tap to open</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f5fb'
  },
  keyboard: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    gap: 14
  },
  loadingText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '800'
  },
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f5fb'
  },
  landingCard: {
    width: '100%',
    maxWidth: 420,
    marginHorizontal: 20,
    padding: 26,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eceef7',
    shadowColor: '#312e81',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 30,
    elevation: 6,
    alignItems: 'center',
    gap: 14
  },
  landingMark: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6
  },
  landingMarkText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900'
  },
  landingKicker: {
    color: '#4f46e5',
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  landingTitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center'
  },
  landingSubtitle: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center'
  },
  landingButtons: {
    width: '100%',
    gap: 12,
    marginTop: 6
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8
  },
  workspaceHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  loggedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap'
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    backgroundColor: '#eef2ff'
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    borderWidth: 2
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#475569'
  },
  tabButtonTextActive: {
    color: '#ffffff'
  },
  loginHelp: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18
  },
  loginSubtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700'
  },
  loginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  loginHeaderText: {
    flex: 1,
    justifyContent: 'center'
  },
  errorText: {
    color: '#be123c',
    fontSize: 13,
    fontWeight: '900'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  brandRowCompact: {
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)'
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'
  },
  brandCopy: {
    flex: 1
  },
  brandCopyCompact: {
    minWidth: 200,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 200
  },
  eyebrow: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  title: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '900'
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 26
  },
  subtitle: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  portalSummary: {
    backgroundColor: '#f8fbff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3
  },
  portalSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  portalSummaryTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900'
  },
  portalSummaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  portalSummaryBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900'
  },
  portalBadgeAdmin: {
    backgroundColor: '#4338ca'
  },
  portalBadgeDriver: {
    backgroundColor: '#4f46e5'
  },
  portalSummaryText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700'
  },
  syncBadge: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6
  },
  syncBadgeCompact: {
    marginTop: 6
  },
  syncBadgeText: {
    color: '#e0e7ff',
    fontSize: 12,
    fontWeight: '900'
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18
  },
  metricsRowCompact: {
    flexDirection: 'column',
    gap: 8
  },
  metric: {
    flex: 1,
    minHeight: 68,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    padding: 12,
    justifyContent: 'center'
  },
  metricCompact: {
    flex: undefined,
    width: '100%'
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900'
  },
  metricLabel: {
    marginTop: 3,
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    gap: 4
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    backgroundColor: '#eef2ff'
  },
  segmentActive: {
    backgroundColor: '#ffffff',
    borderColor: '#6366f1'
  },
  segmentText: {
    color: '#1e293b',
    fontSize: 13,
    fontWeight: '900'
  },
  segmentTextActive: {
    color: '#4338ca'
  },
  noticeRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  noticeText: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  },
  syncButton: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900'
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 14
  },
  sectionTitleRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900'
  },
  textButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textButtonLabel: {
    color: '#4338ca',
    fontSize: 12,
    fontWeight: '900'
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#eceef5',
    padding: 18,
    gap: 14,
    shadowColor: '#312e81',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 3
  },
  loginPanel: {
    borderColor: '#e0e7ff',
    backgroundColor: '#f7f8fe'
  },
  summaryGrid: {
    gap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  adminSummaryRow: {
    gap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    justifyContent: 'space-between'
  },
  summaryTile: {
    flex: 1,
    minHeight: 72,
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eceef5',
    padding: 14,
    justifyContent: 'center',
    shadowColor: '#312e81',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2
  },
  summaryTileCompact: {
    minWidth: '100%',
    maxWidth: '100%',
    marginBottom: 8
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    marginBottom: 8
  },
  summaryValue: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900'
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
    textTransform: 'uppercase'
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap'
  },
  field: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minWidth: 260,
    gap: 6,
    zIndex: 10,
    overflow: 'visible'
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e5ee',
    backgroundColor: '#f7f8fc',
    color: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700'
  },
  inputMultiline: {
    minHeight: 78,
    textAlignVertical: 'top'
  },
  dropdownContainer: {
    position: 'relative',
    overflow: 'visible'
  },
  dropdownContainerOpen: {
    minHeight: 260,
    paddingBottom: 12
  },
  dropdownButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e5ee',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    zIndex: 15
  },
  dropdownText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700'
  },
  dropdownPlaceholder: {
    color: '#64748b'
  },
  dropdownList: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    marginTop: 6,
    elevation: 3,
    zIndex: 10,
    maxHeight: 220,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  dropdownOptionActive: {
    backgroundColor: '#eef2ff'
  },
  dropdownOptionText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700'
  },
  dropdownOptionTextActive: {
    color: '#4338ca'
  },
  optionRow: {
    gap: 8
  },
  optionChip: {
    minHeight: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e5ee',
    backgroundColor: '#f7f8fc',
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionChipActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff'
  },
  optionText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900'
  },
  optionTextActive: {
    color: '#4338ca'
  },
  vendorChip: {
    minHeight: 66,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eceef5',
    backgroundColor: '#ffffff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  vendorLogo: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  vendorLogoText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900'
  },
  vendorChipText: {
    flex: 1
  },
  vendorChipName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900'
  },
  toggleRow: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#f7f8fc',
    borderWidth: 1,
    borderColor: '#e2e5ee',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  toggleLabel: {
    flex: 1,
    color: '#334155',
    fontSize: 13,
    fontWeight: '900'
  },
  toggleBox: {
    minWidth: 50,
    minHeight: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0'
  },
  toggleBoxOn: {
    backgroundColor: '#e0e7ff'
  },
  toggleText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900'
  },
  toggleTextOn: {
    color: '#4338ca'
  },
  actionButton: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10
  },
  actionGreen: {
    backgroundColor: '#4f46e5'
  },
  actionBlue: {
    backgroundColor: '#4338ca'
  },
  actionAmber: {
    backgroundColor: '#f59e0b'
  },
  actionRose: {
    backgroundColor: '#e11d48'
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
  },
  insightRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12
  },
  insightDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4
  },
  insightText: {
    flex: 1
  },
  insightTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900'
  },
  mutedText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17
  },
  driverPicker: {
    gap: 10
  },
  driverChip: {
    minHeight: 58,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eceef5',
    justifyContent: 'center'
  },
  driverChipName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900'
  },
  driverChipTruck: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3
  },
  identityPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbe4df',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  identityIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  identityText: {
    flex: 1
  },
  identityTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900'
  },
  identityMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3
  },
  approvalCard: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    gap: 8
  },
  approvalTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  approvalMain: {
    flex: 1
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900'
  },
  detailLine: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18
  },
  aiLine: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '900'
  },
  factRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  fact: {
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 11,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6
  },
  factActive: {
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#a5b4fc'
  },
  factText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800'
  },
  detailList: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    backgroundColor: '#f7f8fe',
    padding: 10
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0fb'
  },
  detailLineLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700'
  },
  detailLineValue: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right'
  },
  attachmentViewer: {
    marginTop: 10,
    gap: 6
  },
  attachmentViewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    padding: 8
  },
  attachmentThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e2e8f0'
  },
  attachmentThumbFile: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff'
  },
  attachmentOpenLink: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '800'
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8
  },
  smallButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6
  },
  smallGreen: {
    backgroundColor: '#4f46e5'
  },
  smallRed: {
    backgroundColor: '#e11d48'
  },
  smallButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900'
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  rosterRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    gap: 8
  },
  rosterTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10
  },
  rosterName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900'
  },
  attachmentBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d8dbe8',
    backgroundColor: '#fafbff',
    padding: 12,
    gap: 8
  },
  attachButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12
  },
  attachButtonText: {
    color: '#4338ca',
    fontSize: 13,
    fontWeight: '900'
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  attachmentName: {
    flex: 1,
    color: '#334155',
    fontSize: 12,
    fontWeight: '800'
  },
  recordRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10
  },
  recordIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff'
  },
  recordText: {
    flex: 1
  },
  recordTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900'
  },
  recordRight: {
    width: 82,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
    textTransform: 'capitalize'
  },
  emptyState: {
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d8dbe8',
    backgroundColor: '#fafbff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  }
});
