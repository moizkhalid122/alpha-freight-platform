import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import PinKeypad, { PinDots } from "@/components/auth/PinKeypad";
import PinShell from "@/components/auth/PinShell";
import { PIN_LENGTH, verifyPinForUser } from "@/lib/pin-lock";
import { registerPushTokenIfPermitted } from "@/lib/push-notifications";
import { routeToRoleHome } from "@/lib/pin-routing";
import { useEndAuthTransitionOnFocus } from "@/lib/use-end-auth-transition-on-focus";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

export default function PinUnlockScreen() {
  useEndAuthTransitionOnFocus();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const tryUnlock = useCallback(async (value: string) => {
    setChecking(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/welcome");
        return;
      }

      const valid = await verifyPinForUser(user.id, value);
      if (!valid) {
        setError("Incorrect passcode. Try again.");
        setPin("");
        return;
      }

      await routeToRoleHome(user.id);
      void registerPushTokenIfPermitted();
    } catch {
      setError("Unable to verify passcode.");
      setPin("");
    } finally {
      setChecking(false);
    }
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      if (checking) return;
      setError(null);
      const next = `${pin}${digit}`.slice(0, PIN_LENGTH);
      setPin(next);
      if (next.length === PIN_LENGTH) {
        void tryUnlock(next);
      }
    },
    [checking, pin, tryUnlock]
  );

  const handleBackspace = useCallback(() => {
    if (checking) return;
    setError(null);
    setPin((current) => current.slice(0, -1));
  }, [checking]);

  return (
    <PinShell
      title="Enter your passcode"
      subtitle="You will use this to log in securely"
      error={error}
      showBack={false}
    >
      <View style={styles.centerBlock}>
        {checking ? (
          <ActivityIndicator size="small" color={colors.ink} style={styles.loader} />
        ) : (
          <PinDots length={PIN_LENGTH} filled={pin.length} error={Boolean(error)} />
        )}
      </View>

      <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} disabled={checking} />
    </PinShell>
  );
}

const styles = StyleSheet.create({
  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  loader: {
    marginBottom: 28,
  },
});
