export function buildSplashVideoHtml(videoUri: string) {
  const src = JSON.stringify(videoUri);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    background: #ffffff;
    overflow: hidden;
  }
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #ffffff;
  }
</style>
</head>
<body>
  <video
    id="splash"
    src=${src}
    playsinline
    webkit-playsinline
    x5-playsinline
    autoplay
    muted
    preload="auto"
  ></video>
  <script>
    const video = document.getElementById("splash");

    function notify(type) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type }));
      }
    }

    function attemptPlay() {
      if (!video) return;
      const playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          video.muted = true;
          video.play().catch(function () {
            notify("error");
          });
        });
      }
    }

    video.addEventListener("ended", function () {
      notify("ended");
    });

    video.addEventListener("error", function () {
      notify("error");
    });

    video.addEventListener("loadeddata", attemptPlay, { once: true });
    attemptPlay();
  </script>
</body>
</html>`;
}
