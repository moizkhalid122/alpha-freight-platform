import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { endAuthTransition } from "@/lib/auth-transition";
import { handleOAuthCallbackUrl } from "@/lib/google-auth";
import { markWelcomeCompleted } from "@/lib/onboarding";
import { routeAfterAuth, routeAfterSignup } from "@/lib/pin-routing";
import { supabase } from "@/lib/supabase";
import { isAccountSetupComplete } from "@/lib/account-setup";
import { colors } from "@/lib/theme";

export default function AuthCallbackScreen() {
  useEffect(() => {
    void (async () => {
      try {
        const url = (await Linking.getInitialURL()) ?? Linking.createURL("auth/callback");
        if (url.includes("access_token=") || url.includes("code=")) {
          await handleOAuthCallbackUrl(url);
          await markWelcomeCompleted();

          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user && !(await isAccountSetupComplete())) {
            await routeAfterSignup();
          } else {
            await routeAfterAuth();
          }
          return;
        }
      } catch {
        // Fall through to welcome if callback parsing fails.
      }

      endAuthTransition();
      router.replace("/welcome");
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.black} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});
