import { useCallback } from "react";
import { Share } from "react-native";
import { FeedPost } from "@/lib/feed-posts";

export function useReelShare(post: FeedPost) {
  return useCallback(async () => {
    await Share.share({
      title: post.headline,
      message: `${post.headline}\n\n${post.content}\n\n— ${post.author} on Alpha Freight`,
    });
  }, [post.author, post.content, post.headline]);
}
