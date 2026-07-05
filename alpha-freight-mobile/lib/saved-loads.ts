import * as SecureStore from "expo-secure-store";

const SAVED_LOADS_KEY = "alpha_carrier_saved_loads";

async function readIds(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(SAVED_LOADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

async function writeIds(ids: string[]) {
  await SecureStore.setItemAsync(SAVED_LOADS_KEY, JSON.stringify(ids));
}

export async function getSavedLoadIds(): Promise<string[]> {
  return readIds();
}

export async function isLoadSaved(loadId: string): Promise<boolean> {
  const ids = await readIds();
  return ids.includes(loadId);
}

export async function toggleSavedLoad(loadId: string): Promise<boolean> {
  const ids = await readIds();
  const exists = ids.includes(loadId);
  const next = exists ? ids.filter((id) => id !== loadId) : [...ids, loadId];
  await writeIds(next);
  return !exists;
}

export async function removeSavedLoad(loadId: string) {
  const ids = await readIds();
  await writeIds(ids.filter((id) => id !== loadId));
}
