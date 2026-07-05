import * as SecureStore from "expo-secure-store";

const PIN_PREFIX = "alpha_freight_pin_";
const PIN_SETUP_PENDING_KEY = "alpha_freight_pin_setup_pending";

function pinStorageKey(userId: string) {
  return `${PIN_PREFIX}${userId}`;
}

function hashPin(pin: string, userId: string) {
  const raw = `${userId}::${pin}::alpha_freight_v1`;
  let hash = 5381;

  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }

  return (hash >>> 0).toString(16);
}

export async function hasPinForUser(userId: string) {
  try {
    const value = await SecureStore.getItemAsync(pinStorageKey(userId));
    return Boolean(value);
  } catch {
    return false;
  }
}

export async function savePinForUser(userId: string, pin: string) {
  const hash = hashPin(pin, userId);
  await SecureStore.setItemAsync(pinStorageKey(userId), hash, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function verifyPinForUser(userId: string, pin: string) {
  try {
    const stored = await SecureStore.getItemAsync(pinStorageKey(userId));
    if (!stored) return false;
    return stored === hashPin(pin, userId);
  } catch {
    return false;
  }
}

export async function clearPinForUser(userId: string) {
  try {
    await SecureStore.deleteItemAsync(pinStorageKey(userId));
  } catch {
    // ignore storage errors
  }
}

export async function markPinSetupPending() {
  try {
    await SecureStore.setItemAsync(PIN_SETUP_PENDING_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

export async function clearPinSetupPending() {
  try {
    await SecureStore.deleteItemAsync(PIN_SETUP_PENDING_KEY);
  } catch {
    // ignore storage errors
  }
}

export async function isPinSetupPending() {
  try {
    return (await SecureStore.getItemAsync(PIN_SETUP_PENDING_KEY)) === "1";
  } catch {
    return false;
  }
}

export const PIN_LENGTH = 5;
