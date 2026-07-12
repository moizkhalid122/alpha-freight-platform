import { useState } from "react";
import { isExpoVideoAvailable } from "@/lib/optional-expo-video";
import ReelSlideVideo from "@/components/feed/ReelSlideVideo";
import ReelSlideWeb from "@/components/feed/ReelSlideWeb";
import { FeedPost } from "@/lib/feed-posts";

export type ReelSlideProps = {
  post: FeedPost;
  isActive: boolean;
  isPreload?: boolean;
  playbackEnabled?: boolean;
  height: number;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  bottomInset?: number;
  viewerRole: "carrier" | "supplier";
  onLike: () => void;
  onUnlike: () => void;
  onOpenComments: () => void;
};

export default function ReelSlide(props: ReelSlideProps) {
  const [forceWeb, setForceWeb] = useState(false);
  const canUseNative = isExpoVideoAvailable() && !forceWeb;

  if (canUseNative) {
    return (
      <ReelSlideVideo
        {...props}
        onNativePlaybackFailed={() => setForceWeb(true)}
      />
    );
  }

  return <ReelSlideWeb {...props} />;
}
