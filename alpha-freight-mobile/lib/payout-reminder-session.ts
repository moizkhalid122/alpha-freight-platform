import * as SecureStore from "expo-secure-store";

const FRESH_ELIGIBLE_KEY = "payout_reminder_fresh_eligible";
const FIRST_SHOWN_KEY = "payout_reminder_first_shown";
const RETURN_DONE_KEY = "payout_reminder_return_done";

function scopedKey(base: string, userId: string) {
  return `${base}_${userId}`;
}

export async function markPayoutFreshEligible(userId: string) {
  try {
    await SecureStore.setItemAsync(scopedKey(FRESH_ELIGIBLE_KEY, userId), "1");
  } catch {
    // SecureStore keys must not contain ":" — ignore so PIN setup still completes.
  }
}

export async function clearPayoutReminderState(userId: string) {
  await Promise.all([
    SecureStore.deleteItemAsync(scopedKey(FRESH_ELIGIBLE_KEY, userId)).catch(() => undefined),
    SecureStore.deleteItemAsync(scopedKey(FIRST_SHOWN_KEY, userId)).catch(() => undefined),
    SecureStore.deleteItemAsync(scopedKey(RETURN_DONE_KEY, userId)).catch(() => undefined),
  ]);
}

export type PayoutReminderPlan = {
  delayMs: number;
  kind: "fresh" | "return";
};

export async function getPayoutReminderPlan(userId: string): Promise<PayoutReminderPlan | null> {
  try {
    const freshEligible = await SecureStore.getItemAsync(scopedKey(FRESH_ELIGIBLE_KEY, userId));
    if (freshEligible === "1") {
      return { delayMs: 10_000, kind: "fresh" };
    }

    const firstShown = await SecureStore.getItemAsync(scopedKey(FIRST_SHOWN_KEY, userId));
    const returnDone = await SecureStore.getItemAsync(scopedKey(RETURN_DONE_KEY, userId));

    if (firstShown === "1" && returnDone !== "1") {
      return { delayMs: 5_000, kind: "return" };
    }
  } catch {
    return null;
  }

  return null;
}

export async function consumePayoutReminderPlan(userId: string, kind: PayoutReminderPlan["kind"]) {
  try {
    if (kind === "fresh") {
      await Promise.all([
        SecureStore.deleteItemAsync(scopedKey(FRESH_ELIGIBLE_KEY, userId)),
        SecureStore.setItemAsync(scopedKey(FIRST_SHOWN_KEY, userId), "1"),
      ]);
      return;
    }

    await SecureStore.setItemAsync(scopedKey(RETURN_DONE_KEY, userId), "1");
  } catch {
    // Non-blocking if secure storage fails.
  }
}

let sessionBlocked = false;

export function blockPayoutReminderForSession() {
  sessionBlocked = true;
}

export function isPayoutReminderBlockedForSession() {
  return sessionBlocked;
}

export function resetPayoutReminderSessionBlock() {
  sessionBlocked = false;
}
