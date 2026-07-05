import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Tabs, router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar, { TabKey } from "@/components/dashboard/BottomTabBar";
import { isAccountSetupComplete } from "@/lib/account-setup";
import { prefetchCarrierReferrals } from "@/lib/carrier-referrals-cache";
import { prefetchPayoutDetails } from "@/lib/carrier-payout-setup-cache";
import PayoutReminderGate from "@/components/wallet/PayoutReminderGate";
import NotificationPermissionGate from "@/components/notifications/NotificationPermissionGate";
import { resetPayoutReminderSessionBlock } from "@/lib/payout-reminder-session";
import { prefetchCarrierMyLoads } from "@/lib/carrier-my-loads-cache";
import { prefetchCarrierProfile } from "@/lib/carrier-profile-cache";
import { prefetchAvailableLoads } from "@/lib/available-loads-cache";
import { prefetchCarrierDashboard } from "@/lib/carrier-dashboard-cache";
import { prefetchCarrierWallet } from "@/lib/carrier-wallet-cache";
import { registerPushTokenIfPermitted } from "@/lib/push-notifications";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

function routeToTab(routeName: string): TabKey {
  if (routeName === "loads") return "loads";
  if (routeName === "wallet") return "wallet";
  if (routeName === "profile") return "profile";
  return "home";
}

function MainTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
}) {
  const activeRoute = state.routes[state.index]?.name ?? "home";
  const active = routeToTab(activeRoute);

  return (
    <SafeAreaView edges={["bottom"]} style={styles.tabWrap}>
      <BottomTabBar
        active={active}
        onChange={(tab) => {
          if (tab === active) return;
          navigation.navigate(tab === "home" ? "home" : tab);
        }}
      />
    </SafeAreaView>
  );
}

export default function MainLayout() {
  const [authReady, setAuthReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [payoutComplete, setPayoutComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setRedirecting(true);
        router.replace("/welcome");
        return;
      }

      if (!(await isAccountSetupComplete())) {
        setRedirecting(true);
        router.replace("/account-setup");
        return;
      }

      const payout = await prefetchPayoutDetails(true);
      setPayoutComplete(Boolean(payout?.payoutSetupComplete));

      setAuthReady(true);
      resetPayoutReminderSessionBlock();
      void prefetchCarrierDashboard();
      void prefetchAvailableLoads();
      void prefetchCarrierWallet();
      void prefetchCarrierProfile();
      void prefetchCarrierMyLoads();
      void prefetchCarrierReferrals();
      void prefetchPayoutDetails();

      void registerPushTokenIfPermitted();
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void prefetchPayoutDetails(true).then((payout) => {
        setPayoutComplete(Boolean(payout?.payoutSetupComplete));
      });
    }, [])
  );

  if (redirecting || !authReady) {
    return <View style={styles.loading} />;
  }

  return (
    <View style={styles.root}>
      <Tabs
        tabBar={(props) => <MainTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: "none",
          lazy: false,
          freezeOnBlur: true,
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="loads" />
        <Tabs.Screen name="wallet" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <NotificationPermissionGate enabled={authReady} />

      <PayoutReminderGate
        enabled={authReady && payoutComplete === false}
        key={`payout-reminder-${authReady ? "ready" : "loading"}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  tabWrap: {
    backgroundColor: "transparent",
    overflow: "visible",
  },
});
