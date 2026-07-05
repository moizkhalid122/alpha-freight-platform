import * as SecureStore from "expo-secure-store";

const PREFS_KEY = "carrier_notification_prefs";

export type NotificationPrefs = {
  loadAlerts: boolean;
  bidUpdates: boolean;
  weeklyReports: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  loadAlerts: true,
  bidUpdates: true,
  weeklyReports: false,
};

export async function readNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function writeNotificationPrefs(prefs: NotificationPrefs) {
  await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs));
}
