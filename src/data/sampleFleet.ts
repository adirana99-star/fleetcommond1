import { FleetState } from '../types';

const now = Date.now();
const hour = 1000 * 60 * 60;

export const initialFleetState: FleetState = {
  vendors: [
    {
      id: 'vendor-northstar',
      companyName: 'Northstar Freight LLC',
      ownerName: 'Amandeep Singh',
      phone: '+1 (555) 210-4100',
      email: 'admin@northstarfreight.com',
      logoText: 'NS',
      primaryColor: '#2563eb',
      accentColor: '#2563eb',
      subscriptionPlan: 'Enterprise',
      status: 'active',
      approvalLimit: 500,
      requireReceiptProof: true,
      expenseCategories: ['Toll', 'Fuel', 'Challan', 'Parking', 'Repair', 'Scale ticket', 'Other'],
      maintenanceTypes: ['Oil change', 'Tire', 'Brake', 'Inspection', 'Engine repair', 'Trailer repair'],
      createdAt: new Date(now - hour * 24 * 20).toISOString()
    },
    {
      id: 'vendor-riverbend',
      companyName: 'Riverbend Logistics',
      ownerName: 'Maria Lopez',
      phone: '+1 (555) 310-8122',
      email: 'ops@riverbendlogistics.com',
      logoText: 'RL',
      primaryColor: '#7c3aed',
      accentColor: '#be123c',
      subscriptionPlan: 'Growth',
      status: 'trial',
      approvalLimit: 250,
      requireReceiptProof: true,
      expenseCategories: ['Fuel', 'Toll', 'Lumpar', 'Detention', 'Washout', 'Other'],
      maintenanceTypes: ['DOT inspection', 'Reefer service', 'Tire', 'Brake', 'Trailer washout'],
      createdAt: new Date(now - hour * 24 * 7).toISOString()
    }
  ],
  drivers: [
    {
      id: 'driver-101',
      vendorId: 'vendor-northstar',
      name: 'Amandeep Singh',
      phone: '+1 (555) 410-0188',
      email: 'amandeep@example.com',
      licenseNumber: 'CDL-A 84219',
      address: 'Dallas, TX',
      emergencyContact: 'Harpreet Singh +1 (555) 777-1020',
      assignedVehicleId: 'vehicle-12',
      active: true
    },
    {
      id: 'driver-102',
      vendorId: 'vendor-northstar',
      name: 'Maria Lopez',
      phone: '+1 (555) 410-0192',
      email: 'maria@example.com',
      licenseNumber: 'CDL-A 77801',
      address: 'Fort Worth, TX',
      emergencyContact: 'Elena Lopez +1 (555) 777-1071',
      assignedVehicleId: 'vehicle-18',
      active: true
    },
    {
      id: 'driver-201',
      vendorId: 'vendor-riverbend',
      name: 'Derek Williams',
      phone: '+1 (555) 410-0141',
      email: 'derek@example.com',
      licenseNumber: 'CDL-A 69220',
      address: 'Irving, TX',
      emergencyContact: 'Jada Williams +1 (555) 777-1139',
      assignedVehicleId: 'vehicle-31',
      active: true
    }
  ],
  vehicles: [
    {
      id: 'vehicle-12',
      vendorId: 'vendor-northstar',
      unitNumber: 'NS-12',
      make: 'Freightliner',
      model: 'Cascadia',
      year: '2021',
      vin: '1FUJGLDR1ELFD9021',
      plate: 'TX 7KX-214',
      mileage: 248932,
      boughtDate: '2023-02-10',
      totalCost: 129000,
      loanBalance: 84300,
      monthlyPayment: 2450,
      active: true
    },
    {
      id: 'vehicle-18',
      vendorId: 'vendor-northstar',
      unitNumber: 'NS-18',
      make: 'Peterbilt',
      model: '579',
      year: '2020',
      vin: '3HSDJAPR8FN721882',
      plate: 'TX 4NL-672',
      mileage: 192414,
      boughtDate: '2022-10-18',
      totalCost: 117500,
      loanBalance: 56200,
      monthlyPayment: 2195,
      active: true
    },
    {
      id: 'vehicle-31',
      vendorId: 'vendor-riverbend',
      unitNumber: 'RB-31',
      make: 'Kenworth',
      model: 'T680',
      year: '2019',
      vin: '1XKYD49X5HJ165902',
      plate: 'TX 9CP-084',
      mileage: 314802,
      boughtDate: '2021-06-04',
      totalCost: 106000,
      loanBalance: 31800,
      monthlyPayment: 1880,
      active: true
    }
  ],
  tripLogs: [
    {
      id: 'trip-501',
      vendorId: 'vendor-northstar',
      driverId: 'driver-101',
      vehicleId: 'vehicle-12',
      startPoint: 'Dallas, TX',
      endPoint: 'Atlanta, GA',
      startDate: '2026-06-09',
      endDate: '2026-06-11',
      tripMoney: 2850,
      notes: 'Dry van load delivered on time.',
      createdAt: new Date(now - hour * 24).toISOString(),
      syncStatus: 'synced'
    },
    {
      id: 'trip-601',
      vendorId: 'vendor-riverbend',
      driverId: 'driver-201',
      vehicleId: 'vehicle-31',
      startPoint: 'Houston, TX',
      endPoint: 'Chicago, IL',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      tripMoney: 3325,
      notes: 'Receiver requested early check-in.',
      createdAt: new Date(now - hour * 8).toISOString(),
      syncStatus: 'synced'
    }
  ],
  expenseClaims: [
    {
      id: 'expense-701',
      vendorId: 'vendor-northstar',
      driverId: 'driver-101',
      vehicleId: 'vehicle-12',
      tripId: 'trip-501',
      category: 'Toll',
      amount: 42.75,
      vendorPlace: 'I-75 Express',
      location: 'Atlanta, GA',
      paymentMethod: 'driver_paid',
      receiptNumber: 'EZP-84019',
      description: 'Toll charge with transponder record.',
      attachments: [
        {
          id: 'attach-1',
          name: 'EZP-84019 receipt.pdf',
          uri: 'demo://receipt/EZP-84019',
          mimeType: 'application/pdf'
        }
      ],
      status: 'pending',
      submittedAt: new Date(now - hour * 20).toISOString(),
      syncStatus: 'synced'
    },
    {
      id: 'expense-801',
      vendorId: 'vendor-riverbend',
      driverId: 'driver-201',
      vehicleId: 'vehicle-31',
      tripId: 'trip-601',
      category: 'Fuel',
      amount: 486.2,
      vendorPlace: 'Pilot Flying J',
      location: 'Memphis, TN',
      paymentMethod: 'fuel_card',
      receiptNumber: 'PFJ-22418',
      description: 'Fuel stop before Nashville.',
      attachments: [],
      status: 'approved',
      submittedAt: new Date(now - hour * 5).toISOString(),
      decidedAt: new Date(now - hour * 3).toISOString(),
      decidedBy: 'Vendor Admin',
      adminNote: 'Fuel card matched.',
      syncStatus: 'synced'
    }
  ],
  maintenanceRequests: [
    {
      id: 'maint-901',
      vendorId: 'vendor-northstar',
      driverId: 'driver-102',
      vehicleId: 'vehicle-18',
      odometer: 192414,
      serviceType: 'Oil change',
      issue: 'Preventive maintenance due after latest trip.',
      estimatedCost: 420,
      shopName: 'TA Service Center',
      attachments: [],
      status: 'pending',
      submittedAt: new Date(now - 1000 * 60 * 45).toISOString(),
      syncStatus: 'synced'
    }
  ],
  salaryPayments: [
    {
      id: 'salary-1001',
      vendorId: 'vendor-northstar',
      driverId: 'driver-101',
      vehicleId: 'vehicle-12',
      amount: 900,
      paymentDate: '2026-06-15',
      paymentMode: 'cash',
      note: 'Weekly settlement',
      createdAt: new Date(now - hour * 12).toISOString(),
      syncStatus: 'synced'
    }
  ],
  syncQueue: [],
  lastSyncedAt: new Date(now - 1000 * 60 * 35).toISOString()
};
