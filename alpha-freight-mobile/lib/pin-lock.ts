import * as SecureStore from "expo-secure-store";
import { supabase } from "@/lib/supabase";

const PIN_PREFIX = "alpha_freight_pin_";
const PIN_SETUP_PENDING_KEY = "alpha_freight_pin_setup_pending";

function pinStorageKey(userId: string) {
  return `${PIN_PREFIX}${userId}`;
}

export function hashPin(pin: string, userId: string) {
  const raw = `${userId}::${pin}::alpha_freight_v1`;
  let hash = 5381;

  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }

  return (hash >>> 0).toString(16);
}

function isMissingPinStorageError(message: string) {
  return /app_pin_hash|user_app_pins|schema cache|column.*does not exist|relation.*does not exist/i.test(
    message
  );
}

async function getLocalPinHash(userId: string) {
  try {
    return await SecureStore.getItemAsync(pinStorageKey(userId));
  } catch {
    return null;
  }
}

async function cacheLocalPinHash(userId: string, hash: string) {
  await SecureStore.setItemAsync(pinStorageKey(userId), hash, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

async function fetchRemotePinHashFromProfiles(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("app_pin_hash")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (!isMissingPinStorageError(error.message) && __DEV__) {
      console.warn("[pin-lock] profiles pin fetch failed:", error.message);
    }
    return null;
  }

  const hash = data?.app_pin_hash;
  return typeof hash === "string" && hash.length > 0 ? hash : null;
}

async function fetchRemotePinHashFromTable(userId: string) {
  const { data, error } = await supabase
    .from("user_app_pins")
    .select("pin_hash")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (!isMissingPinStorageError(error.message) && __DEV__) {
      console.warn("[pin-lock] user_app_pins fetch failed:", error.message);
    }
    return null;
  }

  const hash = data?.pin_hash;
  return typeof hash === "string" && hash.length > 0 ? hash : null;
}

async function fetchRemotePinHash(userId: string) {
  const fromTable = await fetchRemotePinHashFromTable(userId);
  if (fromTable) return fromTable;
  return fetchRemotePinHashFromProfiles(userId);
}

async function saveRemotePinHash(userId: string, hash: string) {
  let saved = false;
  let lastError: string | null = null;

  const { error: tableError } = await supabase.from("user_app_pins").upsert(
    {
      user_id: userId,
      pin_hash: hash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (!tableError) {
    saved = true;
  } else if (!isMissingPinStorageError(tableError.message)) {
    lastError = tableError.message;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ app_pin_hash: hash })
    .eq("id", userId);

  if (!profileError) {
    saved = true;
  } else if (!isMissingPinStorageError(profileError.message)) {
    lastError = profileError.message;
  }

  if (!saved && lastError) {
    throw new Error(lastError);
  }
}

async function syncRemotePinHashIfMissing(userId: string, hash: string) {
  const remote = await fetchRemotePinHash(userId);
  if (remote) return;
  try {
    await saveRemotePinHash(userId, hash);
  } catch (error) {
    if (__DEV__) {
      console.warn("[pin-lock] remote sync failed:", error);
    }
  }
}

/** Local SecureStore only — cleared when the app is deleted. */
export async function hasPinForUser(userId: string) {
  return Boolean(await getLocalPinHash(userId));
}

/** Local device OR Supabase — use for routing after login / reinstall. */
export async function hasPinConfiguredForUser(userId: string) {
  if (await hasPinForUser(userId)) return true;
  return Boolean(await fetchRemotePinHash(userId));
}

/** Retry once for slow network right after login. */
export async function hasPinConfiguredForUserWithRetry(userId: string) {
  if (await hasPinConfiguredForUser(userId)) return true;
  await new Promise((resolve) => setTimeout(resolve, 350));
  return hasPinConfiguredForUser(userId);
}

export async function savePinForUser(userId: string, pin: string) {
  const hash = hashPin(pin, userId);
  await cacheLocalPinHash(userId, hash);
  await saveRemotePinHash(userId, hash);
}

export async function verifyPinForUser(userId: string, pin: string) {
  const computed = hashPin(pin, userId);

  try {
    const stored = await getLocalPinHash(userId);
    if (stored && stored === computed) {
      void syncRemotePinHashIfMissing(userId, computed);
      return true;
    }
  } catch {
    // fall through to remote check
  }

  const remote = await fetchRemotePinHash(userId);
  if (!remote || remote !== computed) return false;

  try {
    await cacheLocalPinHash(userId, remote);
  } catch {
    // verified against server even if local cache fails
  }

  return true;
}

export async function clearPinForUser(userId: string) {
  try {
    await SecureStore.deleteItemAsync(pinStorageKey(userId));
  } catch {
    // ignore storage errors
  }

  try {
    await supabase.from("user_app_pins").delete().eq("user_id", userId);
  } catch {
    // ignore remote errors
  }

  try {
    await supabase.from("profiles").update({ app_pin_hash: null }).eq("id", userId);
  } catch {
    // ignore remote errors
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
