import { environment } from '../config/environment';

type BackendLoginRole = 'platform' | 'admin' | 'driver';

interface AdminVendorIdentity {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
}

interface DriverIdentity {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
}

export interface BackendLoginResult {
  ok: boolean;
  token: string;
  role: BackendLoginRole;
  vendor?: AdminVendorIdentity;
  driver?: DriverIdentity;
}

export async function loginWithBackend(params: {
  role: BackendLoginRole;
  phone?: string;
  password?: string;
}): Promise<BackendLoginResult> {
  if (!environment.apiBaseUrl) {
    throw new Error('Live API is not configured.');
  }

  const response = await fetch(`${environment.apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.message || `Login failed with status ${response.status}.`);
  }

  return body as BackendLoginResult;
}
