import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import SlideToConfirm from "@/components/wallet/SlideToConfirm";
import {
  PayoutMethod,
  formatWalletMoney,
  requestWalletWithdrawal,
} from "@/lib/carrier-wallet";
import { colors, radius, spacing } from "@/lib/theme";

export type WithdrawSheetRef = {
  open: (availableBalance: number) => void;
  close: () => void;
};

type WithdrawStep = "method" | "amount" | "success";

type WithdrawSheetProps = {
  onComplete?: (payload: { amount: number; method: PayoutMethod }) => void;
};

function MethodOption({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.methodCard, selected && styles.methodCardSelected]}
      onPress={onPress}
    >
      <View style={[styles.methodIcon, selected && styles.methodIconSelected]}>
        <Ionicons name={icon} size={22} color={colors.ink} />
      </View>
      <View style={styles.methodCopy}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodSub}>{subtitle}</Text>
      </View>
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={selected ? colors.ink : colors.mutedLight}
      />
    </Pressable>
  );
}

const WithdrawSheet = forwardRef<WithdrawSheetRef, WithdrawSheetProps>(({ onComplete }, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [step, setStep] = useState<WithdrawStep>("method");
  const [method, setMethod] = useState<PayoutMethod | null>(null);
  const [amountText, setAmountText] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [slideKey, setSlideKey] = useState(0);

  const snapPoints = useMemo(() => ["58%", "78%"], []);

  const parsedAmount = useMemo(() => {
    const value = Number(amountText.replace(/,/g, ""));
    return Number.isFinite(value) ? value : 0;
  }, [amountText]);

  const amountError = useMemo(() => {
    if (!amountText.trim()) return "";
    if (parsedAmount <= 0) return "Enter a valid amount";
    if (parsedAmount > availableBalance) return "Amount exceeds available balance";
    if (parsedAmount < 10) return "Minimum withdrawal is £10";
    return "";
  }, [amountText, parsedAmount, availableBalance]);

  const canConfirm = parsedAmount > 0 && !amountError && !!method && !submitting;

  const resetState = useCallback(() => {
    setStep("method");
    setMethod(null);
    setAmountText("");
    setSubmitting(false);
    setSlideKey((key) => key + 1);
  }, []);

  useImperativeHandle(ref, () => ({
    open: (balance) => {
      resetState();
      setAvailableBalance(balance);
      requestAnimationFrame(() => sheetRef.current?.present());
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    []
  );

  const handleDismiss = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleContinue = useCallback(() => {
    if (!method) return;
    setStep("amount");
    setSlideKey((key) => key + 1);
  }, [method]);

  const handleBack = useCallback(() => {
    if (step === "amount") {
      setStep("method");
      setSlideKey((key) => key + 1);
    }
  }, [step]);

  const handleConfirm = useCallback(async () => {
    if (!method || !canConfirm || submitting) return;

    setSubmitting(true);
    try {
      const result = await requestWalletWithdrawal(parsedAmount, method);
      if (!result.success) return;

      setStep("success");
      onComplete?.({ amount: parsedAmount, method });

      setTimeout(() => {
        sheetRef.current?.dismiss();
      }, 1400);
    } finally {
      setSubmitting(false);
    }
  }, [method, canConfirm, submitting, parsedAmount, onComplete]);

  const methodLabel = method === "bank_card" ? "Bank card" : "Bank transfer";

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.sheetHeader}>
          {step === "amount" ? (
            <Pressable style={styles.backBtn} onPress={handleBack}>
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.backBtnSpacer} />
          )}
          <View style={styles.headerCopy}>
            <Text style={styles.sheetTitle}>
              {step === "method"
                ? "Withdraw payout"
                : step === "amount"
                  ? "Enter amount"
                  : "Payout sent"}
            </Text>
            <Text style={styles.sheetSub}>
              {step === "method"
                ? "Choose where you want to receive funds"
                : step === "amount"
                  ? `${methodLabel} · Available ${formatWalletMoney(availableBalance)}`
                  : "Your withdrawal is being processed"}
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={() => sheetRef.current?.dismiss()}>
            <Ionicons name="close" size={18} color={colors.inkSoft} />
          </Pressable>
        </View>

        {step === "method" ? (
          <View style={styles.stepBody}>
            <MethodOption
              title="Bank transfer"
              subtitle="Send to your UK bank account"
              icon="business-outline"
              selected={method === "bank_transfer"}
              onPress={() => setMethod("bank_transfer")}
            />
            <MethodOption
              title="Bank card"
              subtitle="Withdraw to your linked debit card"
              icon="card-outline"
              selected={method === "bank_card"}
              onPress={() => setMethod("bank_card")}
            />

            <Pressable
              style={[styles.primaryBtn, !method && styles.primaryBtnDisabled]}
              disabled={!method}
              onPress={handleContinue}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.ink} />
            </Pressable>
          </View>
        ) : null}

        {step === "amount" ? (
          <View style={styles.stepBody}>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Payout amount</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.currency}>£</Text>
                <TextInput
                  value={amountText}
                  onChangeText={setAmountText}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedLight}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                />
              </View>
              {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
              <Pressable
                style={styles.maxBtn}
                onPress={() => setAmountText(availableBalance.toFixed(2))}
              >
                <Text style={styles.maxBtnText}>Withdraw max</Text>
              </Pressable>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Method</Text>
                <Text style={styles.summaryValue}>{methodLabel}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>You receive</Text>
                <Text style={styles.summaryValue}>
                  {parsedAmount > 0 ? formatWalletMoney(parsedAmount) : "£0.00"}
                </Text>
              </View>
            </View>

            {submitting ? (
              <View style={styles.submittingRow}>
                <ActivityIndicator color={colors.ink} />
                <Text style={styles.submittingText}>Processing payout…</Text>
              </View>
            ) : (
              <SlideToConfirm
                key={slideKey}
                disabled={!canConfirm}
                onConfirm={() => void handleConfirm()}
              />
            )}
          </View>
        ) : null}

        {step === "success" ? (
          <View style={styles.successBody}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={34} color={colors.ink} />
            </View>
            <Text style={styles.successAmount}>{formatWalletMoney(parsedAmount)}</Text>
            <Text style={styles.successText}>
              Withdrawal requested via {methodLabel.toLowerCase()}
            </Text>
          </View>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

WithdrawSheet.displayName = "WithdrawSheet";

export default WithdrawSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handle: {
    backgroundColor: colors.border,
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  backBtnSpacer: {
    width: 36,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sheetSub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 18,
  },
  stepBody: {
    gap: spacing.md,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  methodCardSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.brandSoft,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconSelected: {
    backgroundColor: colors.brand,
  },
  methodCopy: {
    flex: 1,
    gap: 2,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  methodSub: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: 16,
    marginTop: spacing.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  amountCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currency: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
  },
  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: "800",
    color: colors.ink,
    padding: 0,
    letterSpacing: -0.8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
  },
  maxBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  maxBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: spacing.md,
  },
  submittingText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  successBody: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  successAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
  },
  successText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
  },
});
