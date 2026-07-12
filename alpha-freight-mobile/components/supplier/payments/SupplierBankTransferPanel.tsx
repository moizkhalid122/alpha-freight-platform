import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import UkFlag from "@/components/ui/UkFlag";
import { ALPHA_FREIGHT_BANK_DETAILS, formatBankReference } from "@/lib/bank-transfer-config";
import { formatSupplierMoney } from "@/lib/supplier-payments";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type Props = {
  amount: number;
  loadId: string;
  loadCode: string;
  submitting: boolean;
  onConfirm: () => void;
};

function BankDetailRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} selectable>
          {value}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.copyBtn, pressed && styles.copyBtnPressed]}
        onPress={onCopy}
        accessibilityLabel={`Copy ${label}`}
      >
        <Ionicons name="copy-outline" size={18} color={colors.premiumGreenDark} />
      </Pressable>
    </View>
  );
}

export default function SupplierBankTransferPanel({
  amount,
  loadId,
  loadCode,
  submitting,
  onConfirm,
}: Props) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const reference = formatBankReference(loadId);

  const copyValue = useCallback(async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 1800);
  }, []);

  return (
    <Animated.View entering={FadeInUp.duration(420)} style={styles.wrap}>
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <View style={styles.walletTitleRow}>
            <UkFlag size={16} />
            <Text style={styles.walletTitle}>{ALPHA_FREIGHT_BANK_DETAILS.walletLabel}</Text>
          </View>
          <Text style={styles.walletAmount}>{formatSupplierMoney(amount)}</Text>
        </View>

        <View style={styles.detailsCard}>
          <BankDetailRow
            label="Bank name"
            value={ALPHA_FREIGHT_BANK_DETAILS.bankName}
            onCopy={() => void copyValue("Bank name", ALPHA_FREIGHT_BANK_DETAILS.bankName)}
          />
          <BankDetailRow
            label="Account name"
            value={ALPHA_FREIGHT_BANK_DETAILS.accountName}
            onCopy={() => void copyValue("Account name", ALPHA_FREIGHT_BANK_DETAILS.accountName)}
          />
          <BankDetailRow
            label="Bank account number"
            value={ALPHA_FREIGHT_BANK_DETAILS.accountNumber}
            onCopy={() => void copyValue("Account number", ALPHA_FREIGHT_BANK_DETAILS.accountNumber)}
          />
          <BankDetailRow
            label="Sort code"
            value={ALPHA_FREIGHT_BANK_DETAILS.sortCode}
            onCopy={() => void copyValue("Sort code", ALPHA_FREIGHT_BANK_DETAILS.sortCodeDigits)}
          />
          <BankDetailRow
            label="IBAN (for international transfers)"
            value={ALPHA_FREIGHT_BANK_DETAILS.iban}
            onCopy={() => void copyValue("IBAN", ALPHA_FREIGHT_BANK_DETAILS.iban)}
          />
          <BankDetailRow
            label="Payment reference (required)"
            value={reference}
            onCopy={() => void copyValue("Reference", reference)}
          />
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={colors.ink} />
        <Text style={styles.infoText}>
          Transfer exactly {formatSupplierMoney(amount)} and use reference{" "}
          <Text style={styles.infoStrong}>{loadCode}</Text>. Our team will verify your payment within 2
          hours on business days.
        </Text>
      </View>

      {copiedLabel ? (
        <Animated.View entering={FadeInUp.duration(240)} style={styles.copiedBanner}>
          <Ionicons name="checkmark-circle" size={16} color={colors.premiumGreenDark} />
          <Text style={styles.copiedText}>{copiedLabel} copied</Text>
        </Animated.View>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.confirmBtn,
          (pressed || submitting) && styles.confirmBtnPressed,
          submitting && styles.confirmBtnDisabled,
        ]}
        disabled={submitting}
        onPress={onConfirm}
      >
        <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
        <Text style={styles.confirmBtnText}>
          {submitting ? "Submitting…" : "I have sent payment"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  walletCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E8EEF2",
    overflow: "hidden",
    ...shadow.soft,
  },
  walletHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  walletAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.premiumGreenDark,
  },
  detailsCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F8",
  },
  detailCopy: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.premiumGreenDark,
    lineHeight: 21,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3FAF6",
  },
  copyBtnPressed: {
    opacity: 0.75,
  },
  infoBox: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E8EEF2",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  infoStrong: {
    fontWeight: "700",
    color: colors.ink,
  },
  copiedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ECFDF3",
  },
  copiedText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.premiumGreenDark,
  },
  confirmBtn: {
    marginTop: spacing.xs,
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.premiumGreenDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmBtnPressed: {
    opacity: 0.92,
  },
  confirmBtnDisabled: {
    opacity: 0.65,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
});
