import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { CarrierPayoutDetails, maskAccountNumber } from "@/lib/carrier-payout-setup";
import { prefetchPayoutDetails } from "@/lib/carrier-payout-setup-cache";
import { colors, radius, spacing } from "@/lib/theme";

export type PayoutDetailsSheetRef = {
  open: () => void;
  close: () => void;
};

function DetailCard({
  title,
  subtitle,
  value,
  icon,
  primary,
}: {
  title: string;
  subtitle: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  primary?: boolean;
}) {
  return (
    <View style={[styles.detailCard, primary && styles.detailCardPrimary]}>
      <View style={[styles.detailIcon, primary && styles.detailIconPrimary]}>
        <Ionicons name={icon} size={20} color={colors.ink} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailSub}>{subtitle}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
      {primary ? (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      ) : null}
    </View>
  );
}

const PayoutDetailsSheet = forwardRef<PayoutDetailsSheetRef>((_, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [details, setDetails] = useState<CarrierPayoutDetails | null>(null);
  const snapPoints = useMemo(() => ["58%"], []);

  const handleUpdatePress = useCallback(() => {
    sheetRef.current?.dismiss();
    requestAnimationFrame(() => {
      router.push({ pathname: "/payout-setup", params: { mode: "edit" } });
    });
  }, []);

  useImperativeHandle(ref, () => ({
    open: () => {
      void prefetchPayoutDetails(true).then((result) => {
        if (result) setDetails(result);
      });
      sheetRef.current?.present();
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    []
  );

  const accountLabel = details
    ? `${details.bankName || "Bank account"} · ${maskAccountNumber(details.bankAccountNumber)}`
    : "Bank account";

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Payout details</Text>
            <Text style={styles.subtitle}>Manage where you get paid</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.updateBtn, pressed && styles.updateBtnPressed]}
            onPress={handleUpdatePress}
          >
            <Ionicons name="create-outline" size={14} color={colors.ink} />
            <Text style={styles.updateBtnText}>Update details</Text>
          </Pressable>
        </View>

        <DetailCard
          title="Bank transfer"
          subtitle={details?.bankCountry || "United Kingdom"}
          value={accountLabel}
          icon="business-outline"
          primary
        />

        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Account holder</Text>
          <Text style={styles.metaValue}>{details?.bankAccountHolderName || "—"}</Text>
          <Text style={styles.metaLabel}>Sort code</Text>
          <Text style={styles.metaValue}>{details?.bankSortCode || "—"}</Text>
          <Text style={styles.metaLabel}>Account type</Text>
          <Text style={styles.metaValue}>
            {details?.bankAccountType === "corporate" ? "Corporate" : "Personal"}
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
          <Text style={styles.noteText}>
            Payouts are released after load completion and clearance. Withdrawals typically arrive
            within 1–3 working days.
          </Text>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

PayoutDetailsSheet.displayName = "PayoutDetailsSheet";

export default PayoutDetailsSheet;

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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
  },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.ink,
    flexShrink: 0,
  },
  updateBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  updateBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.1,
  },
  detailCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  detailCardPrimary: {
    borderColor: colors.ink,
    backgroundColor: colors.canvas,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
  },
  detailIconPrimary: {
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  detailCopy: {
    flex: 1,
    gap: 2,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  detailSub: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
    marginTop: 4,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metaCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.mutedLight,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 6,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  noteCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    color: colors.muted,
  },
});
