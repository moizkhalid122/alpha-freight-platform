import { useCallback } from "react";
import { signInWithGoogle, type GoogleAuthMode } from "@/lib/google-auth";
import {
  endAuthTransition,
  startAuthTransition,
  updateAuthTransition,
} from "@/lib/auth-transition";
import { markWelcomeCompleted } from "@/lib/onboarding";
import { initializePushNotifications } from "@/lib/push-notifications";
import { routeAfterAuth, routeAfterSignup } from "@/lib/pin-routing";
import type { AppRole } from "@/lib/user-role";

type FinishGoogleAuthOptions = {
  role: AppRole;
  mode: GoogleAuthMode;
  onError?: (message: string) => void;
};

export function useGoogleAuthFlow() {
  const finishGoogleAuth = useCallback(async ({ role, mode, onError }: FinishGoogleAuthOptions) => {
    startAuthTransition("Opening Google…");

    try {
      const result = await signInWithGoogle({
        role,
        mode,
        onCompleting: () => updateAuthTransition("Signing you in…"),
      });

      if (!result.ok) {
        endAuthTransition();
        if (!result.cancelled) {
          onError?.(result.error);
        }
        return false;
      }

      updateAuthTransition(
        result.isNewUser ? "Setting up your account…" : "Loading your passcode…"
      );
      await markWelcomeCompleted();

      if (result.isNewUser) {
        await routeAfterSignup();
      } else {
        updateAuthTransition("Almost there…");
        await routeAfterAuth();
      }

      setTimeout(() => {
        void initializePushNotifications();
      }, 800);

      return true;
    } catch (err) {
      endAuthTransition();
      onError?.(err instanceof Error ? err.message : "Unable to sign in with Google.");
      return false;
    }
  }, []);

  return {
    finishGoogleAuth,
  };
}
