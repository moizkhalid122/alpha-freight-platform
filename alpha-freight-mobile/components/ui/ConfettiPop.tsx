import { useEffect } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import LottieView from "lottie-react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type ConfettiPopProps = {
  delay?: number;
};

export default function ConfettiPop({ delay = 80 }: ConfettiPopProps) {
  const progress = useSharedValue(0);
  const confettiHeight = SCREEN_HEIGHT * 0.5;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(1, {
        damping: 16,
        stiffness: 110,
        mass: 0.75,
      })
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    }),
    transform: [
      { translateY: confettiHeight * 0.35 * (1 - progress.value) },
      { scale: 0.88 + progress.value * 0.12 },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { height: confettiHeight }, animatedStyle]}>
      <LottieView
        source={require("@/assets/lottie/confetti-pop.json")}
        autoPlay
        loop={false}
        resizeMode="cover"
        style={styles.lottie}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    overflow: "hidden",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
});
