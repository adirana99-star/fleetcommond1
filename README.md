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
