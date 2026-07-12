import { AppState, AppStateStatus } from "react-native";
import { showAppNotification, type AppAlertPayload } from "@/lib/app-notifications";
import { supabase } from "@/lib/supabase";

type AlertPayload = AppAlertPayload;

export function isMarketplaceLoad(row: Record<string, unknown>) {
  const carrierId = row.carrier_id;
  const status = String(row.status || "").toLowerCase();
  const paymentState = String(row.payment_state || "pending").toLowerCase();

  return (
    !carrierId &&
    (status === "active" || status === "available" || status === "open") &&
    paymentState === "paid"
  );
}

async function showAlert(payload: AlertPayload, dedupeId: string) {
  await showAppNotification(payload, dedupeId);
}

async function logAndNotify(userId: string, payload: AlertPayload, dedupeId: string) {
  let inserted = false;

  try {
    const { error } = await supabase.from("user_notifications").insert({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: {
        route: payload.route,
        ...(payload.data ?? {}),
      },
    });

    if (!error) {
      inserted = true;
    } else if (!/duplicate|relation .* does not exist|schema cache/i.test(error.message)) {
      if (__DEV__) console.warn("[alerts] notification insert failed:", error.message);
    }
  } catch {
    // offline
  }

  if (!inserted) {
    await showAppNotification(payload, dedupeId);
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollSeeded = false;
let appStateSub: { remove: () => void } | null = null;
const knownMarketplaceLoadIds = new Set<string>();

function loadRouteFromRow(row: Record<string, unknown>) {
  const origin = String(row.pickup_location || row.origin || "Pickup");
  const destination = String(row.delivery_location || row.destination || "Delivery");
  return `${origin} → ${destination}`;
}

async function pollMarketplaceLoads(userId: string) {
  const { data, error } = await supabase
    .from("loads")
    .select(
      "id, origin, destination, pickup_location, delivery_location, status, payment_state, carrier_id, price, created_at"
    )
    .eq("status", "active")
    .is("carrier_id", null)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    if (__DEV__) console.warn("[alerts] poll failed:", error.message);
    return;
  }

  const loads = (data ?? []).filter((row) => isMarketplaceLoad(row as Record<string, unknown>));

  if (!pollSeeded) {
    loads.forEach((load) => knownMarketplaceLoadIds.add(String(load.id)));
    pollSeeded = true;
    return;
  }

  for (const load of loads) {
    const id = String(load.id);
    if (knownMarketplaceLoadIds.has(id)) continue;
    knownMarketplaceLoadIds.add(id);

    const row = load as Record<string, unknown>;
    void showAlert(
      {
        type: "new_load",
        title: "New load available",
        body: `${loadRouteFromRow(row)} · Tap to view and bid`,
        route: "/(main)/loads",
        data: { loadId: id },
      },
      id
    );
  }
}

function startMarketplacePolling(userId: string) {
  stopMarketplacePolling();
  pollSeeded = false;
  knownMarketplaceLoadIds.clear();

  void pollMarketplaceLoads(userId);
  pollTimer = setInterval(() => {
    void pollMarketplaceLoads(userId);
  }, 45000);

  appStateSub = AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") {
      void pollMarketplaceLoads(userId);
    }
  });
}

function stopMarketplacePolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  appStateSub?.remove();
  appStateSub = null;
  pollSeeded = false;
  knownMarketplaceLoadIds.clear();
}

const activeChannels = new Map<string, ReturnType<typeof supabase.channel>>();

function handleNewMarketplaceLoad(userId: string, row: Record<string, unknown>) {
  if (!isMarketplaceLoad(row)) return;

  const id = String(row.id);
  knownMarketplaceLoadIds.add(id);

  void showAlert(
    {
      type: "new_load",
      title: "New load available",
      body: `${loadRouteFromRow(row)} · Tap to view and bid`,
      route: "/(main)/loads",
      data: { loadId: id },
    },
    id
  );
}

export function startCarrierRealtimeAlerts(userId: string) {
  if (activeChannels.has(userId)) return;

  stopCarrierRealtimeAlerts();

  startMarketplacePolling(userId);

  const channel = supabase
    .channel(`carrier-alerts-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "loads" },
      (payload) => {
        handleNewMarketplaceLoad(userId, payload.new as Record<string, unknown>);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "loads" },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const old = payload.old as Record<string, unknown>;
        const oldStatus = String(old.status || "").toLowerCase();
        const newStatus = String(row.status || "").toLowerCase();

        if (!isMarketplaceLoad(old) && isMarketplaceLoad(row)) {
          handleNewMarketplaceLoad(userId, row);
          return;
        }

        if (old.carrier_id !== userId && row.carrier_id === userId) {
          void logAndNotify(
            userId,
            {
              type: "load_assigned",
              title: "Load assigned to you",
              body: loadRouteFromRow(row),
              route: "/my-loads",
              data: { loadId: row.id },
            },
            `assigned-${String(row.id)}`
          );
          return;
        }

        const oldPod = String(old.pod_verification_status || "");
        const newPod = String(row.pod_verification_status || "");
        if (row.carrier_id === userId && oldPod !== newPod && newPod === "verified") {
          void logAndNotify(
            userId,
            {
              type: "pod_approved",
              title: "POD approved",
              body: `${loadRouteFromRow(row)} · Funds are now available`,
              route: "/(main)/wallet",
              data: { loadId: row.id },
            },
            `pod-${String(row.id)}-verified`
          );
        }

        if (
          oldStatus !== newStatus &&
          newStatus === "active" &&
          isMarketplaceLoad(row) &&
          !knownMarketplaceLoadIds.has(String(row.id))
        ) {
          handleNewMarketplaceLoad(userId, row);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bids",
        filter: `carrier_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const old = payload.old as Record<string, unknown>;
        const oldStatus = String(old.status || "").toLowerCase();
        const newStatus = String(row.status || "").toLowerCase();
        if (oldStatus === newStatus) return;

        if (newStatus === "accepted") {
          void logAndNotify(
            userId,
            {
              type: "bid_accepted",
              title: "Bid accepted",
              body: "Your bid was accepted. Check My Loads for assignment.",
              route: "/my-loads",
              data: { bidId: row.id, loadId: row.load_id },
            },
            `bid-${String(row.id)}-accepted`
          );
        } else if (newStatus === "rejected") {
          void logAndNotify(
            userId,
            {
              type: "bid_rejected",
              title: "Bid not accepted",
              body: "Your bid was not selected. Browse more loads.",
              route: "/(main)/loads",
              data: { bidId: row.id, loadId: row.load_id },
            },
            `bid-${String(row.id)}-rejected`
          );
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "carrier_wallet_payouts",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const old = payload.old as Record<string, unknown>;
        const oldStatus = String(old.status || "").toLowerCase();
        const newStatus = String(row.status || "").toLowerCase();
        if (oldStatus === newStatus || newStatus !== "paid") return;

        const amount = Number(row.amount) || 0;
        void logAndNotify(
          userId,
          {
            type: "payout_ready",
            title: "Payout sent",
            body: `£${amount.toFixed(2)} has been paid to your account`,
            route: "/(main)/wallet",
            data: { payoutId: row.id },
          },
          `payout-${String(row.id)}-paid`
        );
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const old = payload.old as Record<string, unknown>;
        const wasVerified =
          old.is_approved === true ||
          String(old.verification_status || "").toLowerCase() === "verified";
        const isVerified =
          row.is_approved === true ||
          String(row.verification_status || "").toLowerCase() === "verified";

        if (!wasVerified && isVerified) {
          void logAndNotify(
            userId,
            {
              type: "carrier_verified",
              title: "Account verified",
              body: "Your carrier account is verified. You can now bid on loads.",
              route: "/(main)/home",
            },
            `verified-${userId}`
          );
        }
      }
    )
    .subscribe((status) => {
      if (__DEV__) {
        console.log("[realtime-alerts] channel status:", status);
      }
    });

  activeChannels.set(userId, channel);

  return () => stopCarrierRealtimeAlerts();
}

export function stopCarrierRealtimeAlerts() {
  stopMarketplacePolling();

  for (const [userId, channel] of activeChannels.entries()) {
    void supabase.removeChannel(channel);
    activeChannels.delete(userId);
  }
}
