import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import PinKeypad, { PinDots } from "@/components/auth/PinKeypad";
import PinShell from "@/components/auth/PinShell";
import { markWelcomeCompleted } from "@/lib/onboarding";
import { routeAfterPinSetup } from "@/lib/pin-routing";
import {
  PIN_LENGTH,
  clearPinSetupPending,
  hasPinConfiguredForUserWithRetry,
  isPinSetupPending,
  savePinForUser,
} from "@/lib/pin-lock";
import { supabase } from "@/lib/supabase";
import { useEndAuthTransitionOnFocus } from "@/lib/use-end-auth-transition-on-focus";
import { colors } from "@/lib/theme";

type SetupStep = "create" | "confirm";

export default function PinSetupScreen() {
  useEndAuthTransitionOnFocus();
  const [step, setStep] = useState<SetupStep>("create");
  const [draftPin, setDraftPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [requiredSetup, setRequiredSetup] = useState(true);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCheckingExisting(false);
        return;
      }

      const pending = await isPinSetupPending();
      const hasPin = await hasPinConfiguredForUserWithRetry(user.id);

      if (hasPin) {
        await clearPinSetupPending();
        router.replace("/pin-unlock");
        return;
      }

      setRequiredSetup(pending || !hasPin);
      setCheckingExisting(false);
    })();
  }, []);

  const activePin = step === "create" ? draftPin : confirmPin;

  const finishSetup = useCallback(async (pin: string) => {
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      await savePinForUser(user.id, pin);
      await clearPinSetupPending();
      await markWelcomeCompleted();
      await routeAfterPinSetup();
    } catch (error) {
      if (__DEV__) {
        console.warn("[pin-setup] save failed:", error);
      }
      setError("Unable to save passcode. Try again.");
      setConfirmPin("");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      if (saving) return;
      setError(null);

      if (step === "create") {
        const next = `${draftPin}${digit}`.slice(0, PIN_LENGTH);
        setDraftPin(next);
        if (next.length === PIN_LENGTH) {
          setTimeout(() => setStep("confirm"), 180);
        }
        return;
      }

      const next = `${confirmPin}${digit}`.slice(0, PIN_LENGTH);
      setConfirmPin(next);
      if (next.length === PIN_LENGTH) {
        if (next !== draftPin) {
          setError("Passcodes do not match. Try again.");
          setConfirmPin("");
          setStep("create");
          setDraftPin("");
          return;
        }
        void finishSetup(next);
      }
    },
    [confirmPin, draftPin, finishSetup, saving, step]
  );

  const handleBackspace = useCallback(() => {
    if (saving) return;
    setError(null);
    if (step === "create") {
      setDraftPin((current) => current.slice(0, -1));
      return;
    }
    setConfirmPin((current) => current.slice(0, -1));
  }, [saving, step]);

  if (checkingExisting) {
    return (
      <PinShell title="Checking passcode" subtitle="One moment…" showBack={false}>
        <View style={styles.centerBlock}>
          <ActivityIndicator size="small" color={colors.ink} />
        </View>
      </PinShell>
    );
  }

  return (
    <PinShell
      title={step === "create" ? "Create your passcode" : "Retype your passcode"}
      subtitle="You will use this to log in securely"
      error={error}
      showBack={step === "create" && !requiredSetup}
    >
      <View style={styles.centerBlock}>
        {saving ? (
          <ActivityIndicator size="small" color={colors.ink} style={styles.loader} />
        ) : (
          <PinDots length={PIN_LENGTH} filled={activePin.length} error={Boolean(error)} />
        )}
      </View>

      <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} disabled={saving} />
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
