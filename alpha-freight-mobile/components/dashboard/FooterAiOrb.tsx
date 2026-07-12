import { memo, useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { colors, shadow } from "@/lib/theme";

export const FOOTER_ORB_SIZE = 62;

const ORB_LOTTIE = require("@/assets/lottie/orb-ai-assistant.json");

/**
 * Isolated footer AI orb — memo + AppState pause keeps Lottie smooth without tab lag.
 * Parent tab bar can re-render freely; this component stays mounted once.
 */
function FooterAiOrb() {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    const syncPlayback = (state: AppStateStatus) => {
      if (state === "active") {
        lottieRef.current?.play();
        return;
      }
      lottieRef.current?.pause();
    };

    syncPlayback(AppState.currentState);
    const sub = AppState.addEventListener("change", syncPlayback);
    return () => sub.remove();
  }, []);

  const openAssistant = useCallback(() => {
    router.push("/ai-assistant");
  }, []);

  return (
    <Pressable
      style={({ pressed }) => [styles.orbBtn, pressed && styles.orbPressed]}
      onPress={openAssistant}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Alpha Assistant"
    >
      <View style={styles.orbRing} collapsable={false}>
        <LottieView
          ref={lottieRef}
          source={ORB_LOTTIE}
          autoPlay
          loop
          cacheComposition
          renderMode={Platform.OS === "android" ? "HARDWARE" : "AUTOMATIC"}
          hardwareAccelerationAndroid
          enableMergePathsAndroidForKitKatAndAbove
          style={styles.orbLottie}
        />
      </View>
      <Text style={styles.orbLabel}>AI</Text>
    </Pressable>
  );
}

export default memo(FooterAiOrb);

const styles = StyleSheet.create({
  orbBtn: {
    alignItems: "center",
    gap: 2,
  },
  orbPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  orbRing: {
    width: FOOTER_ORB_SIZE,
    height: FOOTER_ORB_SIZE,
    borderRadius: FOOTER_ORB_SIZE / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...shadow.soft,
  },
  orbLottie: {
    width: FOOTER_ORB_SIZE - 6,
    height: FOOTER_ORB_SIZE - 6,
  },
  orbLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 0.6,
  },
});
