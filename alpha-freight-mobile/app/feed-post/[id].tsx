import { useLocalSearchParams } from "expo-router";
import FeedPostDetailScreen from "@/components/feed/FeedPostDetailScreen";

export default function FeedPostPage() {
  const { id, viewerRole } = useLocalSearchParams<{ id: string; viewerRole?: string }>();
  const postId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const resolvedRole = viewerRole === "supplier" ? "supplier" : "carrier";

  return <FeedPostDetailScreen postId={postId} viewerRole={resolvedRole} />;
}
