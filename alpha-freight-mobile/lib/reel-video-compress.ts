import { Video } from "react-native-compressor";

export type ReelVideoCompressResult = {
  uri: string;
  compressed: boolean;
};

/** 720p portrait target — good quality + fast streaming on mobile data. */
const REEL_MAX_EDGE = 720;
const REEL_BITRATE = 2_800_000;
const MIN_SIZE_MB = 3;

export async function compressReelVideoForUpload(
  localUri: string,
  onProgress?: (progress: number) => void
): Promise<ReelVideoCompressResult> {
  const trimmed = localUri.trim();
  if (!trimmed) {
    return { uri: localUri, compressed: false };
  }

  try {
    const compressedUri = await Video.compress(
      trimmed,
      {
        compressionMethod: "manual",
        maxSize: REEL_MAX_EDGE,
        bitrate: REEL_BITRATE,
        minimumFileSizeForCompress: MIN_SIZE_MB,
      },
      (progress) => {
        onProgress?.(Math.round(progress * 100));
      }
    );

    return {
      uri: compressedUri || trimmed,
      compressed: Boolean(compressedUri && compressedUri !== trimmed),
    };
  } catch {
    return { uri: trimmed, compressed: false };
  }
}
