import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadLiveTrackingMap from "@/components/loads/LoadLiveTrackingMap";
import { useLoadLiveTracking } from "@/hooks/useLoadLiveTracking";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import {
  formatMotionDuration,
  formatSpeedMps,
  formatTraveledDistance,
  isFreshLiveGps,
} from "@/lib/load-gps-tracking";
import { formatDistance, formatDuration, getMapboxToken } from "@/lib/mapbox";
import { callSupport, openMapsNavigation } from "@/lib/load-actions";
import {
  SupplierMyPost,
  fetchSupplierPostById,
  getSupplierPostStatusMeta,
} from "@/lib/supplier-my-posts";
import {
  getCachedSupplierPostById,
} from "@/lib/supplier-my-posts-cache";
import { useTransitionReady } from "@/lib/use-after-transition";
import { colors, radius, spacing } from "@/lib/theme";

function formatRemainingDistance(totalMeters: number | null | undefined, traveledMeters?: number | null) {
  if (!totalMeters || totalMeters <= 0) return "—";
  if (traveledMeters == null || traveledMeters <= 0) {
    return formatDistance(totalMeters);
  }
  return formatDistance(Math.max(0, totalMeters - traveledMeters));
}

export default function LoadTrackingScreen() {
  const { loadId } = useLocalSearchParams<{ loadId?: string }>();
  const id = loadId ? String(loadId) : "";
  const [post, setPost] = useState<SupplierMyPost | null>(() =>
    id ? getCachedSupplierPostById(id) : null
  );
  const [loading, setLoading] = useState(() => !id || !getCachedSupplierPostById(id));
  const [controlsOpen, setControlsOpen] = useState(false);
  const mapsEnabled = Boolean(getMapboxToken());
  const transitionReady = useTransitionReady();

  const { route } = useLoadRoute(
    post?.origin ?? "",
    post?.destination ?? "",
    !!post && transitionReady
  );
  const { snapshot: liveTracking, hasGps, loading: liveLoading, refresh } = useLoadLiveTracking(
    transitionReady ? loadId : null,
    post?.status
  );

  const loadPost = useCallback(async () => {
    if (!loadId) {
      router.replace("/load-tracking");
      return;
    }

    const cached = getCachedSupplierPostById(String(loadId));
    if (!cached) setLoading(true);
    const result = await fetchSupplierPostById(String(loadId));
    if (!result) {
      router.replace("/load-tracking");
      return;
    }
    setPost(result);
    setLoading(false);
  }, [loadId]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  useFocusEffect(
    useCallback(() => {
      void loadPost();
      void refresh();
    }, [loadPost, refresh])
  );

  const statusMeta = useMemo(
    () =>
      post
        ? getSupplierPostStatusMeta(
            post.status,
            post.paymentState,
            post.needsPodReview,
            post.bankTransferStatus
          )
        : null,
    [post]
  );

  const waitingHint = useMemo(() => {
    if (!post) return "";
    if (!post.carrierId) return "Waiting for a carrier to accept this load…";
    if (post.status !== "in-transit" && post.status !== "loading") {
      return "Waiting for carrier to confirm pickup and start live GPS…";
    }
    return "Waiting for carrier live GPS signal…";
  }, [post]);

  if (loading || !post) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  const showLiveStats = hasGps && liveTracking;
  const isLiveGpsActive = isFreshLiveGps(liveTracking);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>{post.code}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {post.origin} → {post.destination}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.statsPanel}>
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>
              {showLiveStats
                ? formatSpeedMps(liveTracking.speed_mps)
                : liveLoading
                  ? "…"
                  : "— mph"}
            </Text>
            <Text style={styles.statLabel}>Current speed</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>
              {showLiveStats ? formatSpeedMps(liveTracking.avg_speed_mps) : "— mph"}
            </Text>
            <Text style={styles.statLabel}>Average speed</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>
              {showLiveStats ? formatMotionDuration(liveTracking.motion_seconds) : "—"}
            </Text>
            <Text style={styles.statLabel}>In motion</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>
              {showLiveStats
                ? formatTraveledDistance(liveTracking.traveled_meters)
                : formatDistance(route?.distanceMeters ?? null)}
            </Text>
            <Text style={styles.statLabel}>{showLiveStats ? "Traveled" : "Route distance"}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Route {formatDistance(route?.distanceMeters ?? null)} · ETA {formatDuration(route?.durationSeconds ?? null)}
          </Text>
          <Text style={styles.metaText}>
            Remaining {formatRemainingDistance(route?.distanceMeters ?? null, liveTracking?.traveled_meters)}
          </Text>
          {!showLiveStats ? <Text style={styles.metaHint}>{waitingHint}</Text> : null}
          {showLiveStats && !isLiveGpsActive ? (
            <Text style={styles.metaHintMuted}>Showing last saved carrier position</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.mapSection} pointerEvents="box-none">
        {mapsEnabled && transitionReady ? (
          <LoadLiveTrackingMap
            origin={post.origin}
            destination={post.destination}
            liveTracking={liveTracking}
            loadStatus={post.status}
          />
        ) : mapsEnabled ? (
          <View style={[styles.mapFallback, styles.mapFallbackFill]} />
        ) : (
          <View style={[styles.mapFallback, styles.mapFallbackFill]}>
            <Ionicons name="map-outline" size={28} color={colors.mutedLight} />
            <Text style={styles.mapFallbackText}>Map preview unavailable</Text>
          </View>
        )}

        <View style={styles.statusChip} pointerEvents="none">
          <View style={[styles.statusDot, isLiveGpsActive && styles.statusDotLive]} />
          <Text style={styles.statusChipText}>
            {isLiveGpsActive ? "Live GPS" : showLiveStats ? "Last GPS fix" : statusMeta?.label ?? post.statusLabel}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.controlsBtn, pressed && styles.pressed]}
          onPress={() => setControlsOpen(true)}
          pointerEvents="auto"
        >
          <Text style={styles.controlsBtnText}>Controls</Text>
        </Pressable>
      </View>

      <Modal visible={controlsOpen} transparent animationType="slide" onRequestClose={() => setControlsOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setControlsOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Tracking controls</Text>
            <Text style={styles.modalSub}>{post.code} · {post.priceLabel}</Text>

            <Pressable
              style={styles.modalAction}
              onPress={() => {
                setControlsOpen(false);
                void openMapsNavigation(post.origin);
              }}
            >
              <Ionicons name="navigate-outline" size={18} color={colors.ink} />
              <Text style={styles.modalActionText}>Navigate to pickup</Text>
            </Pressable>

            <Pressable
              style={styles.modalAction}
              onPress={() => {
                setControlsOpen(false);
                void openMapsNavigation(post.destination);
              }}
            >
              <Ionicons name="flag-outline" size={18} color={colors.ink} />
              <Text style={styles.modalActionText}>Navigate to delivery</Text>
            </Pressable>

            <Pressable
              style={styles.modalAction}
              onPress={() => {
                setControlsOpen(false);
                router.push(`/supplier-load/${post.id}`);
              }}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.ink} />
              <Text style={styles.modalActionText}>View load details</Text>
            </Pressable>

            <Pressable
              style={styles.modalAction}
              onPress={() => {
                setControlsOpen(false);
                router.push("/load-tracking");
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color={colors.ink} />
              <Text style={styles.modalActionText}>Switch load</Text>
            </Pressable>

            <Pressable
              style={styles.modalAction}
              onPress={() => {
                setControlsOpen(false);
                void callSupport();
              }}
            >
              <Ionicons name="help-circle-outline" size={18} color={colors.ink} />
              <Text style={styles.modalActionText}>Contact support</Text>
            </Pressable>

            <Pressable style={styles.modalClose} onPress={() => setControlsOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  loadingRoot: { flex: 1, alignItems: "center", justifyContent: "center" },
  safeTop: { backgroundColor: colors.white },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvasMuted,
  },
  headerCopy: { flex: 1, gap: 2 },
  headerEyebrow: { fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  statsPanel: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderColor: "#EEF2F5",
  },
  statCell: {
    width: "50%",
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: "500", color: colors.ink, letterSpacing: -0.5 },
  statLabel: { fontSize: 13, fontWeight: "500", color: colors.muted },
  metaRow: { gap: 4, paddingTop: 2 },
  metaText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  metaHint: { fontSize: 12, fontWeight: "700", color: "#F97316" },
  metaHintMuted: { fontSize: 12, fontWeight: "600", color: colors.muted },
  mapSection: { flex: 1, minHeight: 340, position: "relative", backgroundColor: "#EEF1F4" },
  mapFallback: { alignItems: "center", justifyContent: "center", gap: 8 },
  mapFallbackFill: { flex: 1 },
  mapFallbackText: { fontSize: 14, color: colors.muted },
  statusChip: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F97316" },
  statusDotLive: { backgroundColor: "#22C55E" },
  statusChipText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  controlsBtn: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 28,
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  controlsBtnText: { fontSize: 17, fontWeight: "800", color: colors.ink },
  pressed: { opacity: 0.92 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: 10,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.ink },
  modalSub: { fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: spacing.sm },
  modalAction: {
    minHeight: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.canvasMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  modalActionText: { fontSize: 15, fontWeight: "700", color: colors.ink },
  modalClose: {
    marginTop: spacing.sm,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: { fontSize: 15, fontWeight: "700", color: colors.muted },
});
