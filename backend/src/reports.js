const {
  Vendor,
  Driver,
  Vehicle,
  TripLog,
  ExpenseClaim,
  MaintenanceRequest,
  SalaryPayment
} = require('./models');

async function listVendors(_req, res) {
  const vendors = await Vendor.find({}).sort({ companyName: 1 }).lean();
  return res.json({ ok: true, count: vendors.length, vendors });
}

async function listVendorData(req, res) {
  const { vendorId } = req.params;

  const [drivers, vehicles] = await Promise.all([
    Driver.find({ vendorId }).sort({ name: 1 }).lean(),
    Vehicle.find({ vendorId }).sort({ unitNumber: 1 }).lean()
  ]);

  return res.json({
    ok: true,
    vendorId,
    drivers,
    vehicles
  });
}

async function vendorExpenses(req, res) {
  const { vendorId } = req.params;
  const { driverId, vehicleId, type } = req.query;

  const claimFilter = { vendorId };
  const maintenanceFilter = { vendorId };
  const salaryFilter = { vendorId };

  if (driverId) {
    claimFilter.driverId = driverId;
    maintenanceFilter.driverId = driverId;
    salaryFilter.driverId = driverId;
  }

  if (vehicleId) {
    claimFilter.vehicleId = vehicleId;
    maintenanceFilter.vehicleId = vehicleId;
    salaryFilter.vehicleId = vehicleId;
  }

  if (type === 'claims') {
    const claims = await ExpenseClaim.find(claimFilter).sort({ submittedAt: -1 }).lean();
    return res.json({ ok: true, type, count: claims.length, claims });
  }

  if (type === 'maintenance') {
    const maintenance = await MaintenanceRequest.find(maintenanceFilter).sort({ submittedAt: -1 }).lean();
    return res.json({ ok: true, type, count: maintenance.length, maintenance });
  }

  if (type === 'salary') {
    const salaryPayments = await SalaryPayment.find(salaryFilter).sort({ paymentDate: -1 }).lean();
    return res.json({ ok: true, type, count: salaryPayments.length, salaryPayments });
  }

  const [claims, maintenance, salaryPayments] = await Promise.all([
    ExpenseClaim.find(claimFilter).sort({ submittedAt: -1 }).lean(),
    MaintenanceRequest.find(maintenanceFilter).sort({ submittedAt: -1 }).lean(),
    SalaryPayment.find(salaryFilter).sort({ paymentDate: -1 }).lean()
  ]);

  return res.json({
    ok: true,
    count: claims.length + maintenance.length + salaryPayments.length,
    claims,
    maintenance,
    salaryPayments
  });
}

async function vendorSummary(req, res) {
  const { vendorId } = req.params;

  const [tripLogs, claims, maintenance, salaryPayments] = await Promise.all([
    TripLog.find({ vendorId }).lean(),
    ExpenseClaim.find({ vendorId }).lean(),
    MaintenanceRequest.find({ vendorId }).lean(),
    SalaryPayment.find({ vendorId }).lean()
  ]);

  const income = tripLogs.reduce((sum, item) => sum + (item.tripMoney || 0), 0);
  const claimExpense = claims.reduce((sum, item) => sum + (item.amount || 0), 0);
  const maintenanceExpense = maintenance.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const salaryExpense = salaryPayments.reduce((sum, item) => sum + (item.amount || 0), 0);
  const grossExpense = claimExpense + maintenanceExpense + salaryExpense;

  return res.json({
    ok: true,
    vendorId,
    summary: {
      income,
      claimExpense,
      maintenanceExpense,
      salaryExpense,
      grossExpense,
      net: income - grossExpense,
      tripCount: tripLogs.length,
      claimCount: claims.length,
      maintenanceCount: maintenance.length,
      salaryCount: salaryPayments.length
    }
  });
}

async function driverData(req, res) {
  const { driverId } = req.params;

  const [driver, trips, claims, maintenance, salaryPayments] = await Promise.all([
    Driver.findOne({ id: driverId }).lean(),
    TripLog.find({ driverId }).sort({ createdAt: -1 }).lean(),
    ExpenseClaim.find({ driverId }).sort({ submittedAt: -1 }).lean(),
    MaintenanceRequest.find({ driverId }).sort({ submittedAt: -1 }).lean(),
    SalaryPayment.find({ driverId }).sort({ paymentDate: -1 }).lean()
  ]);

  if (!driver) {
    return res.status(404).json({ ok: false, message: 'Driver not found' });
  }

  return res.json({
    ok: true,
    driver,
    trips,
    claims,
    maintenance,
    salaryPayments
  });
}

async function driverSummary(req, res) {
  const { driverId } = req.params;

  const [driver, trips, claims, maintenance, salaryPayments] = await Promise.all([
    Driver.findOne({ id: driverId }).lean(),
    TripLog.find({ driverId }).lean(),
    ExpenseClaim.find({ driverId }).lean(),
    MaintenanceRequest.find({ driverId }).lean(),
    SalaryPayment.find({ driverId }).lean()
  ]);

  if (!driver) {
    return res.status(404).json({ ok: false, message: 'Driver not found' });
  }

  const income = trips.reduce((sum, item) => sum + (item.tripMoney || 0), 0);
  const claimExpense = claims.reduce((sum, item) => sum + (item.amount || 0), 0);
  const maintenanceExpense = maintenance.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const salaryExpense = salaryPayments.reduce((sum, item) => sum + (item.amount || 0), 0);
  const grossExpense = claimExpense + maintenanceExpense + salaryExpense;

  return res.json({
    ok: true,
    driver: {
      id: driver.id,
      vendorId: driver.vendorId,
      name: driver.name,
      assignedVehicleId: driver.assignedVehicleId
    },
    summary: {
      income,
      claimExpense,
      maintenanceExpense,
      salaryExpense,
      grossExpense,
      net: income - grossExpense,
      tripCount: trips.length,
      claimCount: claims.length,
      maintenanceCount: maintenance.length,
      salaryCount: salaryPayments.length
    }
  });
}

module.exports = {
  listVendors,
  listVendorData,
  vendorExpenses,
  vendorSummary,
  driverData,
  driverSummary
};
