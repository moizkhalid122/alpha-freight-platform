import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import { buildStaticMapUrl, getMapboxToken } from "@/lib/mapbox";
import { colors, radius } from "@/lib/theme";

type LoadRouteMapProps = {
  origin: string;
  destination: string;
  height?: number;
  code?: string;
  zoomable?: boolean;
};

export default function LoadRouteMap({
  origin,
  destination,
  height = 120,
  code,
  zoomable = false,
}: LoadRouteMapProps) {
  const token = getMapboxToken();
  const { originCoords, destCoords, route, loading } = useLoadRoute(origin, destination, !!token);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  const mapWidth = useMemo(() => Math.round(Dimensions.get("window").width - 64), []);

  const mapUrl = useMemo(() => {
    if (!originCoords || !destCoords) return null;
    return buildStaticMapUrl({
      width: mapWidth,
      height,
      originCoords,
      destCoords,
      route: route?.coordinates,
    });
  }, [originCoords, destCoords, route, height, mapWidth]);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
  }, [mapUrl]);

  if (!token) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Ionicons name="map-outline" size={22} color={colors.mutedLight} />
        <Text style={styles.fallbackText}>Map preview unavailable</Text>
        {code ? <Text style={styles.codeLabel}>{code}</Text> : null}
      </View>
    );
  }

  const mapImage = mapUrl && !imageError ? (
    <Image
      source={{ uri: mapUrl }}
      style={[
        styles.mapImage,
        { width: mapWidth, height },
        !imageReady && styles.mapImageHidden,
      ]}
      resizeMode="cover"
      onLoad={() => setImageReady(true)}
      onError={() => setImageError(true)}
    />
  ) : null;

  return (
    <View style={[styles.wrap, { height }]}>
      <View style={styles.mapBase} />

      {mapImage ? (
        zoomable && Platform.OS === "ios" ? (
          <ScrollView
            style={styles.zoomScroll}
            contentContainerStyle={{ width: mapWidth, height }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            centerContent
            bouncesZoom
            nestedScrollEnabled
          >
            {mapImage}
          </ScrollView>
        ) : (
          mapImage
        )
      ) : null}

      {(loading || (mapUrl && !imageReady && !imageError)) && (
        <View style={styles.shimmer} pointerEvents="none" />
      )}

      {imageError ? (
        <View style={styles.errorOverlay} pointerEvents="none">
          <Ionicons name="map-outline" size={20} color={colors.mutedLight} />
          <Text style={styles.errorText}>Route map loading…</Text>
        </View>
      ) : null}

      {code ? (
        <View style={styles.codeBadge} pointerEvents="none">
          <Text style={styles.codeLabel}>{code}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#EEF1F4",
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#EEF1F4",
  },
  zoomScroll: {
    ...StyleSheet.absoluteFill,
  },
  mapImage: {
    backgroundColor: "#EEF1F4",
  },
  mapImageHidden: {
    opacity: 0,
  },
  shimmer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(238,241,244,0.85)",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  fallback: {
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  codeBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.4,
  },
});
