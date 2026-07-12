import { router } from "expo-router";
import type { FeedPost } from "@/lib/feed-posts";
import type { FeedPublisherProfile } from "@/lib/feed-publish";

export type FeedProfileRouteParams = {
  profileKey: string;
  name: string;
  role: string;
  avatarSrc?: string;
  authorId?: string;
  viewerRole: "carrier" | "supplier";
};

export function openFeedProfile(input: FeedProfileRouteParams) {
  if (!input.profileKey.trim()) return;

  router.push({
    pathname: "/feed-profile",
    params: {
      profileKey: input.profileKey,
      name: input.name,
      role: input.role,
      avatarSrc: input.avatarSrc || "",
      authorId: input.authorId || "",
      viewerRole: input.viewerRole,
    },
  });
}

export function openFeedProfileFromPost(
  post: FeedPost,
  viewerRole: "carrier" | "supplier"
) {
  if (!post.authorProfileKey.trim()) return;

  openFeedProfile({
    profileKey: post.authorProfileKey,
    name: post.author,
    role: post.role,
    avatarSrc: post.avatarSrc,
    authorId: post.authorId,
    viewerRole,
  });
}

export function openMyFeedProfile(
  profile: FeedPublisherProfile,
  viewerRole: "carrier" | "supplier"
) {
  openFeedProfile({
    profileKey: profile.profileKey,
    name: profile.name,
    role: profile.role,
    avatarSrc: profile.avatar,
    authorId: profile.userId,
    viewerRole,
  });
}
