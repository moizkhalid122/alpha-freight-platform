import { useLocalSearchParams } from "expo-router";
import FeedCreateReelScreen from "@/components/feed/FeedCreateReelScreen";

export default function CreateFeedReelRoute() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const resolvedRole = role === "supplier" ? "supplier" : "carrier";
  return <FeedCreateReelScreen role={resolvedRole} />;
}
