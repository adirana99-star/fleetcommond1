import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialFleetState } from '../data/sampleFleet';
import { FleetState } from '../types';

const STORAGE_KEY = '@fleet-command/state/v3';

export async function loadFleetState(): Promise<FleetState> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return initialFleetState;
  }

  try {
    const parsed = JSON.parse(saved) as FleetState;
    return {
      ...initialFleetState,
      ...parsed,
      vendors: parsed.vendors?.length ? parsed.vendors : initialFleetState.vendors,
      drivers: parsed.drivers?.length ? parsed.drivers : initialFleetState.drivers,
      vehicles: parsed.vehicles?.length ? parsed.vehicles : initialFleetState.vehicles,
      tripLogs: parsed.tripLogs || [],
      expenseClaims: parsed.expenseClaims || [],
      maintenanceRequests: parsed.maintenanceRequests || [],
      syncQueue: parsed.syncQueue || []
    };
  } catch {
    return initialFleetState;
  }
}

export async function saveFleetState(state: FleetState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function resetFleetState(): Promise<FleetState> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialFleetState));
  return initialFleetState;
}
