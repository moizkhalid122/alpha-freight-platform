import { useLocalSearchParams } from "expo-router";
import FeedCreatePostScreen from "@/components/feed/FeedCreatePostScreen";

export default function CreateFeedPostRoute() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const resolvedRole = role === "supplier" ? "supplier" : "carrier";
  return <FeedCreatePostScreen role={resolvedRole} />;
}
