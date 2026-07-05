import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfettiPop from "@/components/ui/ConfettiPop";
import {
  PayoutSetupForm,
  payoutDetailsToForm,
  saveCarrierPayoutSetup,
  validatePayoutSetupForm,
} from "@/lib/carrier-payout-setup";
import {
  blockPayoutReminderForSession,
  clearPayoutReminderState,
} from "@/lib/payout-reminder-session";
import { setCachedPayoutDetails, prefetchPayoutDetails } from "@/lib/carrier-payout-setup-cache";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type SetupStep = "intro" | "details" | "success";

const initialForm: PayoutSetupForm = {
  accountHolderName: "",
  bankName: "",
  sortCode: "",
  accountNumber: "",
  confirmAccountNumber: "",
  accountType: "personal",
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedLight}
        style={styles.input}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function IntroStep({ onContinue }: { onContinue: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(420)} style={styles.stepWrap}>
      <Animated.View entering={ZoomIn.delay(80).duration(500)} style={styles.heroArt}>
        <View style={styles.heroDoor}>
          <Text style={styles.heroDoorNumber}>£</Text>
        </View>
        <View style={styles.heroPlantLeft} />
        <View style={styles.heroPlantRight} />
        <View style={styles.heroKey}>
          <Ionicons name="card-outline" size={28} color={colors.ink} />
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInUp.delay(120).duration(420)} style={styles.stepTitle}>
        Where should we send your payouts?
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(180).duration(420)} style={styles.stepSubtitle}>
        Add your UK bank details so we can release earnings from completed loads to your account.
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(240).duration(420)} style={styles.footer}>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={onContinue}>
          <Text style={styles.primaryBtnText}>Add payout details</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function DetailsStep({
  form,
  error,
  saving,
  isEdit,
  onChange,
  onSave,
}: {
  form: PayoutSetupForm;
  error: string | null;
  saving: boolean;
  isEdit?: boolean;
  onChange: <K extends keyof PayoutSetupForm>(key: K, value: PayoutSetupForm[K]) => void;
  onSave: () => void;
}) {
  return (
    <Animated.View entering={FadeIn.duration(380)} style={styles.stepWrap}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formScroll}
      >
        <Text style={styles.stepTitle}>
          {isEdit ? "Update payout details" : "Enter payout account details"}
        </Text>
        <Text style={styles.stepSubtitle}>
          Add the UK bank account that should receive your carrier payouts.
        </Text>

        <View style={styles.formCard}>
          <Field
            label="Account holder name"
            value={form.accountHolderName}
            onChangeText={(value) => onChange("accountHolderName", value)}
            placeholder="Swift Haulage Ltd"
            autoCapitalize="words"
          />
          <Field
            label="Sort code"
            value={form.sortCode}
            onChangeText={(value) => onChange("sortCode", value)}
            placeholder="12-34-56"
            keyboardType="number-pad"
          />
          <Field
            label="Account number"
            value={form.accountNumber}
            onChangeText={(value) => onChange("accountNumber", value)}
            placeholder="12345678"
            keyboardType="number-pad"
          />
          <Field
            label="Confirm account number"
            value={form.confirmAccountNumber}
            onChangeText={(value) => onChange("confirmAccountNumber", value)}
            placeholder="12345678"
            keyboardType="number-pad"
          />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Account type</Text>
            <View style={styles.typeRow}>
              {(["personal", "corporate"] as const).map((type) => {
                const active = form.accountType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.typeBtn, active && styles.typeBtnActive]}
                    onPress={() => onChange("accountType", type)}
                  >
                    <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>
                      {type === "personal" ? "Personal" : "Corporate"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Field
            label="Bank name"
            value={form.bankName}
            onChangeText={(value) => onChange("bankName", value)}
            placeholder="Barclays"
            autoCapitalize="words"
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            (pressed || saving) && styles.pressed,
            saving && styles.primaryBtnDisabled,
          ]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>
              {isEdit ? "Update details" : "Save payout details"}
            </Text>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

function SuccessStep({ isEdit, onDone }: { isEdit?: boolean; onDone: () => void }) {
  return (
    <View style={styles.successStage}>
      <ConfettiPop />

      <Animated.View entering={FadeIn.duration(480)} style={styles.successWrap}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.successIconWrap}>
          <Ionicons name="checkmark" size={42} color={colors.ink} />
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(120).duration(420)} style={styles.successTitle}>
          {isEdit ? "Details updated" : "Payout setup complete"}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(180).duration(420)} style={styles.successSubtitle}>
          {isEdit
            ? "Your payout account details have been saved successfully."
            : "You're ready to receive earnings and withdraw payouts to your bank account."}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(260).duration(420)} style={styles.footer}>
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={onDone}>
            <Text style={styles.primaryBtnText}>{isEdit ? "Done" : "Go to wallet"}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export default function PayoutSetupScreen() {
  const { mode, source } = useLocalSearchParams<{ mode?: string; source?: string }>();
  const isEdit = mode === "edit";
  const isReminder = source === "reminder";
  const [step, setStep] = useState<SetupStep>(isEdit ? "details" : "intro");
  const [form, setForm] = useState<PayoutSetupForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [isClosing, setIsClosing] = useState(false);
  const sheetOffset = useSharedValue(0);

  const sheetStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateY: sheetOffset.value }],
  }));

  useEffect(() => {
    if (!isEdit) return;

    void prefetchPayoutDetails(true).then((details) => {
      if (details?.payoutSetupComplete) {
        setForm(payoutDetailsToForm(details));
      }
      setHydrated(true);
    });
  }, [isEdit]);

  const updateField = useCallback(<K extends keyof PayoutSetupForm>(key: K, value: PayoutSetupForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }, []);

  const handleSave = useCallback(async () => {
    const validationError = validatePayoutSetupForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saved = await saveCarrierPayoutSetup(form);
      setCachedPayoutDetails(saved);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await clearPayoutReminderState(user.id);
      }
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save payout details.");
    } finally {
      setSaving(false);
    }
  }, [form]);

  const finishDismiss = useCallback(() => {
    blockPayoutReminderForSession();

    if (isReminder && router.canGoBack()) {
      router.back();
      return;
    }

    if (isEdit) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(main)/home");
      }
      return;
    }

    router.replace("/(main)/home");
  }, [isEdit, isReminder]);

  const animateDismiss = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    sheetOffset.value = withTiming(
      SCREEN_HEIGHT,
      { duration: 340, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(finishDismiss)();
        }
      }
    );
  }, [finishDismiss, isClosing, sheetOffset]);

  const handleClose = useCallback(() => {
    if (isClosing) return;

    if (isEdit) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(main)/home");
      }
      return;
    }

    if (step === "details") {
      setStep("intro");
      setError(null);
      return;
    }

    animateDismiss();
  }, [animateDismiss, isClosing, isEdit, step]);

  const handleDone = useCallback(() => {
    if (isEdit) {
      router.back();
      return;
    }
    router.replace("/(main)/wallet");
  }, [isEdit]);

  return (
    <View style={styles.root}>
      <Animated.View style={sheetStyle}>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.topBar}>
              {step !== "success" ? (
                <Pressable
                  style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                  onPress={handleClose}
                  disabled={isClosing}
                >
                  <Ionicons name={step === "details" ? "chevron-back" : "close"} size={22} color={colors.ink} />
                </Pressable>
              ) : (
                <View style={styles.iconBtnSpacer} />
              )}
              <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <Ionicons name="help-circle-outline" size={22} color={colors.ink} />
              </Pressable>
            </View>

            {step === "intro" ? <IntroStep onContinue={() => setStep("details")} /> : null}
            {step === "details" && hydrated ? (
              <DetailsStep
                form={form}
                error={error}
                saving={saving}
                isEdit={isEdit}
                onChange={updateField}
                onSave={() => void handleSave()}
              />
            ) : null}
            {step === "success" ? <SuccessStep isEdit={isEdit} onDone={handleDone} /> : null}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnSpacer: {
    width: 40,
    height: 40,
  },
  stepWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  heroArt: {
    height: 220,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  heroDoor: {
    width: 120,
    height: 150,
    borderRadius: 18,
    backgroundColor: "#5B8DEF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.ink,
  },
  heroDoorNumber: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.white,
  },
  heroPlantLeft: {
    position: "absolute",
    left: 48,
    bottom: 18,
    width: 28,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  heroPlantRight: {
    position: "absolute",
    right: 48,
    bottom: 18,
    width: 28,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    borderWidth: 2,
    borderColor: colors.ink,
  },
  heroKey: {
    position: "absolute",
    right: 72,
    bottom: 8,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.ink,
    transform: [{ rotate: "-18deg" }],
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.ink,
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  formScroll: {
    paddingBottom: spacing.md,
  },
  formCard: {
    gap: spacing.md,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.muted,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputFill,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBtnActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.ink,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  typeBtnTextActive: {
    color: colors.ink,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  primaryBtn: {
    minHeight: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  successStage: {
    flex: 1,
    overflow: "hidden",
  },
  successWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.xxl,
    zIndex: 2,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.ink,
    textAlign: "center",
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
});
