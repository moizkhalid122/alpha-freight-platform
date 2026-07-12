import { Image } from "react-native";
import { optimizeFeedImageUrl } from "@/lib/feed-image-url";
import type { FeedPost } from "@/lib/feed-posts";

export function prefetchReelPosters(reels: FeedPost[], indices: number[]) {
  indices.forEach((index) => {
    const reel = reels[index];
    if (!reel) return;

    const poster = reel.videoPosterSrc?.trim() || reel.imageSrc?.trim();
    if (poster) {
      void Image.prefetch(optimizeFeedImageUrl(poster, 720));
    }
  });
}

export function prefetchAdjacentReelPosters(reels: FeedPost[], activeIndex: number) {
  prefetchReelPosters(reels, [activeIndex, activeIndex + 1]);
}
