import { requireOptionalNativeModule } from "expo-modules-core";

export function isWebViewAvailable() {
  return requireOptionalNativeModule("RNCWebViewModule") != null;
}

/** Web HTML video avoids Android expo-video surface/layer bugs. Prefer it when installed. */
export function shouldUseWebViewForReels() {
  return isWebViewAvailable();
}

type WebViewModule = typeof import("react-native-webview");

let cachedModule: WebViewModule | null | undefined;

export function getWebViewModule(): WebViewModule | null {
  if (!isWebViewAvailable()) {
    return null;
  }

  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require("react-native-webview") as WebViewModule;
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}

export function buildReelStopScript() {
  return `(function(){
    try {
      var v = document.getElementById("reel");
      if (!v) return;
      v.pause();
      v.muted = true;
      v.volume = 0;
      v.currentTime = 0;
      v.removeAttribute("src");
      v.load();
    } catch (e) {}
  })(); true;`;
}

export function buildReelPlayerHtml(videoUri: string, posterUri?: string) {
  const src = JSON.stringify(videoUri);
  const poster = posterUri ? ` poster=${JSON.stringify(posterUri)}` : "";
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }
</style>
</head>
<body>
  <video
    id="reel"
    src=${src}${poster}
    playsinline
    webkit-playsinline
    x5-playsinline
    loop
    preload="metadata"
    muted
  ></video>
  <script>
    const video = document.getElementById("reel");
    let landscape = false;

    function postOrientation() {
      if (!video || !video.videoWidth || !video.videoHeight) return;
      landscape = video.videoWidth > video.videoHeight;
      video.style.objectFit = landscape ? "contain" : "cover";
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "orientation", landscape }));
      }
    }

    function attemptPlay() {
      if (!video) return;
      const playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          video.muted = true;
          video.play().catch(function () {});
        });
      }
    }

    function sync(active, soundMuted, paused, landscapeHint) {
      if (!video) return;
      landscape = Boolean(landscapeHint);
      video.muted = Boolean(soundMuted);
      video.style.objectFit = landscape ? "contain" : "cover";
      if (active && !paused) {
        if (video.readyState < 2) video.preload = "auto";
        attemptPlay();
      } else {
        video.pause();
        if (!active) {
          video.muted = true;
          video.volume = 0;
        }
      }
    }

    video.addEventListener("loadedmetadata", postOrientation, { once: true });

    video.addEventListener("ended", function () {
      if (!video) return;
      video.currentTime = 0;
      attemptPlay();
    });

    window.__reelSync = sync;
  </script>
</body>
</html>`;
}

export function buildReelSyncScript(
  isActive: boolean,
  muted: boolean,
  paused: boolean,
  isLandscape: boolean
) {
  return `window.__reelSync && window.__reelSync(${isActive ? "true" : "false"}, ${muted ? "true" : "false"}, ${paused ? "true" : "false"}, ${isLandscape ? "true" : "false"}); true;`;
}
