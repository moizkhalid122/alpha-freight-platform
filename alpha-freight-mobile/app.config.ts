const config = {
  name: "Alpha Freight",
  slug: "alpha-freight-mobile",
  version: "2.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "alphafreight",
  splash: {
    image: "./assets/logo.png",
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.alphafreight.uk",
  },
    android: {
    package: "com.alphafreight.uk",
    googleServicesFile: "./google-services.json",
    versionCode: 5,
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      backgroundColor: "#151B24",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#151B24",
        defaultChannel: "default",
        enableBackgroundRemoteNotifications: true,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow Alpha Freight to access your photos to upload identity documents.",
        cameraPermission: "Allow Alpha Freight to use the camera to capture identity documents.",
      },
    ],
    [
      "expo-speech-recognition",
      {
        microphonePermission: "Allow Alpha Freight to use the microphone for voice messages to the AI assistant.",
        speechRecognitionPermission: "Allow Alpha Freight to convert your speech into text for the AI assistant.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "",
    aiApiUrl: process.env.EXPO_PUBLIC_AI_API_URL ?? "",
    eas: {
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "cbe95746-c88c-4cad-9d32-e6e35576e1ef",
    },
  },
};

export default config;
