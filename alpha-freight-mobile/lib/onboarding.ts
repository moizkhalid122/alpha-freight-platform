import * as SecureStore from "expo-secure-store";

const WELCOME_DONE_KEY = "alpha_freight_welcome_done";

export async function hasCompletedWelcome() {
  try {
    const value = await SecureStore.getItemAsync(WELCOME_DONE_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

export async function markWelcomeCompleted() {
  try {
    await SecureStore.setItemAsync(WELCOME_DONE_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

export async function clearWelcomeCompleted() {
  try {
    await SecureStore.deleteItemAsync(WELCOME_DONE_KEY);
  } catch {
    // ignore storage errors
  }
}
