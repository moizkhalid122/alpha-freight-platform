import { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import { hasDisplayableCarrierTracking, LoadLiveTracking } from "@/lib/load-gps-tracking";
import {
  buildLiveTrackingGpsUpdateScript,
  buildLiveTrackingMapHtml,
} from "@/lib/mapbox-live-map-html";
import { getMapboxToken } from "@/lib/mapbox";
import { getWebViewModule } from "@/lib/optional-webview";
import { colors } from "@/lib/theme";

type LoadInteractiveTrackingMapProps = {
  origin: string;
  destination: string;
  progress?: number;
  liveTracking?: LoadLiveTracking | null;
  loadStatus?: string | null;
};

export default function LoadInteractiveTrackingMap({
  origin,
  destination,
  progress = 0,
  liveTracking = null,
  loadStatus = null,
}: LoadInteractiveTrackingMapProps) {
  const token = getMapboxToken();
  const webViewRef = useRef<{ injectJavaScript: (script: string) => void } | null>(null);
  const { originCoords, destCoords, route, loading } = useLoadRoute(origin, destination, !!token);
  const WebView = getWebViewModule()?.WebView;
  const showCarrierMarker = hasDisplayableCarrierTracking(liveTracking, loadStatus);

  const mapHtml = useMemo(() => {
    if (!token || !originCoords || !destCoords || !route?.coordinates?.length) return null;

    return buildLiveTrackingMapHtml({
      token,
      originCoords,
      destCoords,
      route: route.coordinates,
      progress: 0,
      initialVehicle: showCarrierMarker && liveTracking
        ? {
            latitude: liveTracking.latitude,
            longitude: liveTracking.longitude,
            heading: liveTracking.heading,
          }
        : null,
    });
  }, [token, originCoords, destCoords, route?.coordinates, showCarrierMarker, liveTracking]);

  useEffect(() => {
    if (!webViewRef.current || !route?.coordinates?.length || !mapHtml) return;
    if (!showCarrierMarker || !liveTracking) return;

    webViewRef.current.injectJavaScript(
      buildLiveTrackingGpsUpdateScript({
        latitude: liveTracking.latitude,
        longitude: liveTracking.longitude,
        heading: liveTracking.heading,
      })
    );
  }, [showCarrierMarker, liveTracking, route?.coordinates, mapHtml]);

  if (!token) {
    return (
      <View style={styles.fallback}>
        <Ionicons name="map-outline" size={24} color={colors.mutedLight} />
        <Text style={styles.fallbackText}>Map preview unavailable</Text>
      </View>
    );
  }

  if (!WebView) {
    return (
      <View style={styles.fallback}>
        <Ionicons name="map-outline" size={24} color={colors.mutedLight} />
        <Text style={styles.fallbackText}>Interactive map unavailable on this build</Text>
      </View>
    );
  }

  if (loading || !mapHtml) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.ink} />
        <Text style={styles.loadingText}>Loading live map…</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ html: mapHtml }}
      style={styles.map}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      androidLayerType="hardware"
      setBuiltInZoomControls={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
    backgroundColor: "#EEF1F4",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#EEF1F4",
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EEF1F4",
    paddingHorizontal: 24,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
});
