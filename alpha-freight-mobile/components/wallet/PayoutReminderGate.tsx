import { useCallback, useEffect, useRef } from "react";
import { router, useSegments } from "expo-router";
import { prefetchPayoutDetails } from "@/lib/carrier-payout-setup-cache";
import {
  consumePayoutReminderPlan,
  getPayoutReminderPlan,
  isPayoutReminderBlockedForSession,
} from "@/lib/payout-reminder-session";
import {
  isNotificationPromptDismissed,
  isNotificationPromptVisible,
} from "@/lib/notification-permission-session";
import {
  isNotificationPermissionGranted,
  isPushNotificationsSupported,
} from "@/lib/push-notifications";
import { supabase } from "@/lib/supabase";

type PayoutReminderGateProps = {
  enabled: boolean;
};

export default function PayoutReminderGate({ enabled }: PayoutReminderGateProps) {
  const segments = useSegments();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const isOnPayoutSetup = segments.some((segment) => segment === "payout-setup");

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || startedRef.current || isOnPayoutSetup || isPayoutReminderBlockedForSession()) {
      return;
    }

    startedRef.current = true;
    let cancelled = false;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const payout = await prefetchPayoutDetails(true);
      if (payout?.payoutSetupComplete || cancelled) return;

      const plan = await getPayoutReminderPlan(user.id);
      if (!plan || cancelled) return;

      timerRef.current = setTimeout(() => {
        void (async () => {
          if (cancelled || isPayoutReminderBlockedForSession() || isOnPayoutSetup) return;

          if (isPushNotificationsSupported()) {
            const notificationsGranted = await isNotificationPermissionGranted();
            const notificationBlocking =
              isNotificationPromptVisible() ||
              (!notificationsGranted && !isNotificationPromptDismissed());
            if (notificationBlocking) return;
          }

          const latestPayout = await prefetchPayoutDetails(true);
          if (latestPayout?.payoutSetupComplete) return;

          await consumePayoutReminderPlan(user.id, plan.kind);
          router.push({
            pathname: "/payout-setup",
            params: { source: "reminder" },
          });
        })();
      }, plan.delayMs);
    })();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [clearTimer, enabled, isOnPayoutSetup]);

  return null;
}
