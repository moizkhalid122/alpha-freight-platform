import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoogleAuthFlow } from "@/lib/use-google-auth-flow";
import { markWelcomeCompleted } from "@/lib/onboarding";
import { colors, radius, spacing } from "@/lib/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AUTO_PLAY_MS = 4500;

type Slide = {
  id: string;
  image: number;
  title: string;
  gradient: readonly [string, string, string, string];
};

const SLIDES: Slide[] = [
  {
    id: "1",
    image: require("@/assets/onboarding/slide-1-hero.jpg"),
    title: "Freight across the UK,\nall in one app",
    gradient: ["rgba(0,0,0,0.42)", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.8)"],
  },
  {
    id: "2",
    image: require("@/assets/onboarding/slide-2.png"),
    title: "Connect carriers\nand suppliers instantly",
    gradient: ["rgba(0,0,0,0.58)", "rgba(0,0,0,0.38)", "rgba(0,0,0,0.42)", "rgba(0,0,0,0.9)"],
  },
  {
    id: "3",
    image: require("@/assets/onboarding/slide-3.jpg"),
    title: "Track loads and\nmanage deliveries",
    gradient: ["rgba(0,0,0,0.48)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.85)"],
  },
  {
    id: "4",
    image: require("@/assets/onboarding/slide-4.png"),
    title: "Your trusted UK\nlogistics marketplace",
    gradient: ["rgba(0,0,0,0.44)", "rgba(0,0,0,0.14)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.82)"],
  },
];

export default function WelcomeScreen() {
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const { finishGoogleAuth } = useGoogleAuthFlow();

  const scrollToIndex = useCallback((index: number, animated = true) => {
    listRef.current?.scrollToIndex({ index, animated });
    activeIndexRef.current = index;
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (activeIndexRef.current + 1) % SLIDES.length;
      scrollToIndex(next);
    }, AUTO_PLAY_MS);

    return () => clearInterval(timer);
  }, [scrollToIndex]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (index != null) {
        activeIndexRef.current = index;
        setActiveIndex(index);
      }
    }
  ).current;

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  const goToSignup = () => {
    void markWelcomeCompleted();
    router.push("/signup");
  };

  const goToLogin = () => {
    void markWelcomeCompleted();
    router.push("/login");
  };

  const handleGoogleSignUp = async () => {
    await finishGoogleAuth({
      role: "carrier",
      mode: "signup",
    });
  };

  const activeSlide = SLIDES[activeIndex];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <ImageBackground source={item.image} style={styles.slide} resizeMode="cover">
            <LinearGradient
              colors={[...item.gradient]}
              locations={[0, 0.32, 0.52, 1]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        )}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.progressRow}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.progressSegment, index === activeIndex && styles.progressActive]}
            />
          ))}
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Alpha Freight</Text>
          <Text style={styles.title}>{activeSlide.title}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.buttonPrimary,
              pressed && styles.buttonPrimaryPressed,
            ]}
            onPress={goToSignup}
          >
            <LinearGradient
              colors={[colors.premiumGreen, colors.premiumGreenDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonPrimaryGradient}
            >
              <Text style={styles.buttonPrimaryText}>Create account</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.buttonGoogle,
              pressed && styles.buttonGooglePressed,
            ]}
            onPress={() => void handleGoogleSignUp()}
          >
            <Image source={require("@/assets/google-icon.png")} style={styles.googleIcon} />
            <Text style={styles.buttonGoogleText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.buttonGhost, pressed && styles.buttonGhostPressed]}
            onPress={goToLogin}
          >
            <Text style={styles.buttonGhostText}>I already have an account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  progressActive: {
    backgroundColor: colors.white,
  },
  hero: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: spacing.lg,
    maxWidth: 320,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.72)",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "600",
    letterSpacing: -0.4,
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.28)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  buttonPrimary: {
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  buttonPrimaryGradient: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    letterSpacing: 0.15,
  },
  buttonPrimaryPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  buttonGoogle: {
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  buttonGoogleText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  buttonGhost: {
    height: 54,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGhostText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  buttonGooglePressed: {
    backgroundColor: "#F3F4F6",
    transform: [{ scale: 0.985 }],
  },
  buttonGoogleDisabled: {
    opacity: 0.75,
  },
  buttonGhostPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ scale: 0.985 }],
  },
});
