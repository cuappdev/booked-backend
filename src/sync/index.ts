import { syncLibraries } from "./libraries";
import { syncRooms } from "./rooms";

const SYNC_INTERVAL_MS = 60 * 60 * 1000;

let syncing = false;

// Libraries and rooms sync independently, so one failing still refreshes the other.
async function syncStep(name: string, step: () => Promise<number>): Promise<void> {
  try {
    const count = await step();
    console.log(`Synced ${count} ${name} from Cornell.`);
  } catch (error: unknown) {
    console.error(`Failed to sync ${name} from Cornell:`, error);
  }
}

export async function syncAll(): Promise<void> {
  if (syncing) {
    return;
  }
  syncing = true;
  try {
    await syncStep("libraries", syncLibraries);
    await syncStep("rooms", syncRooms);
  } finally {
    syncing = false;
  }
}

// Syncs now, then once an hour.
export function scheduleSync(): void {
  void syncAll();
  setInterval(() => void syncAll(), SYNC_INTERVAL_MS);
}
