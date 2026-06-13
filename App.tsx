import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import { loadFleetState, resetFleetState, saveFleetState } from './src/services/fleetStore';
import { syncFleetChanges } from './src/services/liveApi';
import {
  ApprovalStatus,
  Attachment,
  Driver,
  ExpenseClaim,
  FleetState,
  MaintenanceRequest,
  PaymentMethod,
  SyncQueueItem,
  TripLog,
  Vehicle,
  Vendor
} from './src/types';

type AppRole = 'platform' | 'admin' | 'driver';

type VendorForm = {
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
};

type VehicleForm = {
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
};

type DriverForm = {
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  address: string;
  emergencyContact: string;
  assignedVehicleId: string;
};

type TripForm = {
  startPoint: string;
  endPoint: string;
  startDate: string;
  endDate: string;
  tripMoney: string;
  notes: string;
};

type ExpenseForm = {
  category: string;
  amount: string;
  vendorPlace: string;
  location: string;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  description: string;
  attachments: Attachment[];
};

type MaintenanceForm = {
  odometer: string;
  serviceType: string;
  issue: string;
  estimatedCost: string;
  shopName: string;
  attachments: Attachment[];
};

type InsightTone = 'good' | 'warning' | 'danger';

type Insight = {
  title: string;
  detail: string;
  tone: InsightTone;
};

const defaultCategories = 'Toll, Fuel, Challan, Parking, Repair, Maintenance, Scale ticket, Other';
const defaultMaintenance = 'Oil change, Tire, Brake, Inspection, Engine repair, Trailer repair';

const emptyVendorForm: VendorForm = {
  companyName: '',
  ownerName: '',
  phone: '',
  email: '',
  logoText: '',
  primaryColor: '#0f766e',
  accentColor: '#2563eb',
  subscriptionPlan: 'Enterprise',
  approvalLimit: '500',
  requireReceiptProof: true,
  expenseCategories: defaultCategories,
  maintenanceTypes: defaultMaintenance
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
  loanBalance: '',
  monthlyPayment: ''
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
  startDate: new Date().toISOString().slice(0, 10),
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

const paymentLabels: Record<PaymentMethod, string> = {
  company_card: 'Company card',
  cash: 'Cash',
  driver_paid: 'Driver paid',
  fuel_card: 'Fuel card',
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
    return { backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#166534' };
  }

  if (status === 'rejected') {
    return { backgroundColor: '#fee2e2', borderColor: '#fecaca', color: '#991b1b' };
  }

  return { backgroundColor: '#fef3c7', borderColor: '#fcd34d', color: '#92400e' };
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

export default function App() {
  const [fleet, setFleet] = useState<FleetState | null>(null);
  const [role, setRole] = useState<AppRole>('platform');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [newVendorForm, setNewVendorForm] = useState<VendorForm>(emptyVendorForm);
  const [vendorSettingsForm, setVendorSettingsForm] = useState<VendorForm>(emptyVendorForm);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(emptyVehicleForm);
  const [driverForm, setDriverForm] = useState<DriverForm>(emptyDriverForm);
  const [tripForm, setTripForm] = useState<TripForm>(emptyTripForm);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpenseForm);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceForm>(emptyMaintenanceForm);
  const [notice, setNotice] = useState('Multi-vendor app is ready.');
  const [syncing, setSyncing] = useState(false);

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
  }, [fleet, selectedVendorId, selectedVendor]);

  function persist(next: FleetState) {
    setFleet(next);
    saveFleetState(next).catch(() => {
      setNotice('The app updated, but local storage rejected the save.');
    });
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

    const vendor: Vendor = {
      id: newId('vendor'),
      companyName: newVendorForm.companyName.trim(),
      ownerName: newVendorForm.ownerName.trim(),
      phone: newVendorForm.phone.trim(),
      email: newVendorForm.email.trim(),
      logoText: newVendorForm.logoText.trim() || newVendorForm.companyName.trim().slice(0, 2).toUpperCase(),
      primaryColor: newVendorForm.primaryColor.trim() || '#0f766e',
      accentColor: newVendorForm.accentColor.trim() || '#2563eb',
      subscriptionPlan: newVendorForm.subscriptionPlan.trim() || 'Enterprise',
      status: 'trial',
      approvalLimit: Number.isFinite(approvalLimit) ? approvalLimit : 0,
      requireReceiptProof: newVendorForm.requireReceiptProof,
      expenseCategories: categories.length > 0 ? categories : splitList(defaultCategories),
      maintenanceTypes: maintenanceTypes.length > 0 ? maintenanceTypes : splitList(defaultMaintenance),
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
      active: true
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
      active: true
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

  async function handleSync() {
    if (!fleet || syncing) {
      return;
    }

    setSyncing(true);

    try {
      const result = await syncFleetChanges(fleet.syncQueue);
      setNotice(result.message);

      if (result.ok && !result.skipped) {
        persist({
          ...fleet,
          tripLogs: fleet.tripLogs.map((trip) => ({ ...trip, syncStatus: 'synced' })),
          expenseClaims: fleet.expenseClaims.map((claim) => ({ ...claim, syncStatus: 'synced' })),
          maintenanceRequests: fleet.maintenanceRequests.map((request) => ({ ...request, syncStatus: 'synced' })),
          syncQueue: [],
          lastSyncedAt: new Date().toISOString()
        });
      }
    } catch {
      setNotice('Could not reach the live API. Updates are still saved locally.');
    } finally {
      setSyncing(false);
    }
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
        <ActivityIndicator color="#22c55e" size="large" />
        <Text style={styles.loadingText}>Loading multi-vendor workspace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Header
            fleet={fleet}
            role={role}
            selectedVendor={selectedVendor}
            notice={notice}
            syncing={syncing}
            onRoleChange={setRole}
            onSync={handleSync}
          />

          <View style={styles.body}>
            <VendorSelector
              vendors={fleet.vendors}
              selectedVendorId={selectedVendorId}
              onSelect={setSelectedVendorId}
            />

            {role === 'platform' ? (
              <PlatformWorkspace
                fleet={fleet}
                selectedVendor={selectedVendor}
                newVendorForm={newVendorForm}
                vendorSettingsForm={vendorSettingsForm}
                onNewVendorFormChange={setNewVendorForm}
                onVendorSettingsFormChange={setVendorSettingsForm}
                onAddVendor={addVendor}
                onSaveVendorSettings={saveVendorSettings}
                onReset={handleReset}
              />
            ) : null}

            {role === 'admin' && selectedVendor ? (
              <AdminWorkspace
                fleet={fleet}
                vendor={selectedVendor}
                vehicleForm={vehicleForm}
                driverForm={driverForm}
                onVehicleFormChange={setVehicleForm}
                onDriverFormChange={setDriverForm}
                onAddVehicle={addVehicle}
                onAddDriver={addDriver}
                onDecideExpense={decideExpense}
                onDecideMaintenance={decideMaintenance}
              />
            ) : null}

            {role === 'driver' && selectedVendor ? (
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
              />
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
  onRoleChange,
  onSync
}: {
  fleet: FleetState;
  role: AppRole;
  selectedVendor?: Vendor;
  notice: string;
  syncing: boolean;
  onRoleChange: (role: AppRole) => void;
  onSync: () => void;
}) {
  const themeColor = selectedVendor?.primaryColor || '#0f172a';

  return (
    <View style={[styles.header, { backgroundColor: themeColor }]}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>{selectedVendor?.logoText || 'FC'}</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.eyebrow}>One app · many vendors</Text>
          <Text style={styles.title}>{selectedVendor?.companyName || 'FleetCommand'}</Text>
        </View>
        <View style={styles.syncBadge}>
          <Clock color="#dbeafe" size={16} />
          <Text style={styles.syncBadgeText}>{fleet.syncQueue.length} queued</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Vendors" value={String(fleet.vendors.length)} />
        <Metric label="Trip money" value={money(totalTripMoney(fleet, selectedVendor?.id))} />
        <Metric label="Pending" value={money(totalExpenses(fleet, selectedVendor?.id, 'pending'))} />
      </View>

      <View style={styles.modeRow}>
        <SegmentButton
          active={role === 'platform'}
          icon={<ShieldCheck color={role === 'platform' ? '#0f172a' : '#cbd5e1'} size={16} />}
          label="Platform"
          onPress={() => onRoleChange('platform')}
        />
        <SegmentButton
          active={role === 'admin'}
          icon={<Users color={role === 'admin' ? '#0f172a' : '#cbd5e1'} size={16} />}
          label="Admin"
          onPress={() => onRoleChange('admin')}
        />
        <SegmentButton
          active={role === 'driver'}
          icon={<Truck color={role === 'driver' ? '#0f172a' : '#cbd5e1'} size={16} />}
          label="Driver"
          onPress={() => onRoleChange('driver')}
        />
      </View>

      <View style={styles.noticeRow}>
        <AlertTriangle color="#fde68a" size={18} />
        <Text style={styles.noticeText}>{notice}</Text>
      </View>

      <Pressable style={styles.syncButton} onPress={onSync}>
        {syncing ? <RefreshCw color="#ffffff" size={18} /> : <Send color="#ffffff" size={18} />}
        <Text style={styles.syncButtonText}>{syncing ? 'Syncing...' : 'Sync live updates'}</Text>
      </Pressable>
    </View>
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

function PlatformWorkspace({
  fleet,
  selectedVendor,
  newVendorForm,
  vendorSettingsForm,
  onNewVendorFormChange,
  onVendorSettingsFormChange,
  onAddVendor,
  onSaveVendorSettings,
  onReset
}: {
  fleet: FleetState;
  selectedVendor?: Vendor;
  newVendorForm: VendorForm;
  vendorSettingsForm: VendorForm;
  onNewVendorFormChange: (form: VendorForm) => void;
  onVendorSettingsFormChange: (form: VendorForm) => void;
  onAddVendor: () => void;
  onSaveVendorSettings: () => void;
  onReset: () => void;
}) {
  const insights = buildPlatformInsights(fleet);

  return (
    <>
      <SectionTitle
        icon={<ShieldCheck color="#0f766e" size={20} />}
        title="Platform owner"
        actionLabel="Reset demo"
        onAction={onReset}
      />

      <View style={styles.summaryGrid}>
        <SummaryTile label="All trip money" value={money(totalTripMoney(fleet))} icon={<DollarSign color="#0f766e" size={20} />} />
        <SummaryTile label="All loans" value={money(totalLoans(fleet))} icon={<FileText color="#2563eb" size={20} />} />
        <SummaryTile label="Pending claims" value={money(totalExpenses(fleet, undefined, 'pending'))} icon={<Receipt color="#be123c" size={20} />} />
      </View>

      <View style={styles.panel}>
        <SectionTitle icon={<Brain color="#7c3aed" size={20} />} title="Platform AI" />
        {insights.map((insight) => <InsightRow key={insight.title} insight={insight} />)}
      </View>

      <View style={styles.panel}>
        <SectionTitle icon={<Plus color="#0f766e" size={20} />} title="Add vendor" />
        <VendorFormFields form={newVendorForm} onChange={onNewVendorFormChange} />
        <ActionButton label="Create vendor" tone="green" icon={<Plus color="#ffffff" size={18} />} onPress={onAddVendor} />
      </View>

      {selectedVendor ? (
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
        <Field label="Primary color" value={form.primaryColor} placeholder="#0f766e" autoCapitalize="none" onChangeText={(primaryColor) => onChange({ ...form, primaryColor })} />
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
  onDecideExpense,
  onDecideMaintenance
}: {
  fleet: FleetState;
  vendor: Vendor;
  vehicleForm: VehicleForm;
  driverForm: DriverForm;
  onVehicleFormChange: (form: VehicleForm) => void;
  onDriverFormChange: (form: DriverForm) => void;
  onAddVehicle: () => void;
  onAddDriver: () => void;
  onDecideExpense: (claimId: string, status: ApprovalStatus) => void;
  onDecideMaintenance: (requestId: string, status: ApprovalStatus) => void;
}) {
  const insights = buildVendorInsights(fleet, vendor);
  const vehicles = vendorVehicles(fleet, vendor.id);
  const drivers = vendorDrivers(fleet, vendor.id);
  const claims = vendorExpenses(fleet, vendor.id);
  const maintenance = vendorMaintenance(fleet, vendor.id);

  return (
    <>
      <SectionTitle icon={<ShieldCheck color={vendor.primaryColor} size={20} />} title={`${vendor.companyName} admin`} />
      <View style={styles.summaryGrid}>
        <SummaryTile label="Trip money" value={money(totalTripMoney(fleet, vendor.id))} icon={<DollarSign color="#0f766e" size={20} />} />
        <SummaryTile label="Approved expenses" value={money(totalExpenses(fleet, vendor.id, 'approved'))} icon={<CheckCircle2 color="#166534" size={20} />} />
        <SummaryTile label="Pending claims" value={money(totalExpenses(fleet, vendor.id, 'pending'))} icon={<Clock color="#d97706" size={20} />} />
        <SummaryTile label="Loan balance" value={money(totalLoans(fleet, vendor.id))} icon={<FileText color="#2563eb" size={20} />} />
      </View>

      <View style={styles.panel}>
        <SectionTitle icon={<Brain color="#7c3aed" size={20} />} title="Vendor AI review" />
        {insights.map((insight) => <InsightRow key={insight.title} insight={insight} />)}
      </View>

      <View style={styles.panel}>
        <SectionTitle icon={<Truck color="#0f766e" size={20} />} title="Add vehicle" />
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
          <Field label="Total cost" value={vehicleForm.totalCost} placeholder="120000" keyboardType="decimal-pad" onChangeText={(totalCost) => onVehicleFormChange({ ...vehicleForm, totalCost })} />
          <Field label="Loan balance" value={vehicleForm.loanBalance} placeholder="75000" keyboardType="decimal-pad" onChangeText={(loanBalance) => onVehicleFormChange({ ...vehicleForm, loanBalance })} />
        </View>
        <Field label="Monthly payment" value={vehicleForm.monthlyPayment} placeholder="2200" keyboardType="decimal-pad" onChangeText={(monthlyPayment) => onVehicleFormChange({ ...vehicleForm, monthlyPayment })} />
        <ActionButton label="Add vehicle to this vendor" tone="green" icon={<Plus color="#ffffff" size={18} />} onPress={onAddVehicle} />
      </View>

      <View style={styles.panel}>
        <SectionTitle icon={<UserPlus color="#2563eb" size={20} />} title="Add driver" />
        <Field label="Driver name" value={driverForm.name} placeholder="Full name" onChangeText={(name) => onDriverFormChange({ ...driverForm, name })} />
        <View style={styles.twoColumn}>
          <Field label="Phone" value={driverForm.phone} placeholder="+1..." keyboardType="phone-pad" onChangeText={(phone) => onDriverFormChange({ ...driverForm, phone })} />
          <Field label="Email" value={driverForm.email} placeholder="driver@email.com" keyboardType="email-address" autoCapitalize="none" onChangeText={(email) => onDriverFormChange({ ...driverForm, email })} />
        </View>
        <Field label="License" value={driverForm.licenseNumber} placeholder="CDL number" autoCapitalize="characters" onChangeText={(licenseNumber) => onDriverFormChange({ ...driverForm, licenseNumber })} />
        <Field label="Address" value={driverForm.address} placeholder="Driver home city/address" onChangeText={(address) => onDriverFormChange({ ...driverForm, address })} />
        <Field label="Emergency contact" value={driverForm.emergencyContact} placeholder="Name and phone" onChangeText={(emergencyContact) => onDriverFormChange({ ...driverForm, emergencyContact })} />
        <VehiclePicker vehicles={vehicles} selectedVehicleId={driverForm.assignedVehicleId || vehicles[0]?.id || ''} onSelect={(assignedVehicleId) => onDriverFormChange({ ...driverForm, assignedVehicleId })} />
        <ActionButton label="Add driver to this vendor" tone="blue" icon={<UserPlus color="#ffffff" size={18} />} onPress={onAddDriver} />
      </View>

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
  onAttachMaintenance
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
}) {
  const drivers = vendorDrivers(fleet, vendor.id);
  const driverTrips = fleet.tripLogs.filter((trip) => trip.driverId === selectedDriverId);
  const driverClaims = fleet.expenseClaims.filter((claim) => claim.driverId === selectedDriverId);
  const approved = driverClaims.filter((claim) => claim.status === 'approved').reduce((sum, claim) => sum + claim.amount, 0);
  const pending = driverClaims.filter((claim) => claim.status === 'pending').reduce((sum, claim) => sum + claim.amount, 0);
  const revenue = driverTrips.reduce((sum, trip) => sum + trip.tripMoney, 0);

  return (
    <>
      <SectionTitle icon={<Truck color={vendor.primaryColor} size={20} />} title={`${vendor.companyName} driver portal`} />

      <View style={styles.driverPicker}>
        {drivers.map((driver) => {
          const vehicle = getAssignedVehicle(fleet, driver);
          const active = driver.id === selectedDriverId;
          return (
            <Pressable key={driver.id} style={[styles.driverChip, active && { borderColor: vendor.primaryColor, backgroundColor: '#ecfdf5' }]} onPress={() => onSelectDriver(driver.id)}>
              <Text style={[styles.driverChipName, active && { color: vendor.primaryColor }]}>{driver.name}</Text>
              <Text style={styles.driverChipTruck}>{vehicle?.unitNumber || 'No truck'} · {vehicle?.make || ''} {vehicle?.model || ''}</Text>
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
            <SummaryTile label="Trip money" value={money(revenue)} icon={<DollarSign color="#0f766e" size={20} />} />
            <SummaryTile label="Approved" value={money(approved)} icon={<CheckCircle2 color="#166534" size={20} />} />
            <SummaryTile label="Pending" value={money(pending)} icon={<Clock color="#d97706" size={20} />} />
          </View>

          <View style={styles.panel}>
            <SectionTitle icon={<MapPin color="#2563eb" size={20} />} title="Add trip log" />
            <View style={styles.twoColumn}>
              <Field label="Start point" value={tripForm.startPoint} placeholder="Dallas, TX" onChangeText={(startPoint) => onTripFormChange({ ...tripForm, startPoint })} />
              <Field label="End point" value={tripForm.endPoint} placeholder="Atlanta, GA" onChangeText={(endPoint) => onTripFormChange({ ...tripForm, endPoint })} />
            </View>
            <View style={styles.twoColumn}>
              <Field label="Start date" value={tripForm.startDate} placeholder="2026-06-13" onChangeText={(startDate) => onTripFormChange({ ...tripForm, startDate })} />
              <Field label="End date" value={tripForm.endDate} placeholder="2026-06-14" onChangeText={(endDate) => onTripFormChange({ ...tripForm, endDate })} />
            </View>
            <Field label="Trip money" value={tripForm.tripMoney} placeholder="2500" keyboardType="decimal-pad" onChangeText={(tripMoney) => onTripFormChange({ ...tripForm, tripMoney })} />
            <Field label="Trip notes" value={tripForm.notes} placeholder="Load number, broker, receiver notes" multiline onChangeText={(notes) => onTripFormChange({ ...tripForm, notes })} />
            <ActionButton label="Submit trip log" tone="blue" icon={<Plus color="#ffffff" size={18} />} onPress={onAddTrip} />
          </View>

          <View style={styles.panel}>
            <SectionTitle icon={<Receipt color="#be123c" size={20} />} title="Claim expense" />
            <OptionPicker label="Expense type" options={vendor.expenseCategories} value={expenseForm.category} onChange={(category) => onExpenseFormChange({ ...expenseForm, category })} />
            <View style={styles.twoColumn}>
              <Field label="Amount" value={expenseForm.amount} placeholder="0.00" keyboardType="decimal-pad" onChangeText={(amount) => onExpenseFormChange({ ...expenseForm, amount })} />
              <Field label="Vendor/place" value={expenseForm.vendorPlace} placeholder="Pilot, toll plaza" onChangeText={(vendorPlace) => onExpenseFormChange({ ...expenseForm, vendorPlace })} />
            </View>
            <Field label="Location" value={expenseForm.location} placeholder="City, state" onChangeText={(location) => onExpenseFormChange({ ...expenseForm, location })} />
            <OptionPicker label="Payment method" options={Object.keys(paymentLabels) as PaymentMethod[]} value={expenseForm.paymentMethod} getLabel={(option) => paymentLabels[option]} onChange={(paymentMethod) => onExpenseFormChange({ ...expenseForm, paymentMethod })} />
            <Field label="Receipt or challan number" value={expenseForm.receiptNumber} placeholder="Receipt, challan, ticket, invoice number" onChangeText={(receiptNumber) => onExpenseFormChange({ ...expenseForm, receiptNumber })} />
            <Field label="Description" value={expenseForm.description} placeholder="What was paid and why" multiline onChangeText={(description) => onExpenseFormChange({ ...expenseForm, description })} />
            <AttachmentBox attachments={expenseForm.attachments} onAttach={onAttachExpense} label="Attach receipt/challan" />
            <ActionButton label="Submit expense for approval" tone="rose" icon={<Upload color="#ffffff" size={18} />} onPress={onAddExpense} />
          </View>

          <View style={styles.panel}>
            <SectionTitle icon={<Wrench color="#d97706" size={20} />} title="Maintenance request" />
            <OptionPicker label="Service type" options={vendor.maintenanceTypes} value={maintenanceForm.serviceType} onChange={(serviceType) => onMaintenanceFormChange({ ...maintenanceForm, serviceType })} />
            <View style={styles.twoColumn}>
              <Field label="Odometer" value={maintenanceForm.odometer} placeholder={String(selectedVehicle.mileage)} keyboardType="numeric" onChangeText={(odometer) => onMaintenanceFormChange({ ...maintenanceForm, odometer })} />
              <Field label="Estimate" value={maintenanceForm.estimatedCost} placeholder="450" keyboardType="decimal-pad" onChangeText={(estimatedCost) => onMaintenanceFormChange({ ...maintenanceForm, estimatedCost })} />
            </View>
            <Field label="Shop name" value={maintenanceForm.shopName} placeholder="Shop or mechanic" onChangeText={(shopName) => onMaintenanceFormChange({ ...maintenanceForm, shopName })} />
            <Field label="Issue" value={maintenanceForm.issue} placeholder="Explain maintenance need" multiline onChangeText={(issue) => onMaintenanceFormChange({ ...maintenanceForm, issue })} />
            <AttachmentBox attachments={maintenanceForm.attachments} onAttach={onAttachMaintenance} label="Attach quote/invoice" />
            <ActionButton label="Submit maintenance request" tone="amber" icon={<Wrench color="#ffffff" size={18} />} onPress={onAddMaintenance} />
          </View>

          <View style={styles.panel}>
            <SectionTitle icon={<FileText color="#2563eb" size={20} />} title="My records" />
            {driverTrips.slice(0, 4).map((trip) => (
              <RecordRow key={trip.id} icon={<MapPin color="#2563eb" size={18} />} title={`${trip.startPoint} to ${trip.endPoint}`} detail={`${money(trip.tripMoney)} · ${trip.startDate || 'Start'} to ${trip.endDate || 'Open'}`} right={formatDate(trip.createdAt)} />
            ))}
            {driverClaims.slice(0, 5).map((claim) => (
              <RecordRow key={claim.id} icon={<Receipt color="#be123c" size={18} />} title={`${claim.category} · ${money(claim.amount)}`} detail={`${claim.vendorPlace} · ${claim.receiptNumber || 'No receipt number'} · ${claim.attachments.length} file(s)`} right={claim.status} />
            ))}
          </View>
        </>
      ) : (
        <EmptyState text="This vendor needs at least one driver and assigned vehicle." />
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
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
  return (
    <View style={styles.summaryTile}>
      <View style={styles.summaryIcon}>{icon}</View>
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  const color = insight.tone === 'good' ? '#0f766e' : insight.tone === 'warning' ? '#d97706' : '#be123c';

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
  onChangeText
}: {
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
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
        <Paperclip color="#0f766e" size={18} />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef4f1'
  },
  keyboard: {
    flex: 1
  },
  scrollContent: {
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
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)'
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'
  },
  brandCopy: {
    flex: 1
  },
  eyebrow: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  title: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '900'
  },
  syncBadge: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6
  },
  syncBadgeText: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '900'
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18
  },
  metric: {
    flex: 1,
    minHeight: 68,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    padding: 11,
    justifyContent: 'center'
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900'
  },
  metricLabel: {
    marginTop: 3,
    color: '#dbeafe',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: 8,
    padding: 4,
    marginTop: 16,
    gap: 4
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6
  },
  segmentActive: {
    backgroundColor: '#f8fafc'
  },
  segmentText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '900'
  },
  segmentTextActive: {
    color: '#0f172a'
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
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textButtonLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900'
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbe4df',
    padding: 14,
    gap: 12
  },
  summaryGrid: {
    gap: 10
  },
  summaryTile: {
    minHeight: 92,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbe4df',
    padding: 14,
    justifyContent: 'center'
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    marginBottom: 8
  },
  summaryValue: {
    color: '#0f172a',
    fontSize: 20,
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
    gap: 10
  },
  field: {
    flex: 1,
    gap: 6
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700'
  },
  inputMultiline: {
    minHeight: 78,
    textAlignVertical: 'top'
  },
  optionRow: {
    gap: 8
  },
  optionChip: {
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionChipActive: {
    borderColor: '#0f766e',
    backgroundColor: '#ccfbf1'
  },
  optionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900'
  },
  optionTextActive: {
    color: '#0f766e'
  },
  vendorChip: {
    minHeight: 66,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbe4df',
    backgroundColor: '#ffffff',
    padding: 10,
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
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0'
  },
  toggleBoxOn: {
    backgroundColor: '#ccfbf1'
  },
  toggleText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900'
  },
  toggleTextOn: {
    color: '#0f766e'
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10
  },
  actionGreen: {
    backgroundColor: '#0f766e'
  },
  actionBlue: {
    backgroundColor: '#2563eb'
  },
  actionAmber: {
    backgroundColor: '#d97706'
  },
  actionRose: {
    backgroundColor: '#be123c'
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
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe4df',
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
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
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
    fontSize: 20,
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
    color: '#7c3aed',
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
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 9,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5
  },
  factText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800'
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8
  },
  smallButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6
  },
  smallGreen: {
    backgroundColor: '#0f766e'
  },
  smallRed: {
    backgroundColor: '#be123c'
  },
  smallButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900'
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
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
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    padding: 12,
    gap: 8
  },
  attachButton: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  attachButtonText: {
    color: '#0f766e',
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9'
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
    minHeight: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  }
});
