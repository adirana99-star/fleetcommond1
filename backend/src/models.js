const mongoose = require('mongoose');

const baseOptions = {
  strict: false,
  minimize: false,
  timestamps: true
};

function schemaWithAppId(extraShape) {
  return new mongoose.Schema(
    Object.assign({
      id: { type: String, required: true },
      vendorId: { type: String, index: true }
    }, extraShape || {}),
    baseOptions
  );
}

const vendorSchema = schemaWithAppId({
  companyName: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true },
  status: { type: String, enum: ['trial', 'active', 'paused'], default: 'trial' },
  adminPasswordHash: { type: String, default: '' }
});

const driverSchema = schemaWithAppId({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  assignedVehicleId: { type: String, default: '' },
  active: { type: Boolean, default: true }
});

const vehicleSchema = schemaWithAppId({
  unitNumber: { type: String, required: true, trim: true },
  make: { type: String, default: '' },
  model: { type: String, default: '' },
  active: { type: Boolean, default: true }
});

const tripLogSchema = schemaWithAppId({
  driverId: { type: String, required: true, index: true },
  vehicleId: { type: String, required: true, index: true },
  tripMoney: { type: Number, required: true, min: 0, default: 0 },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' }
});

const expenseClaimSchema = schemaWithAppId({
  driverId: { type: String, required: true, index: true },
  vehicleId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0, default: 0 },
  category: { type: String, default: 'Other' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: String, default: '' }
});

const maintenanceRequestSchema = schemaWithAppId({
  driverId: { type: String, required: true, index: true },
  vehicleId: { type: String, required: true, index: true },
  estimatedCost: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: String, default: '' }
});

const salaryPaymentSchema = schemaWithAppId({
  driverId: { type: String, required: true, index: true },
  vehicleId: { type: String, index: true },
  amount: { type: Number, required: true, min: 0, default: 0 },
  paymentDate: { type: String, required: true },
  paymentMode: { type: String, enum: ['cash', 'paytm', 'bank_transfer', 'upi', 'other'], default: 'cash' }
});

vendorSchema.index({ id: 1 }, { unique: true });
vendorSchema.index({ phone: 1 }, { unique: true });
driverSchema.index({ id: 1 }, { unique: true });
driverSchema.index({ vendorId: 1, phone: 1 });
vehicleSchema.index({ id: 1 }, { unique: true });
vehicleSchema.index({ vendorId: 1, unitNumber: 1 });
tripLogSchema.index({ id: 1 }, { unique: true });
tripLogSchema.index({ vendorId: 1, driverId: 1, vehicleId: 1, createdAt: -1 });
expenseClaimSchema.index({ id: 1 }, { unique: true });
expenseClaimSchema.index({ vendorId: 1, driverId: 1, vehicleId: 1, submittedAt: -1 });
maintenanceRequestSchema.index({ id: 1 }, { unique: true });
maintenanceRequestSchema.index({ vendorId: 1, driverId: 1, vehicleId: 1, submittedAt: -1 });
salaryPaymentSchema.index({ id: 1 }, { unique: true });
salaryPaymentSchema.index({ vendorId: 1, driverId: 1, vehicleId: 1, paymentDate: -1 });

const Vendor = mongoose.model('Vendor', vendorSchema);
const Driver = mongoose.model('Driver', driverSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const TripLog = mongoose.model('TripLog', tripLogSchema);
const ExpenseClaim = mongoose.model('ExpenseClaim', expenseClaimSchema);
const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
const SalaryPayment = mongoose.model('SalaryPayment', salaryPaymentSchema);

const modelByEntity = {
  vendor: Vendor,
  driver: Driver,
  vehicle: Vehicle,
  trip_log: TripLog,
  expense_claim: ExpenseClaim,
  maintenance_request: MaintenanceRequest,
  salary_payment: SalaryPayment
};

module.exports = {
  Vendor,
  Driver,
  Vehicle,
  TripLog,
  ExpenseClaim,
  MaintenanceRequest,
  SalaryPayment,
  modelByEntity
};
