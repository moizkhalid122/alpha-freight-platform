import { requireOptionalNativeModule } from "expo-modules-core";

export function isExpoVideoAvailable() {
  return requireOptionalNativeModule("ExpoVideo") != null;
}

type ExpoVideoModule = typeof import("expo-video");

let cachedModule: ExpoVideoModule | null | undefined;

export function getExpoVideoModule(): ExpoVideoModule | null {
  if (!isExpoVideoAvailable()) {
    return null;
  }

  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require("expo-video") as ExpoVideoModule;
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}
