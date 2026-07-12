import googleServices from "./google-services.json";

function hasAndroidGoogleOAuthClient() {
  return (googleServices.client ?? []).some((client) =>
    (client.oauth_client ?? []).some((oauth) => oauth.client_type === 1)
  );
}

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
    backgroundColor: "#000000",
  },
    android: {
    package: "com.alphafreight.uk",
    googleServicesFile: "./google-services.json",
    versionCode: 15,
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      backgroundColor: "#000000",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
    ],
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.alphafreight.uk",
    infoPlist: {
      UIBackgroundModes: ["location"],
      NSLocationWhenInUseUsageDescription:
        "Alpha Freight uses your location to share live delivery tracking with the supplier during active shipments.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Alpha Freight uses your location in the background to keep live shipment tracking active while you drive.",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "@react-native-google-signin/google-signin",
    "expo-web-browser",
    "expo-video",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#000000",
        defaultChannel: "default",
        enableBackgroundRemoteNotifications: true,
      },
    ],
    "react-native-compressor",
    [
      "expo-image-picker",
      {
        photosPermission: "Allow Alpha Freight to access your photos to upload identity documents and reels.",
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
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: "merchant.com.alphafreight.uk",
        enableGooglePay: true,
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Alpha Freight uses your location in the background to keep live shipment tracking active while you drive.",
        locationWhenInUsePermission:
          "Alpha Freight uses your location to share live delivery tracking with the supplier during active shipments.",
        isAndroidBackgroundLocationEnabled: true,
        isIosBackgroundLocationEnabled: true,
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
    webApiUrl: process.env.EXPO_PUBLIC_WEB_API_URL ?? "",
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    renderBackendUrl: process.env.EXPO_PUBLIC_RENDER_BACKEND_URL ?? "",
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
    googleNativeAuthEnabled: hasAndroidGoogleOAuthClient(),
    eas: {
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "cbe95746-c88c-4cad-9d32-e6e35576e1ef",
    },
  },
};

export default config;
