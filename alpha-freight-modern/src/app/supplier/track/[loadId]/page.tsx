"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Gauge,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Timer,
} from "lucide-react";
import LoadLiveTrackingMap from "@/components/tracking/LoadLiveTrackingMap";
import { useLoadLiveTracking } from "@/hooks/useLoadLiveTracking";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import { supabase } from "@/lib/supabase";
import {
  formatMotionDuration,
  formatSpeedMps,
  formatTraveledDistance,
  isFreshLiveGps,
} from "@/lib/load-gps-tracking";
import { formatDistance, formatDuration } from "@/lib/mapbox-routes";
import {
  canSupplierTrackShipment,
  getSupplierPaymentStateForLoad,
  getSupplierTrackingProgress,
  type TrackableLoad,
} from "@/lib/supplier-tracking";
import { getSupplierPaymentOrdersForUser } from "@/lib/supplier-payments";

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

export default function SupplierTrackDetailPage() {
  const params = useParams<{ loadId: string }>();
  const router = useRouter();
  const loadId = params?.loadId ? String(params.loadId) : "";
  const [load, setLoad] = useState<TrackableLoad | null>(null);
  const [loading, setLoading] = useState(true);

  const { snapshot, hasGps, loading: gpsLoading, refresh } = useLoadLiveTracking(
    loadId,
    load?.status
  );
  const { route } = useLoadRoute(load?.origin || "", load?.destination || "", !!load);

  useEffect(() => {
    const fetchLoad = async () => {
      if (!loadId) {
        router.replace("/supplier/track");
        return;
      }

      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/select");
        return;
      }

      const [{ data, error }, payments] = await Promise.all([
        supabase
          .from("loads")
          .select("id, origin, destination, status, carrier_id, pickup_date, price, payment_state")
          .eq("id", loadId)
          .eq("supplier_id", user.id)
          .maybeSingle(),
        getSupplierPaymentOrdersForUser(user.id),
      ]);

      if (error || !data) {
        router.replace("/supplier/track");
        return;
      }

      const payment = payments.find((record) => record.loadId === loadId);
      const paymentState = getSupplierPaymentStateForLoad(data as TrackableLoad, payment?.paymentState);

      if (!canSupplierTrackShipment(data as TrackableLoad, paymentState)) {
        router.replace("/supplier/track");
        return;
      }

      setLoad(data as TrackableLoad);
      setLoading(false);
    };

    void fetchLoad();
  }, [loadId, router]);

  const waitingHint = useMemo(() => {
    if (!load) return "";
    if (!load.carrier_id) return "Waiting for a carrier to accept this load…";
    if (load.status !== "in-transit" && load.status !== "loading") {
      return "Waiting for carrier to confirm pickup and start live GPS…";
    }
    return "Waiting for carrier live GPS signal…";
  }, [load]);

  const remainingDistance = useMemo(() => {
    if (!route?.distanceMeters) return "—";
    const traveled = snapshot?.traveled_meters ?? 0;
    return formatDistance(Math.max(0, route.distanceMeters - traveled));
  }, [route?.distanceMeters, snapshot?.traveled_meters]);

  if (loading || !load) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  const progress = getSupplierTrackingProgress(load.status);
  const live = isFreshLiveGps(snapshot);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/supplier/track"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Live GPS</p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {load.origin || "Origin"} → {load.destination || "Destination"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 capitalize">{load.status.replace("-", " ")}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${gpsLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "GPS status",
            value: live ? "Live" : hasGps ? "Last known" : "Waiting",
            icon: Navigation,
            tone: live ? "text-emerald-700" : "text-slate-700",
          },
          {
            label: "Speed",
            value: formatSpeedMps(snapshot?.speed_mps),
            icon: Gauge,
            tone: "text-slate-900",
          },
          {
            label: "Distance traveled",
            value: formatTraveledDistance(snapshot?.traveled_meters),
            icon: Route,
            tone: "text-slate-900",
          },
          {
            label: "Remaining",
            value: remainingDistance,
            icon: MapPin,
            tone: "text-slate-900",
          },
        ].map((stat) => (
          <div key={stat.label} className={`${CARD} px-4 py-3`}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <stat.icon className="h-3.5 w-3.5" />
              {stat.label}
            </div>
            <p className={`mt-2 text-lg font-bold ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="h-[58vh] min-h-[420px]">
          <LoadLiveTrackingMap
            origin={load.origin || ""}
            destination={load.destination || ""}
            liveTracking={snapshot}
            loadStatus={load.status}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={`${CARD} px-5 py-4`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Shipment progress</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{progress}% through workflow</p>
        </div>

        <div className={`${CARD} px-5 py-4`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Telemetry</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-900">Motion time:</span>{" "}
              {formatMotionDuration(snapshot?.motion_seconds)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">ETA window:</span>{" "}
              {route ? formatDuration(route.durationSeconds) : "—"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Last update:</span>{" "}
              {snapshot?.last_recorded_at
                ? new Date(snapshot.last_recorded_at).toLocaleString("en-GB")
                : "—"}
            </p>
            <p className="flex items-center gap-1">
              <Timer className="h-4 w-4 text-slate-400" />
              {live ? "Carrier GPS is actively streaming." : waitingHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
