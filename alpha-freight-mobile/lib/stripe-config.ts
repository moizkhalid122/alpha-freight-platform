import Constants from "expo-constants";
import { NativeModules } from "react-native";

function readEnv(key: string) {
  const fromProcess = process.env[key]?.trim();
  if (fromProcess) return fromProcess;

  const extraKey = key.replace(/^EXPO_PUBLIC_/, "").replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
  const camelKey = extraKey.charAt(0).toLowerCase() + extraKey.slice(1);
  const fromExtra = Constants.expoConfig?.extra?.[camelKey];
  if (typeof fromExtra === "string" && fromExtra.trim()) {
    return fromExtra.trim();
  }

  return "";
}

export function getStripePublishableKey() {
  return readEnv("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

export function getRenderBackendUrl() {
  const fromEnv = readEnv("EXPO_PUBLIC_RENDER_BACKEND_URL");
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return "https://alpha-freight-server.onrender.com";
}

export function isNativeStripeModuleAvailable() {
  const modules = NativeModules as Record<string, unknown>;
  return Boolean(modules.StripeSdk || modules.ExponentStripeSdk);
}

export function isExpoGo() {
  return Constants.appOwnership === "expo";
}

export function isLiveStripeEnabled() {
  if (isExpoGo()) return false;
  if (!isNativeStripeModuleAvailable()) return false;
  const key = getStripePublishableKey();
  return Boolean(key) && !key.startsWith("YOUR_");
}

export function isStripeLiveMode() {
  const key = getStripePublishableKey();
  return key.startsWith("pk_live_");
}

/** Google Pay on sideloaded/dev APK needs testEnv even with live Stripe keys. */
export function isGooglePayTestEnv() {
  const forced = readEnv("EXPO_PUBLIC_GOOGLE_PAY_TEST_ENV").toLowerCase();
  if (forced === "true") return true;
  if (forced === "false") return false;
  if (!isStripeLiveMode()) return true;
  return __DEV__;
}

export const STRIPE_URL_SCHEME = "alphafreight";
