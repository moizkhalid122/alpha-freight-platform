import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import LoadRouteMap from "@/components/loads/LoadRouteMap";
import PlaceBidModal from "@/components/loads/PlaceBidModal";
import StatusConfirmModal from "@/components/loads/StatusConfirmModal";
import { AvailableLoad } from "@/lib/available-loads";
import {
  fetchPendingBidForLoad,
  submitCarrierBid,
  type CarrierBid,
} from "@/lib/carrier-bids";
import { getAssignedStatusButtons, getLoadStatusMeta } from "@/lib/carrier-my-loads";
import { callSupport, openMapsNavigation } from "@/lib/load-actions";
import { formatDistance, formatDuration } from "@/lib/mapbox";
import { isLoadSaved, toggleSavedLoad } from "@/lib/saved-loads";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import { colors, radius, spacing } from "@/lib/theme";

export type LoadDetailSheetOptions = {
  variant?: "available" | "assigned";
  status?: string;
  loadId?: string;
};

export type LoadDetailSheetRef = {
  open: (load: AvailableLoad, options?: LoadDetailSheetOptions) => void;
  close: () => void;
};

type LoadDetailSheetProps = {
  onStatusUpdate?: (loadId: string, nextStatus: string) => Promise<void>;
};

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={colors.ink} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function getStatusConfirmation(nextStatus: string, load: AvailableLoad) {
  if (nextStatus === "in-transit") {
    return {
      title: "Confirm pickup",
      message:
        "By continuing, you confirm this load has been collected and is now in transit to the delivery location.",
      confirmLabel: "Confirm pickup",
      icon: "navigate-outline" as const,
    };
  }
  if (nextStatus === "delivered") {
    return {
      title: "Complete delivery",
      message:
        "By continuing, you confirm this shipment has been delivered and will be marked complete on your record.",
      confirmLabel: "Mark delivered",
      icon: "checkmark-done-outline" as const,
    };
  }
  return null;
}

type PendingConfirmation = {
  nextStatus: string;
  title: string;
  message: string;
  confirmLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function StatusBadge({ status }: { status: string }) {
  const meta = getLoadStatusMeta(status);
  const toneStyle =
    meta.tone === "success"
      ? styles.statusSuccess
      : meta.tone === "transit"
        ? styles.statusTransit
        : meta.tone === "active"
          ? styles.statusActive
          : styles.statusMuted;

  return (
    <View style={[styles.statusPill, toneStyle]}>
      <Text style={styles.statusPillText}>{meta.label}</Text>
    </View>
  );
}

const LoadDetailSheet = forwardRef<LoadDetailSheetRef, LoadDetailSheetProps>(
  ({ onStatusUpdate }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const [load, setLoad] = useState<AvailableLoad | null>(null);
    const [options, setOptions] = useState<LoadDetailSheetOptions>({ variant: "available" });
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [savingLoad, setSavingLoad] = useState(false);
    const [pendingBid, setPendingBid] = useState<CarrierBid | null>(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidLoading, setBidLoading] = useState(false);
    const [bidSuccess, setBidSuccess] = useState(false);
    const [bidError, setBidError] = useState<string | null>(null);
    const snapPoints = useMemo(() => ["55%", "92%"], []);

    const isAssigned = options.variant === "assigned";
    const assignedStatus = options.status ?? "";
    const statusButtons = useMemo(
      () => (isAssigned ? getAssignedStatusButtons(assignedStatus) : []),
      [isAssigned, assignedStatus]
    );

    const { route } = useLoadRoute(load?.origin ?? "", load?.destination ?? "", !!load);

    const refreshMarketplaceState = useCallback(async (nextLoad: AvailableLoad) => {
      const [saved, bid] = await Promise.all([
        isLoadSaved(nextLoad.id),
        fetchPendingBidForLoad(nextLoad.id),
      ]);
      setIsSaved(saved);
      setPendingBid(bid);
    }, []);

    useImperativeHandle(ref, () => ({
      open: (nextLoad, nextOptions) => {
        setLoad(nextLoad);
        setOptions(nextOptions ?? { variant: "available" });
        setBidSuccess(false);
        setBidError(null);
        setShowBidModal(false);
        if ((nextOptions?.variant ?? "available") === "available") {
          void refreshMarketplaceState(nextLoad);
        } else {
          setIsSaved(false);
          setPendingBid(null);
        }
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
      setLoad(null);
      setOptions({ variant: "available" });
      setUpdatingStatus(null);
      setPendingConfirm(null);
      setIsSaved(false);
      setPendingBid(null);
      setShowBidModal(false);
      setBidSuccess(false);
      setBidError(null);
    }, []);

    const handleToggleSave = useCallback(async () => {
      if (!load || savingLoad) return;
      setSavingLoad(true);
      try {
        const saved = await toggleSavedLoad(load.id);
        setIsSaved(saved);
      } catch {
        Alert.alert("Unable to save load", "Please try again.");
      } finally {
        setSavingLoad(false);
      }
    }, [load, savingLoad]);

    const handlePlaceBidPress = useCallback(() => {
      if (pendingBid) {
        Alert.alert("Bid already pending", `You already bid ${pendingBid.amountLabel} on this load.`);
        return;
      }
      setBidError(null);
      setBidSuccess(false);
      setShowBidModal(true);
    }, [pendingBid]);

    const handleBidSubmit = useCallback(
      async (amountText: string) => {
        if (!load) return;
        const amount = Number(amountText.replace(/,/g, ""));
        if (!Number.isFinite(amount) || amount <= 0) {
          setBidError("Enter a valid bid amount.");
          return;
        }

        setBidLoading(true);
        setBidError(null);
        try {
          await submitCarrierBid(load.id, amount);
          setBidSuccess(true);
          const bid = await fetchPendingBidForLoad(load.id);
          setPendingBid(bid);
          setTimeout(() => {
            setShowBidModal(false);
            setBidSuccess(false);
          }, 1600);
        } catch (error) {
          setBidError(error instanceof Error ? error.message : "Could not submit bid right now.");
        } finally {
          setBidLoading(false);
        }
      },
      [load]
    );

    const handleNavigatePickup = useCallback(() => {
      if (!load) return;
      void openMapsNavigation(load.origin);
    }, [load]);

    const handleNavigateDelivery = useCallback(() => {
      if (!load) return;
      void openMapsNavigation(load.destination);
    }, [load]);

    const executeStatusUpdate = useCallback(
      async (nextStatus: string) => {
        if (!options.loadId || !onStatusUpdate) return;
        setUpdatingStatus(nextStatus);
        try {
          await onStatusUpdate(options.loadId, nextStatus);
          setOptions((current) => ({ ...current, status: nextStatus }));
          setPendingConfirm(null);
        } finally {
          setUpdatingStatus(null);
        }
      },
      [onStatusUpdate, options.loadId]
    );

    const handleStatusPress = useCallback(
      (nextStatus: string) => {
        if (!load || !options.loadId || !onStatusUpdate) return;

        const confirmation = getStatusConfirmation(nextStatus, load);
        if (!confirmation) {
          void executeStatusUpdate(nextStatus);
          return;
        }

        setPendingConfirm({ nextStatus, ...confirmation });
      },
      [executeStatusUpdate, load, onStatusUpdate, options.loadId]
    );

    const handleConfirmDismiss = useCallback(() => {
      if (updatingStatus) return;
      setPendingConfirm(null);
    }, [updatingStatus]);

    return (
      <>
        <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        onDismiss={handleDismiss}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
        android_keyboardInputMode="adjustResize"
      >
        {load ? (
          <BottomSheetScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mapBlock}>
              <LoadRouteMap
                origin={load.origin}
                destination={load.destination}
                height={200}
                code={load.code}
                zoomable
              />
              <Pressable style={styles.closeBtn} onPress={() => sheetRef.current?.dismiss()}>
                <Ionicons name="close" size={18} color={colors.inkSoft} />
              </Pressable>
            </View>

            <View style={styles.badges}>
              <View style={styles.codePill}>
                <Text style={styles.codePillText}>{load.code}</Text>
              </View>
              {isAssigned && assignedStatus ? (
                <StatusBadge status={assignedStatus} />
              ) : (
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>Paid & live</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>
              {load.origin} → {load.destination}
            </Text>
            <Text style={styles.subtitle}>
              Pickup {load.pickupLabel} · {load.postedLabel}
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="navigate-outline" size={18} color={colors.ink} />
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{formatDistance(route?.distanceMeters)}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={18} color={colors.ink} />
                <Text style={styles.statLabel}>Est. time</Text>
                <Text style={styles.statValue}>{formatDuration(route?.durationSeconds)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Load details</Text>
              <DetailRow icon="cash-outline" label="Rate" value={load.priceLabel} />
              <DetailRow icon="bus-outline" label="Equipment" value={load.equipment} />
              <DetailRow icon="cube-outline" label="Commodity" value={load.commodity} />
              <DetailRow icon="location-outline" label="Pickup" value={load.origin} />
              <DetailRow icon="flag-outline" label="Delivery" value={load.destination} />
            </View>

            {isAssigned ? (
              <>
                <Text style={styles.actionsLabel}>Update details</Text>
                <View style={styles.statusBtnRow}>
                  {statusButtons.map((action, index) => {
                    const isPrimary = index === 0;
                    const isLoading = updatingStatus === action.nextStatus;
                    return (
                      <Pressable
                        key={action.nextStatus}
                        style={({ pressed }) => [
                          styles.statusBtn,
                          isPrimary ? styles.primaryBtn : styles.secondaryBtn,
                          !action.enabled && styles.btnDisabled,
                          pressed && action.enabled && styles.pressed,
                        ]}
                        disabled={!action.enabled || !!updatingStatus}
                        onPress={() => handleStatusPress(action.nextStatus)}
                      >
                        {isLoading ? (
                          <ActivityIndicator color={colors.ink} />
                        ) : (
                          <>
                            <Ionicons
                              name={action.icon}
                              size={18}
                              color={action.enabled ? colors.ink : colors.mutedLight}
                            />
                            <Text
                              style={[
                                isPrimary ? styles.primaryBtnText : styles.secondaryBtnText,
                                !action.enabled && styles.btnDisabledText,
                              ]}
                              numberOfLines={1}
                            >
                              {action.label}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <View style={styles.quickActionsRow}>
                  <Pressable
                    style={({ pressed }) => [styles.quickActionBtn, pressed && styles.pressed]}
                    onPress={() => void callSupport()}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.ink} />
                    <Text style={styles.quickActionText}>Call</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.quickActionBtn, pressed && styles.pressed]}
                    onPress={handleNavigatePickup}
                  >
                    <Ionicons name="navigate-outline" size={18} color={colors.ink} />
                    <Text style={styles.quickActionText}>Navigate</Text>
                  </Pressable>
                </View>

                {pendingBid ? (
                  <View style={styles.pendingBidBanner}>
                    <Ionicons name="time-outline" size={18} color={colors.ink} />
                    <Text style={styles.pendingBidText}>
                      Pending bid {pendingBid.amountLabel} · awaiting supplier review
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.marketplaceBtn,
                    styles.primaryBtn,
                    pendingBid && styles.btnDisabled,
                    pressed && !pendingBid && styles.pressed,
                  ]}
                  disabled={!!pendingBid}
                  onPress={handlePlaceBidPress}
                >
                  <Ionicons name="hammer-outline" size={18} color={colors.ink} />
                  <Text style={styles.marketplaceBtnPrimaryText}>
                    {pendingBid ? "Bid submitted" : "Place bid"}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.marketplaceBtn,
                    styles.secondaryBtn,
                    isSaved && styles.savedBtn,
                    pressed && styles.pressed,
                  ]}
                  disabled={savingLoad}
                  onPress={() => void handleToggleSave()}
                >
                  {savingLoad ? (
                    <ActivityIndicator color={colors.inkSoft} />
                  ) : (
                    <>
                      <Ionicons
                        name={isSaved ? "bookmark" : "bookmark-outline"}
                        size={18}
                        color={colors.inkSoft}
                      />
                      <Text style={styles.marketplaceBtnSecondaryText}>
                        {isSaved ? "Saved" : "Save load"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            )}

            {isAssigned ? (
              <View style={styles.quickActionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && styles.pressed]}
                  onPress={() => void callSupport()}
                >
                  <Ionicons name="call-outline" size={18} color={colors.ink} />
                  <Text style={styles.quickActionText}>Call</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && styles.pressed]}
                  onPress={handleNavigatePickup}
                >
                  <Ionicons name="navigate-outline" size={18} color={colors.ink} />
                  <Text style={styles.quickActionText}>Pickup</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && styles.pressed]}
                  onPress={handleNavigateDelivery}
                >
                  <Ionicons name="flag-outline" size={18} color={colors.ink} />
                  <Text style={styles.quickActionText}>Delivery</Text>
                </Pressable>
              </View>
            ) : null}
          </BottomSheetScrollView>
        ) : null}
      </BottomSheetModal>

      {load && showBidModal ? (
        <PlaceBidModal
          visible
          loadCode={load.code}
          routeLabel={`${load.origin} → ${load.destination}`}
          listedPrice={load.price}
          listedPriceLabel={load.priceLabel}
          defaultAmount={load.price > 0 ? String(load.price) : ""}
          loading={bidLoading}
          success={bidSuccess}
          error={bidError}
          onCancel={() => {
            if (bidLoading) return;
            setShowBidModal(false);
            setBidError(null);
            setBidSuccess(false);
          }}
          onSubmit={(amount) => void handleBidSubmit(amount)}
        />
      ) : null}

      {load && pendingConfirm ? (
        <StatusConfirmModal
          visible
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          confirmLabel={pendingConfirm.confirmLabel}
          loadCode={load.code}
          routeLabel={`${load.origin} → ${load.destination}`}
          icon={pendingConfirm.icon}
          loading={updatingStatus === pendingConfirm.nextStatus}
          onCancel={handleConfirmDismiss}
          onConfirm={() => void executeStatusUpdate(pendingConfirm.nextStatus)}
        />
      ) : null}
      </>
    );
  }
);

LoadDetailSheet.displayName = "LoadDetailSheet";

export default LoadDetailSheet;

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
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  mapBlock: {
    position: "relative",
    marginTop: spacing.xs,
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  codePill: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  codePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkSoft,
    fontVariant: ["tabular-nums"],
  },
  livePill: {
    backgroundColor: "rgba(5,150,105,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  livePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusSuccess: {
    backgroundColor: colors.brandSoft,
  },
  statusTransit: {
    backgroundColor: "#EFF6FF",
  },
  statusActive: {
    backgroundColor: "#FFFBEB",
  },
  statusMuted: {
    backgroundColor: colors.canvasMuted,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
    textTransform: "capitalize",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.ink,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    marginTop: -4,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCopy: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  actionsLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    marginTop: spacing.sm,
  },
  statusBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  primaryBtn: {
    backgroundColor: colors.brand,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  btnDisabled: {
    opacity: 0.45,
    borderColor: colors.border,
  },
  btnDisabledText: {
    color: colors.mutedLight,
  },
  marketplaceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.pill,
    paddingVertical: 16,
  },
  marketplaceBtnPrimaryText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  marketplaceBtnSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  savedBtn: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.ink,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  pendingBidBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pendingBidText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
