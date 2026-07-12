import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import {
  buildStaticMapUrl,
  coordsToMapPosition,
  getMapboxToken,
  getPointAlongRoute,
} from "@/lib/mapbox";
import { colors, radius } from "@/lib/theme";

type LoadRouteMapProps = {
  origin: string;
  destination: string;
  height?: number;
  code?: string;
  zoomable?: boolean;
  progress?: number;
  live?: boolean;
  fill?: boolean;
};

function LivePulseDot() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + pulse.value * 0.5 }],
    opacity: 0.25 + (1 - pulse.value) * 0.35,
  }));

  return (
    <View style={styles.liveMarker}>
      <Animated.View style={[styles.liveMarkerRing, ringStyle]} />
      <View style={styles.liveMarkerCore} />
    </View>
  );
}

export default function LoadRouteMap({
  origin,
  destination,
  height = 120,
  code,
  zoomable = false,
  progress = 0,
  live = false,
  fill = false,
}: LoadRouteMapProps) {
  const token = getMapboxToken();
  const { originCoords, destCoords, route, loading } = useLoadRoute(origin, destination, !!token);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fallbackWidth = Math.round(Dimensions.get("window").width);
  const fallbackHeight = fill
    ? Math.max(320, Math.round(Dimensions.get("window").height * 0.46))
    : height;

  const renderWidth = containerWidth || fallbackWidth;
  const renderHeight = fill ? containerHeight || fallbackHeight : height;
  const mapPixelHeight = fill ? renderHeight : height;

  const vehicleCoords = useMemo(() => {
    if (!live || !route?.coordinates?.length) return null;
    const point = getPointAlongRoute(route.coordinates, progress);
    return point ? { lng: point.longitude, lat: point.latitude } : null;
  }, [live, progress, route?.coordinates]);

  const bounds = useMemo(() => {
    if (!originCoords || !destCoords) return null;
    const lngs = [originCoords.lng, destCoords.lng];
    const lats = [originCoords.lat, destCoords.lat];
    if (vehicleCoords) {
      lngs.push(vehicleCoords.lng);
      lats.push(vehicleCoords.lat);
    }
    route?.coordinates.forEach((point) => {
      lngs.push(point.longitude);
      lats.push(point.latitude);
    });
    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };
  }, [originCoords, destCoords, route?.coordinates, vehicleCoords]);

  const vehiclePosition = useMemo(() => {
    if (!vehicleCoords || !bounds) return null;
    return coordsToMapPosition(vehicleCoords, bounds, 0.12);
  }, [vehicleCoords, bounds]);

  const mapUrl = useMemo(() => {
    if (!originCoords || !destCoords || renderWidth <= 0 || mapPixelHeight <= 0) return null;
    return buildStaticMapUrl({
      width: renderWidth,
      height: mapPixelHeight,
      originCoords,
      destCoords,
      route: route?.coordinates,
      progress,
      live,
    });
  }, [renderWidth, mapPixelHeight, originCoords, destCoords, route?.coordinates, progress, live]);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
  }, [mapUrl]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height: layoutHeight } = event.nativeEvent.layout;
    const nextWidth = Math.round(width);
    const nextHeight = Math.round(layoutHeight);
    if (nextWidth > 0 && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
    if (fill && nextHeight > 0 && nextHeight !== containerHeight) {
      setContainerHeight(nextHeight);
    }
  };

  if (!token) {
    return (
      <View style={[styles.fallback, fill ? [styles.fill, { minHeight: fallbackHeight }] : { height }]}>
        <Ionicons name="map-outline" size={22} color={colors.mutedLight} />
        <Text style={styles.fallbackText}>Map preview unavailable</Text>
        {code ? <Text style={styles.codeLabel}>{code}</Text> : null}
      </View>
    );
  }

  const mapImage =
    mapUrl && !imageError ? (
      <Image
        source={{ uri: mapUrl }}
        style={[
          styles.mapImage,
          fill
            ? { position: "absolute", top: 0, left: 0, width: renderWidth, height: renderHeight }
            : { width: renderWidth, height },
          !imageReady && styles.mapImageHidden,
        ]}
        resizeMode={fill || live ? "contain" : "cover"}
        onLoad={() => setImageReady(true)}
        onError={() => setImageError(true)}
      />
    ) : null;

  const showLoading = loading || (mapUrl && !imageReady && !imageError);
  const showWaitingForCoords = !loading && !mapUrl && Boolean(origin || destination);

  return (
    <View
      style={[
        styles.wrap,
        fill ? [styles.fill, { minHeight: fallbackHeight }] : { height },
        live && styles.wrapLive,
      ]}
      onLayout={handleLayout}
    >
      <View style={styles.mapBase} />

      {mapImage ? (
        zoomable && Platform.OS === "ios" && !fill ? (
          <ScrollView
            style={styles.zoomScroll}
            contentContainerStyle={{ width: renderWidth, height }}
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

      {showLoading ? <View style={styles.shimmer} pointerEvents="none" /> : null}

      {imageError || showWaitingForCoords ? (
        <View style={styles.errorOverlay} pointerEvents="none">
          <Ionicons name="map-outline" size={20} color={colors.mutedLight} />
          <Text style={styles.errorText}>
            {imageError ? "Map could not load. Check connection." : "Finding route…"}
          </Text>
        </View>
      ) : null}

      {live && vehiclePosition && !route?.coordinates?.length ? (
        <View
          style={[
            styles.liveOverlayMarker,
            {
              left: vehiclePosition.left as `${number}%`,
              top: vehiclePosition.top as `${number}%`,
            },
          ]}
          pointerEvents="none"
        >
          <LivePulseDot />
        </View>
      ) : null}

      {live ? (
        <View style={styles.liveBadge} pointerEvents="none">
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>Live</Text>
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
    width: "100%",
  },
  wrapLive: {
    borderRadius: 0,
    borderWidth: 0,
  },
  fill: {
    flex: 1,
    width: "100%",
  },
  mapBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EEF1F4",
  },
  zoomScroll: {
    ...StyleSheet.absoluteFillObject,
  },
  mapImage: {
    backgroundColor: "#EEF1F4",
  },
  mapImageHidden: {
    opacity: 0,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(238,241,244,0.85)",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
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
    width: "100%",
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
  liveBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F97316",
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
  },
  liveOverlayMarker: {
    position: "absolute",
    marginLeft: -17,
    marginTop: -17,
  },
  liveMarker: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  liveMarkerRing: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand,
  },
  liveMarkerCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.ink,
  },
});
