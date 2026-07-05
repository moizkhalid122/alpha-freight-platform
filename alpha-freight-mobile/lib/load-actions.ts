import { Alert, Linking, Platform } from "react-native";

export const SUPPORT_PHONE = "+447700900077";
export const SUPPORT_EMAIL = "support@alphafreight.co.uk";
export const SUPPORT_HOURS = "Mon–Fri, 8am–6pm GMT";

export async function openMapsNavigation(address: string) {
  const query = encodeURIComponent(address.trim());
  if (!query) return;

  const primary = Platform.select({
    ios: `maps://?daddr=${query}`,
    android: `google.navigation:q=${query}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
  });

  const fallback = `https://www.google.com/maps/search/?api=1&query=${query}`;

  try {
    const canOpen = await Linking.canOpenURL(primary!);
    await Linking.openURL(canOpen ? primary! : fallback);
  } catch {
    try {
      await Linking.openURL(fallback);
    } catch {
      Alert.alert("Unable to open maps", "Please try again or copy the address manually.");
    }
  }
}

export async function callSupport() {
  try {
    await Linking.openURL(`tel:${SUPPORT_PHONE}`);
  } catch {
    Alert.alert("Unable to start call", `Please dial ${SUPPORT_PHONE} manually.`);
  }
}

export async function emailSupport(subject?: string) {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  try {
    await Linking.openURL(`mailto:${SUPPORT_EMAIL}${query}`);
  } catch {
    Alert.alert("Unable to open email", `Please email ${SUPPORT_EMAIL} manually.`);
  }
}
