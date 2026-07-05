import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { formatWalletMoney, WalletActivity } from "@/lib/carrier-wallet";
import { colors, radius, spacing } from "@/lib/theme";

export type PendingEarningsSheetRef = {
  open: (payload: { total: number; items: WalletActivity[] }) => void;
  close: () => void;
};

function PendingRow({ item }: { item: WalletActivity }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="time-outline" size={18} color={colors.ink} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSub}>{item.subtitle}</Text>
      </View>
      <Text style={styles.rowAmount}>{item.amount}</Text>
    </View>
  );
}

const PendingEarningsSheet = forwardRef<PendingEarningsSheetRef>((_, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<WalletActivity[]>([]);
  const snapPoints = useMemo(() => ["52%", "72%"], []);

  useImperativeHandle(ref, () => ({
    open: (payload) => {
      setTotal(payload.total);
      setItems(payload.items);
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
        <Text style={styles.title}>Pending earnings</Text>
        <Text style={styles.subtitle}>From active loads awaiting payout</Text>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total pending</Text>
          <Text style={styles.totalValue}>{formatWalletMoney(total)}</Text>
        </View>

        {items.length ? (
          items.map((item) => <PendingRow key={item.id} item={item} />)
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={28} color={colors.mutedLight} />
            <Text style={styles.emptyTitle}>No pending earnings</Text>
            <Text style={styles.emptyBody}>Active load payouts will appear here until they clear.</Text>
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

PendingEarningsSheet.displayName = "PendingEarningsSheet";

export default PendingEarningsSheet;

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
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    marginBottom: spacing.md,
  },
  totalCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  rowSub: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.success,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  emptyBody: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: spacing.md,
  },
});
