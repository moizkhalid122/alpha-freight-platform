import { useCallback, useEffect, useRef } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import * as ExpoSplashScreen from "expo-splash-screen";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@/lib/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CIRCLE_SIZE = 96;
const FILL_SCALE = Math.ceil((Math.hypot(SCREEN_W, SCREEN_H) / CIRCLE_SIZE) * 1.2);

const EXPAND_MS = 760;
const SHRINK_DELAY_MS = 120;
const SHRINK_MS = 760;
const LOGO_IN_DELAY_MS = 200;
const LOGO_IN_MS = 520;
const TITLE_DELAY_MS = EXPAND_MS + SHRINK_DELAY_MS + SHRINK_MS + 180;
const TITLE_IN_MS = 450;

type SplashScreenProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const circleScale = useSharedValue(0);
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(10);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const finishAfterHold = useCallback(() => {
    holdTimerRef.current = setTimeout(onFinish, 550);
  }, [onFinish]);

  useEffect(() => {
    void ExpoSplashScreen.hideAsync();

    circleScale.value = withSequence(
      withTiming(FILL_SCALE, { duration: EXPAND_MS, easing: Easing.out(Easing.cubic) }),
      withDelay(
        SHRINK_DELAY_MS,
        withTiming(0, { duration: SHRINK_MS, easing: Easing.in(Easing.cubic) })
      )
    );

    logoScale.value = withDelay(
      LOGO_IN_DELAY_MS,
      withTiming(1, { duration: LOGO_IN_MS, easing: Easing.out(Easing.cubic) })
    );
    logoOpacity.value = withDelay(LOGO_IN_DELAY_MS, withTiming(1, { duration: LOGO_IN_MS - 80 }));

    titleOpacity.value = withDelay(
      TITLE_DELAY_MS,
      withTiming(1, { duration: TITLE_IN_MS, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(finishAfterHold)();
        }
      })
    );
    titleTranslateY.value = withDelay(
      TITLE_DELAY_MS,
      withTiming(0, { duration: TITLE_IN_MS, easing: Easing.out(Easing.cubic) })
    );

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, [circleScale, finishAfterHold, logoOpacity, logoScale, titleOpacity, titleTranslateY]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="auto">
      <View style={styles.stage}>
        <Animated.View style={[styles.circle, circleStyle]} />

        <View style={styles.centerColumn} pointerEvents="none">
          <Animated.View style={[styles.logoWrap, logoStyle]}>
            <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.View style={[styles.titleWrap, titleStyle]}>
            <Text style={styles.titleMain}>Alpha Freight</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const LOGO_SIZE = 96;
const CIRCLE_LEFT = (SCREEN_W - CIRCLE_SIZE) / 2;
const CIRCLE_TOP = (SCREEN_H - CIRCLE_SIZE) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerColumn: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    width: "100%",
  },
  circle: {
    position: "absolute",
    left: CIRCLE_LEFT,
    top: CIRCLE_TOP,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.brand,
    zIndex: 1,
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  titleWrap: {
    alignItems: "center",
    marginTop: 14,
    width: "100%",
  },
  titleMain: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.white,
    textAlign: "center",
  },
});
