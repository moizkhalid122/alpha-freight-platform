import "react-native-reanimated";
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
import VerifiedCelebrationModal from "@/components/notifications/VerifiedCelebrationModal";
import { routeAfterSplash } from "@/lib/pin-routing";
import { supabase } from "@/lib/supabase";

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
            router.push(route as never);
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
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void registerPushTokenIfPermitted();
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
      }
    });

    return () => {
      listenerSub.remove();
      authListener.subscription.unsubscribe();
      appStateSub.remove();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="index" options={{ animation: "none" }} />
            <Stack.Screen name="welcome" options={{ animation: "fade" }} />
            <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="signup" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="account-setup" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="pin-setup" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="pin-unlock" options={{ animation: "fade" }} />
            <Stack.Screen
              name="payout-setup"
              options={{ animation: "slide_from_bottom", presentation: "modal" }}
            />
            <Stack.Screen name="my-loads" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="my-bids" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="support" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
            <Stack.Screen
              name="ai-assistant"
              options={{
                animation: "slide_from_bottom",
                presentation: "modal",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="referrals" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="(main)" options={{ animation: "none", headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ animation: "none" }} />
            <Stack.Screen name="available-loads" options={{ animation: "none" }} />
            <Stack.Screen name="wallet" options={{ animation: "none" }} />
          </Stack>

          {showSplash ? (
            <View style={styles.splashOverlay}>
              <SplashScreen onFinish={handleSplashFinish} />
            </View>
          ) : null}

          <VerifiedCelebrationModal />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
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
