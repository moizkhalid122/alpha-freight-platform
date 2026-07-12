import { useLocalSearchParams } from "expo-router";
import FeedComposeChooserScreen from "@/components/feed/FeedComposeChooserScreen";

export default function CreateFeedComposeRoute() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const resolvedRole = role === "supplier" ? "supplier" : "carrier";
  return <FeedComposeChooserScreen role={resolvedRole} />;
}
