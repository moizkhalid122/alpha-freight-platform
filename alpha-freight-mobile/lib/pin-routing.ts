import { isAccountSetupComplete } from "@/lib/account-setup";
import {
  clearPinSetupPending,
  hasPinConfiguredForUserWithRetry,
  isPinSetupPending,
  markPinSetupPending,
} from "@/lib/pin-lock";
import { markPayoutFreshEligible } from "@/lib/payout-reminder-session";
import { supabase } from "@/lib/supabase";
import { getUserRole, homeRouteForRole } from "@/lib/user-role";
import { router } from "expo-router";

async function routeLoggedInUser(userId: string) {
  if (!(await isAccountSetupComplete())) {
    router.replace("/account-setup");
    return;
  }

  const pinConfigured = await hasPinConfiguredForUserWithRetry(userId);

  if (pinConfigured) {
    await clearPinSetupPending();
    router.replace("/pin-unlock");
    return;
  }

  if (await isPinSetupPending()) {
    router.replace("/pin-setup");
    return;
  }

  await markPinSetupPending();
  router.replace("/pin-setup");
}

export async function routeAfterAuth() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.replace("/welcome");
    return;
  }

  await routeLoggedInUser(user.id);
}

export async function routeAfterSignup() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.replace("/login");
    return;
  }

  router.replace("/account-setup");
}

async function routeAfterPinComplete(fromFreshPinSetup = false) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (fromFreshPinSetup && user) {
    await markPayoutFreshEligible(user.id);
  }

  if (!user) {
    router.replace("/welcome");
    return;
  }

  const role = await getUserRole(user.id);
  router.replace(homeRouteForRole(role));
}

export async function routeToRoleHome(userId: string) {
  const role = await getUserRole(userId);
  router.replace(homeRouteForRole(role));
}

export async function routeAfterPinSetup() {
  await routeAfterPinComplete(true);
}

export async function routeAfterAccountSetup() {
  await markPinSetupPending();
  router.replace("/pin-setup");
}

export async function routeAfterSplash(sessionUserId: string | undefined) {
  if (!sessionUserId) {
    router.replace("/welcome");
    return;
  }

  await routeLoggedInUser(sessionUserId);
}
