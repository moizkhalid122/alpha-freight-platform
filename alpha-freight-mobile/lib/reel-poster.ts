let thumbnailsUnavailable = false;

export async function generateReelPosterFromVideo(localUri: string) {
  const trimmed = localUri.trim();
  if (!trimmed || thumbnailsUnavailable) return null;

  try {
    const VideoThumbnails = await import("expo-video-thumbnails");
    const { uri } = await VideoThumbnails.getThumbnailAsync(trimmed, {
      time: 500,
      quality: 0.82,
    });
    return uri || null;
  } catch {
    thumbnailsUnavailable = true;
    if (__DEV__) {
      console.warn(
        "[reel-poster] Auto thumbnail skipped. Rebuild the dev client after installing expo-video-thumbnails, or pick a cover manually."
      );
    }
    return null;
  }
}
