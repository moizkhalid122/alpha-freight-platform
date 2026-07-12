import { useLocalSearchParams } from "expo-router";
import FeedProfileScreen from "@/components/feed/FeedProfileScreen";

export default function FeedProfileRoute() {
  const params = useLocalSearchParams<{
    profileKey?: string;
    name?: string;
    role?: string;
    avatarSrc?: string;
    authorId?: string;
    viewerRole?: string;
  }>();

  const profileKey = typeof params.profileKey === "string" ? params.profileKey : "";
  const name = typeof params.name === "string" ? params.name : "Profile";
  const role = typeof params.role === "string" ? params.role : "carrier";
  const avatarSrc = typeof params.avatarSrc === "string" ? params.avatarSrc : undefined;
  const authorId = typeof params.authorId === "string" ? params.authorId : undefined;
  const viewerRole = params.viewerRole === "supplier" ? "supplier" : "carrier";

  return (
    <FeedProfileScreen
      profileKey={profileKey}
      name={name}
      role={role}
      avatarSrc={avatarSrc}
      authorId={authorId}
      viewerRole={viewerRole}
    />
  );
}
