import * as Device from "expo-device";
import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import { Platform, PermissionsAndroid } from "react-native";
import { supabase } from "@/lib/supabase";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null | undefined;
let androidChannelReady = false;

const noopSubscription = { remove: () => {} };

export function isPushNotificationsSupported() {
  return !isRunningInExpoGo() && Device.isDevice;
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (isRunningInExpoGo()) return null;

  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    notificationsModule = Notifications;
    return Notifications;
  } catch {
    notificationsModule = null;
    return null;
  }
}

async function ensureAndroidChannel(Notifications: NotificationsModule) {
  if (androidChannelReady || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Alpha Freight",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#BFFF07",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: true,
    showBadge: true,
  });
  androidChannelReady = true;
}

async function ensureAndroidNotificationPermission() {
  if (Platform.OS !== "android" || Platform.Version < 33) return true;

  const current = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  if (current) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: "Enable notifications",
      message:
        "Alpha Freight sends alerts when your account is verified and for important load updates.",
      buttonPositive: "Allow",
      buttonNegative: "Not now",
    }
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getNotificationPermissionStatus() {
  if (!isPushNotificationsSupported()) return "unsupported" as const;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return "unsupported" as const;

  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function isNotificationPermissionGranted() {
  if (!isPushNotificationsSupported()) return true;

  if (Platform.OS === "android" && Platform.Version >= 33) {
    const androidGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (!androidGranted) return false;
  }

  const status = await getNotificationPermissionStatus();
  return status === "granted";
}

export async function requestNotificationPermissions(): Promise<
  "granted" | "denied" | "undetermined" | "unsupported"
> {
  if (!isPushNotificationsSupported()) return "unsupported";

  const Notifications = await getNotificationsModule();
  if (!Notifications) return "unsupported";

  const androidGranted = await ensureAndroidNotificationPermission();
  if (!androidGranted) return "denied";

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return "granted";

  const { status } = await Notifications.requestPermissionsAsync({
    android: {},
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

let lastPushRegistrationError: string | null = null;

export function getLastPushRegistrationError() {
  return lastPushRegistrationError;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!isPushNotificationsSupported()) {
    lastPushRegistrationError =
      "Push requires the Alpha Freight dev/production app on a physical device.";
    return null;
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      lastPushRegistrationError = "Notifications module unavailable.";
      return null;
    }

    const granted = await isNotificationPermissionGranted();
    if (!granted) {
      lastPushRegistrationError = "Notification permission not granted.";
      return null;
    }

    await ensureAndroidChannel(Notifications);

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.projectId;

    if (!projectId) {
      lastPushRegistrationError = "Missing EAS project ID for push token registration.";
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: String(projectId),
    });

    lastPushRegistrationError = null;
    return tokenResponse.data ?? null;
  } catch (error) {
    lastPushRegistrationError =
      error instanceof Error ? error.message : "Unable to register for push notifications.";
    if (__DEV__) {
      console.warn("[push] registration failed:", lastPushRegistrationError);
    }
    return null;
  }
}

export async function savePushTokenForUser(token: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("push_device_tokens").upsert(
    [
      {
        user_id: user.id,
        expo_push_token: token,
        platform: Platform.OS,
        device_name: Device.modelName ?? Device.deviceName ?? Platform.OS,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "user_id,expo_push_token" }
  );

  if (error && !/relation .* does not exist|schema cache/i.test(error.message)) {
    throw error;
  }
}

export type PushRegistrationResult = {
  token: string | null;
  error: string | null;
};

export async function registerPushTokenIfPermitted(): Promise<PushRegistrationResult> {
  const granted = await isNotificationPermissionGranted();
  if (!granted) {
    return { token: null, error: "Notification permission not granted." };
  }
  return initializePushNotifications();
}

export async function initializePushNotifications(): Promise<PushRegistrationResult> {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    try {
      await savePushTokenForUser(token);
      if (__DEV__) {
        console.log("[push] token saved:", token.slice(0, 24) + "...");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save push token to server.";
      lastPushRegistrationError = message;
      if (__DEV__) {
        console.warn("[push] token save failed:", message);
      }
      return { token, error: message };
    }
  }
  return { token, error: lastPushRegistrationError };
}

export async function setupPushNotificationListeners(options: {
  onResponse: (response: import("expo-notifications").NotificationResponse) => void;
  onReceived: (notification: import("expo-notifications").Notification) => void;
}) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return noopSubscription;
  }

  const responseSub = Notifications.addNotificationResponseReceivedListener(options.onResponse);
  const receivedSub = Notifications.addNotificationReceivedListener(options.onReceived);

  return {
    remove: () => {
      responseSub.remove();
      receivedSub.remove();
    },
  };
}

export async function getBadgeCountAsync() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return 0;
  return Notifications.getBadgeCountAsync();
}

export async function setBadgeCountAsync(count: number) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await Notifications.setBadgeCountAsync(count);
}
