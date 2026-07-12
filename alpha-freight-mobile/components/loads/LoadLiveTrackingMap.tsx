import { StyleSheet, View } from "react-native";
import LoadInteractiveTrackingMap from "@/components/loads/LoadInteractiveTrackingMap";
import { hasDisplayableCarrierTracking, LoadLiveTracking } from "@/lib/load-gps-tracking";

type LoadLiveTrackingMapProps = {
  origin: string;
  destination: string;
  progress?: number;
  liveTracking?: LoadLiveTracking | null;
  loadStatus?: string | null;
};

/** Interactive Mapbox GL live tracking — pinch zoom, pan, route + GPS vehicle marker. */
export default function LoadLiveTrackingMap({
  origin,
  destination,
  progress = 0,
  liveTracking = null,
  loadStatus = null,
}: LoadLiveTrackingMapProps) {
  return (
    <View style={styles.fill}>
      <LoadInteractiveTrackingMap
        origin={origin}
        destination={destination}
        progress={progress}
        liveTracking={liveTracking}
        loadStatus={loadStatus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: "100%",
  },
});
