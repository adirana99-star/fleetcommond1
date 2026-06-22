# FleetCommand Enterprise

FleetCommand Enterprise is a single cross-platform iOS and Android app that can serve many trucking vendors. It is built as a multi-vendor white-label fleet platform: one app, many companies, each with their own drivers, vehicles, expenses, rules, and branding.

## App Roles

- **Platform Owner**: creates vendors, manages each vendor's branding, approval limits, required proof rules, expense categories, maintenance categories, plan, and account status.
- **Vendor Admin**: manages only that vendor's vehicles, drivers, trip money, expenses, maintenance, approvals, and reports.
- **Driver**: sees only the selected vendor's driver portal and can submit trip logs, expenses, receipt/challan proof, and maintenance requests.

Every business record includes a `vendorId`, so each vendor's data stays separated inside the same app.

## Vendor Customization

Each vendor can have:

- Company name, owner, phone, and email.
- Logo initials and app theme colors.
- Subscription plan and vendor status.
- Expense approval limit.
- Required receipt/challan proof setting.
- Custom expense categories such as Toll, Fuel, Challan, Lumpar, Scale ticket, Parking, Repair, or any vendor-specific label.
- Custom maintenance types such as Oil change, Tire, Brake, DOT inspection, Reefer service, or Trailer repair.

## Included Fleet Features

- Vehicle records: unit number, make, model, year, VIN, plate, mileage, bought date, total cost, loan balance, and monthly payment.
- Driver records: name, phone, email, CDL/license, address, emergency contact, and assigned vehicle.
- Driver trip logs: start point, end point, dates, trip money, and notes.
- Expense claims: vendor-defined categories with amount, place, location, payment method, receipt/challan number, description, and file attachments.
- Receipt/challan attachment support for images or PDFs.
- Maintenance request workflow with estimate, shop, odometer, attachment, and admin decision.
- Admin approval/rejection for expenses and maintenance.
- AI-style review panels for the platform owner and each vendor admin.
- Offline-first local storage with queued live sync.
- EAS profiles for production iOS and Android builds.

## AI Features Included

The app includes local AI-style business checks:

- Flags claims missing receipt/challan proof.
- Flags claims above the vendor approval limit.
- Highlights pending maintenance work.
- Highlights high-mileage vehicles.
- Shows profit signal based on trip money minus approved expenses.
- Shows platform-level vendor health signals.

These are rule-based now. They can later be connected to a real AI backend for receipt OCR, fraud checks, driver scorecards, and automated report summaries.

## Run Locally

```bash
npm install
npm start
```

Open Expo Go on your phone and scan the QR code.

Android emulator:

```bash
npm run android
```

iOS simulator requires macOS and Xcode:

```bash
npm run ios
```

## Configure Live Production

Create a `.env` file:

```bash
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_API_BASE_URL=https://api.yourcompany.com
```

Queued updates are sent to:

```text
POST https://api.yourcompany.com/fleet/sync
```

Expected request shape:

```json
{
  "deviceTime": "2026-06-13T10:30:00.000Z",
  "changes": [
    {
      "id": "queue-item-id",
      "entity": "expense_claim",
      "operation": "create",
      "payload": {
        "vendorId": "vendor-northstar"
      }
    }
  ]
}
```

For production receipt/challan uploads, connect attachments to backend file storage such as S3, Firebase Storage, Supabase Storage, or your own API.

## MongoDB Backend (New)

This workspace now includes a backend service in [backend/package.json](backend/package.json) using:

- Express API
- Mongoose + MongoDB (Atlas or local)
- Sync endpoint compatible with app queue: `POST /fleet/sync`

### 1) Configure backend env

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
PORT=4000
CORS_ORIGIN=http://localhost:8084
```

### 2) Install and run backend

```bash
cd backend
npm install
npm run dev
```

Or from root:

```bash
npm run backend:dev
```

### 2.1) Configure auth env

Add these values in `backend/.env`:

```bash
JWT_SECRET=replace-with-strong-random-secret
JWT_EXPIRES_IN=7d
PLATFORM_PASSWORD_HASH=<sha256-platform-password>
REQUIRE_AUTH_FOR_SYNC=false
```

Generate password hash (PowerShell example):

```powershell
[BitConverter]::ToString((New-Object Security.Cryptography.SHA256Managed).ComputeHash([Text.Encoding]::UTF8.GetBytes("your-password"))).Replace("-","").ToLower()
```

### 3) Point app to local backend

Create or update root `.env`:

```bash
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

Then restart Expo:

```bash
npm start
```

When `EXPO_PUBLIC_API_BASE_URL` is set, platform/admin/driver login in app uses backend auth (`POST /auth/login`) and sync requests include bearer token automatically.

### 4) Health check

```text
GET http://localhost:4000/health
```

### 5) New API endpoints

Auth:

```text
POST /auth/login
```

Body for platform:

```json
{
  "role": "platform",
  "password": "your-platform-password"
}
```

Body for vendor admin:

```json
{
  "role": "admin",
  "phone": "+1...",
  "password": "vendor-admin-password"
}
```

Body for driver:

```json
{
  "role": "driver",
  "phone": "+1..."
}
```

Reporting (Bearer token required):

```text
GET /fleet/vendors
GET /fleet/vendors/:vendorId/data
GET /fleet/vendors/:vendorId/summary
GET /fleet/vendors/:vendorId/expenses?driverId=&vehicleId=&type=claims|maintenance|salary
GET /fleet/drivers/:driverId/data
GET /fleet/drivers/:driverId/summary
```

### Notes

- Mobile emulator/device cannot use `localhost` of your PC directly.
- For physical device testing, use your machine LAN IP (for example `http://192.168.1.10:4000`) and set `CORS_ORIGIN` accordingly.
- `POST /fleet/sync` supports entities already used by app queue: `vendor`, `driver`, `vehicle`, `trip_log`, `expense_claim`, `maintenance_request`, `salary_payment`.
- `POST /fleet/sync` can be protected by setting `REQUIRE_AUTH_FOR_SYNC=true`.

## Production Checklist

- Replace `com.yourcompany.fleetcommand` in `app.config.js` with your company bundle/package identifier.
- Replace placeholder icon and splash art with final company branding.
- Add secure login with role-based access: platform owner, vendor admin, driver.
- Enforce vendor isolation on the backend using `vendorId`.
- Implement `POST /fleet/sync`.
- Store receipt/challan files in production file storage.
- Publish Android and iOS builds using EAS.

Build commands:

```bash
npm run build:android:production
npm run build:ios:production
```
