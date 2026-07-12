import { useLocalSearchParams } from "expo-router";
import FeedDiscoverScreen from "@/components/feed/FeedDiscoverScreen";

export default function DiscoverRoute() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const resolvedRole = role === "supplier" ? "supplier" : "carrier";
  return <FeedDiscoverScreen role={resolvedRole} />;
}
