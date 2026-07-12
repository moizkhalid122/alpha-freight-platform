import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Tabs, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar, { SupplierTabKey, TabKey } from "@/components/dashboard/BottomTabBar";
import NotificationPermissionGate from "@/components/notifications/NotificationPermissionGate";
import { isAccountSetupComplete } from "@/lib/account-setup";
import { prefetchSupplierDashboard } from "@/lib/supplier-dashboard-cache";
import { prefetchSupplierMyPosts } from "@/lib/supplier-my-posts-cache";
import { prefetchSupplierProfile } from "@/lib/supplier-profile-cache";
import { prefetchFeedPosts } from "@/lib/feed-cache";
import { registerPushTokenIfPermitted } from "@/lib/push-notifications";
import { deferAfterInteractions } from "@/lib/defer-work";
import { supabase } from "@/lib/supabase";
import { getUserRole, homeRouteForRole } from "@/lib/user-role";
import { smoothTabScreenOptions } from "@/lib/navigation-config";
import { LAUNCH_FEATURES } from "@/lib/launch-config";
import { colors } from "@/lib/theme";

function routeToTab(routeName: string): SupplierTabKey {
  if (routeName === "feed") return "feed";
  if (routeName === "posts") return "posts";
  if (routeName === "bids") return "bids";
  if (routeName === "profile") return "profile";
  return "home";
}

function SupplierTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void; jumpTo?: (name: string) => void };
}) {
  const activeRoute = state.routes[state.index]?.name ?? "home";
  const active = routeToTab(activeRoute);

  const handleChange = useCallback(
    (tab: TabKey) => {
      const route = tab as SupplierTabKey;
      if (navigation.jumpTo) {
        navigation.jumpTo(route);
        return;
      }
      navigation.navigate(route);
    },
    [navigation]
  );

  return (
    <SafeAreaView edges={["bottom"]} style={styles.tabWrap}>
      <BottomTabBar role="supplier" active={active} onChange={handleChange} />
    </SafeAreaView>
  );
}

export default function SupplierMainLayout() {
  const [authReady, setAuthReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let mounted = true;
    let cancelDeferred = () => {};

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

      const role = await getUserRole(session.user.id);
      if (role !== "supplier") {
        setRedirecting(true);
        router.replace(homeRouteForRole(role));
        return;
      }

      setAuthReady(true);

      cancelDeferred = deferAfterInteractions(() => {
        if (!mounted) return;
        void prefetchSupplierDashboard();
        void prefetchSupplierMyPosts();
        void prefetchSupplierProfile();
        if (LAUNCH_FEATURES.socialFeed) {
          void prefetchFeedPosts();
        }
        void registerPushTokenIfPermitted();
      }, 400);
    })();

    return () => {
      mounted = false;
      cancelDeferred();
    };
  }, []);

  if (redirecting || !authReady) {
    return <View style={styles.loading} />;
  }

  return (
    <View style={styles.root}>
      <Tabs
        tabBar={(props) => <SupplierTabBar {...props} />}
        screenOptions={smoothTabScreenOptions}
      >
        <Tabs.Screen name="home" options={{ lazy: false }} />
        <Tabs.Screen name="feed" options={{ href: LAUNCH_FEATURES.socialFeed ? undefined : null }} />
        <Tabs.Screen name="posts" />
        <Tabs.Screen name="bids" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <NotificationPermissionGate enabled={authReady} />
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
    backgroundColor: colors.white,
  },
  tabWrap: {
    backgroundColor: "transparent",
    overflow: "visible",
  },
});
