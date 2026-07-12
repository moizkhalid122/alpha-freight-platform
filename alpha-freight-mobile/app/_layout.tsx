import "react-native-reanimated";
import "@/lib/carrier-gps-tracker";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import SplashScreen from "@/components/splash/SplashScreen";
import { hasCompletedWelcome } from "@/lib/onboarding";
import {
  registerPushTokenIfPermitted,
  setupPushNotificationListeners,
  setBadgeCountAsync,
} from "@/lib/push-notifications";
import { fetchUnreadNotificationCount } from "@/lib/user-notifications";
import {
  isCarrierVerifiedNotification,
  showVerifiedCelebration,
} from "@/lib/verified-celebration";
import { startCarrierRealtimeAlerts, stopCarrierRealtimeAlerts } from "@/lib/carrier-realtime-alerts";
import { syncCarrierGpsTrackingSession } from "@/lib/carrier-gps-tracker";
import { startAppNotificationAlerts, stopAppNotificationAlerts } from "@/lib/app-notifications";
import StripePaymentProvider from "@/components/payments/StripePaymentProvider";
import VerifiedCelebrationModal from "@/components/notifications/VerifiedCelebrationModal";
import AuthTransitionHost from "@/components/auth/AuthTransitionHost";
import { routeAfterSplash } from "@/lib/pin-routing";
import {
  smoothFadeScreenOptions,
  smoothInstantScreenOptions,
  smoothModalScreenOptions,
  smoothStackScreenOptions,
} from "@/lib/navigation-config";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/user-role";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = useCallback(async () => {
    try {
      const [{ data: { session } }, seenWelcome] = await Promise.all([
        supabase.auth.getSession(),
        hasCompletedWelcome(),
      ]);

      if (!seenWelcome || !session) {
        router.replace("/welcome");
      } else {
        await routeAfterSplash(session.user.id);
      }
    } catch {
      router.replace("/welcome");
    } finally {
      setShowSplash(false);
    }
  }, [router]);

  useEffect(() => {
    let listenerSub = { remove: () => {} };

    void (async () => {
      listenerSub = await setupPushNotificationListeners({
        onResponse: (response) => {
          const content = response.notification.request.content;
          const type = content.data?.type;
          const route = content.data?.route;

          if (isCarrierVerifiedNotification(type)) {
            showVerifiedCelebration({
              title: content.title ?? "You're verified",
              body: content.body ?? "Your carrier account is now verified on Alpha Freight.",
              onClose: () => {
                if (typeof route === "string") {
                  router.push(route as never);
                }
              },
            });
            return;
          }

          if (typeof route === "string") {
            if (type === "feed_follow" && typeof content.data?.profileKey === "string") {
              router.push({
                pathname: "/feed-profile",
                params: {
                  profileKey: String(content.data.profileKey),
                  name: String(content.data.name || "Profile"),
                  role: String(content.data.role || "carrier"),
                  avatarSrc: String(content.data.avatarSrc || ""),
                  authorId: String(content.data.authorId || ""),
                  viewerRole: String(content.data.viewerRole || "carrier"),
                },
              });
              return;
            }

            if (type === "feed_like" || type === "feed_reply") {
              const postId =
                typeof content.data?.postId === "string"
                  ? content.data.postId
                  : route.replace(/^\/feed-post\//, "");
              router.push({
                pathname: "/feed-post/[id]",
                params: {
                  id: postId,
                  viewerRole: String(content.data?.viewerRole || "carrier"),
                },
              });
              return;
            }

            router.push(route as never);
          } else if (type === "new_load") {
            router.push("/(main)/loads" as never);
          }
        },
        onReceived: (notification) => {
          const content = notification.request.content;
          const type = content.data?.type;

          if (isCarrierVerifiedNotification(type)) {
            showVerifiedCelebration({
              title: content.title ?? "You're verified",
              body: content.body ?? "Your carrier account is now verified on Alpha Freight.",
            });
          }

          void fetchUnreadNotificationCount().then((count) => setBadgeCountAsync(count));
        },
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        void registerPushTokenIfPermitted();
        startAppNotificationAlerts(session.user.id);
        void getUserRole(session.user.id).then((role) => {
          if (role === "carrier") {
            startCarrierRealtimeAlerts(session.user.id);
            void syncCarrierGpsTrackingSession();
          }
        });
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void registerPushTokenIfPermitted();
        startAppNotificationAlerts(session.user.id);
        void getUserRole(session.user.id).then((role) => {
          if (role === "carrier") {
            startCarrierRealtimeAlerts(session.user.id);
            void syncCarrierGpsTrackingSession();
          } else {
            stopCarrierRealtimeAlerts();
          }
        });
      } else {
        stopCarrierRealtimeAlerts();
        stopAppNotificationAlerts();
      }
    });

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await registerPushTokenIfPermitted();
      }
    })();

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void registerPushTokenIfPermitted();
        void (async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;
          const role = await getUserRole(session.user.id);
          if (role === "carrier") {
            void syncCarrierGpsTrackingSession();
          }
        })();
      }
    });

    return () => {
      listenerSub.remove();
      authListener.subscription.unsubscribe();
      appStateSub.remove();
      stopCarrierRealtimeAlerts();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StripePaymentProvider>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={smoothStackScreenOptions}>
            <Stack.Screen name="index" options={smoothInstantScreenOptions} />
            <Stack.Screen name="welcome" options={smoothFadeScreenOptions} />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="account-setup" />
            <Stack.Screen name="pin-setup" />
            <Stack.Screen name="pin-unlock" options={smoothFadeScreenOptions} />
            <Stack.Screen name="payout-setup" options={smoothModalScreenOptions} />
            <Stack.Screen name="my-loads" />
            <Stack.Screen name="my-bids" />
            <Stack.Screen name="support" />
            <Stack.Screen name="settings" />
            <Stack.Screen
              name="ai-assistant"
              options={{
                ...smoothModalScreenOptions,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="referrals" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="earnings" />
            <Stack.Screen name="post-load" />
            <Stack.Screen name="pay-later" />
            <Stack.Screen name="feed-post/[id]" />
            <Stack.Screen name="feed-profile" />
            <Stack.Screen name="discover" />
            <Stack.Screen name="create-feed-compose" options={smoothModalScreenOptions} />
            <Stack.Screen name="create-feed-post" options={smoothModalScreenOptions} />
            <Stack.Screen name="create-feed-reel" options={smoothModalScreenOptions} />
            <Stack.Screen name="complete-payment" options={smoothModalScreenOptions} />
            <Stack.Screen name="supplier-load/[loadId]" />
            <Stack.Screen name="load-tracking/index" />
            <Stack.Screen name="load-tracking/[loadId]" />
            <Stack.Screen name="(main)" options={smoothInstantScreenOptions} />
            <Stack.Screen name="(supplier-main)" options={smoothInstantScreenOptions} />
            <Stack.Screen name="dashboard" options={smoothInstantScreenOptions} />
            <Stack.Screen name="available-loads" options={smoothInstantScreenOptions} />
            <Stack.Screen name="wallet" options={smoothInstantScreenOptions} />
          </Stack>

          {showSplash ? (
            <View style={styles.splashOverlay}>
              <SplashScreen onFinish={handleSplashFinish} />
            </View>
          ) : null}

          <VerifiedCelebrationModal />
          <AuthTransitionHost />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
      </StripePaymentProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
    backgroundColor: "#FFFFFF",
  },
});
