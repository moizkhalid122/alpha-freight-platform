import { isAccountSetupComplete } from "@/lib/account-setup";
import { hasPinForUser, isPinSetupPending, markPinSetupPending } from "@/lib/pin-lock";
import { markPayoutFreshEligible } from "@/lib/payout-reminder-session";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

async function routeLoggedInUser(userId: string) {
  if (!(await isAccountSetupComplete())) {
    router.replace("/account-setup");
    return;
  }

  if (await isPinSetupPending()) {
    router.replace("/pin-setup");
    return;
  }

  if (await hasPinForUser(userId)) {
    router.replace("/pin-unlock");
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
  if (fromFreshPinSetup) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await markPayoutFreshEligible(user.id);
    }
  }

  router.replace("/(main)/home");
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
