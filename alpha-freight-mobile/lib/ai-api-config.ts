import { Platform } from "react-native";
import Constants from "expo-constants";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getAiApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_AI_API_URL?.trim();
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }

  const fromExtra = Constants.expoConfig?.extra?.aiApiUrl;
  if (typeof fromExtra === "string" && fromExtra.trim()) {
    return normalizeBaseUrl(fromExtra);
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3003";
  }

  return "http://localhost:3003";
}
