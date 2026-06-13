import { environment } from '../config/environment';
import { SyncQueueItem } from '../types';

interface SyncResult {
  ok: boolean;
  skipped: boolean;
  message: string;
}

export async function syncFleetChanges(queue: SyncQueueItem[]): Promise<SyncResult> {
  if (queue.length === 0) {
    return {
      ok: true,
      skipped: false,
      message: 'Everything is already synced.'
    };
  }

  if (!environment.apiBaseUrl) {
    return {
      ok: false,
      skipped: true,
      message: 'Live API is not configured yet. Updates are safely saved on this device.'
    };
  }

  const response = await fetch(`${environment.apiBaseUrl}/fleet/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceTime: new Date().toISOString(),
      changes: queue
    })
  });

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      message: `Sync failed with status ${response.status}.`
    };
  }

  return {
    ok: true,
    skipped: false,
    message: 'Live sync completed.'
  };
}
