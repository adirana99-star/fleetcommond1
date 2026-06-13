# Run FleetCommand Multi-Vendor

## 1. Install dependencies

Open a terminal in this folder and run:

```powershell
npm.cmd install
```

## 2. Start the app

```powershell
npm.cmd start
```

Scan the QR code with Expo Go on iPhone or Android.

## Android emulator

```powershell
npm.cmd run android
```

## iPhone

On Windows, use Expo Go on an iPhone. The iOS simulator requires macOS and Xcode.

## Production builds

```powershell
npm.cmd run build:android:production
npm.cmd run build:ios:production
```

Before publishing, connect the production backend in `.env`:

```text
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_API_BASE_URL=https://api.yourcompany.com
```
