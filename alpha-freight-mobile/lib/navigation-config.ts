import { colors } from "@/lib/theme";

type StackScreenOptions = {
  headerShown?: boolean;
  animation?: "slide_from_right" | "slide_from_bottom" | "fade" | "none";
  animationDuration?: number;
  gestureEnabled?: boolean;
  fullScreenGestureEnabled?: boolean;
  contentStyle?: { backgroundColor?: string };
  presentation?: "modal";
};

/** Default stack push — native slide, white background (no flash). */
export const smoothStackScreenOptions: StackScreenOptions = {
  headerShown: false,
  animation: "slide_from_right",
  animationDuration: 220,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  contentStyle: { backgroundColor: colors.white },
};

export const smoothModalScreenOptions: StackScreenOptions = {
  ...smoothStackScreenOptions,
  animation: "slide_from_bottom",
  presentation: "modal",
};

export const smoothFadeScreenOptions: StackScreenOptions = {
  ...smoothStackScreenOptions,
  animation: "fade",
  animationDuration: 220,
};

export const smoothInstantScreenOptions: StackScreenOptions = {
  ...smoothStackScreenOptions,
  animation: "none",
};

/** Bottom tabs — lazy mount; freeze inactive tabs to cut lag. */
export const smoothTabScreenOptions = {
  headerShown: false,
  lazy: true,
  freezeOnBlur: true,
  sceneStyle: { backgroundColor: colors.white },
};
