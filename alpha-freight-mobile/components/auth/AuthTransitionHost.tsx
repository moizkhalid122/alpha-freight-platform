import { useEffect, useState } from "react";
import {
  getAuthTransitionMessage,
  subscribeAuthTransition,
} from "@/lib/auth-transition";
import AuthBusyOverlay from "@/components/auth/AuthBusyOverlay";

export default function AuthTransitionHost() {
  const [message, setMessage] = useState<string | null>(() => getAuthTransitionMessage());

  useEffect(() => subscribeAuthTransition(() => setMessage(getAuthTransitionMessage())), []);

  return <AuthBusyOverlay visible={Boolean(message)} message={message ?? "Signing you in…"} />;
}
