import { Platform } from "react-native";
import Constants from "expo-constants";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getWebApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_API_URL?.trim();
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }

  const fromExtra = Constants.expoConfig?.extra?.webApiUrl;
  if (typeof fromExtra === "string" && fromExtra.trim()) {
    return normalizeBaseUrl(fromExtra);
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
}
