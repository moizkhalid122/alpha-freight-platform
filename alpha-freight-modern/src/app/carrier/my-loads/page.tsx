"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { mergeCarrierPaymentOrder, readCarrierPaymentOrders } from "@/lib/carrier-payments";
import {
  readCarrierPodUploads,
  writeCarrierPodUploads,
  type CarrierPodUploadRecord,
} from "@/lib/carrier-pod-uploads";
import {
  normalizePodVerificationStatus,
} from "@/lib/load-pod-verification";
import { 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Navigation,
  Calendar,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  Zap,
  Users,
  X,
  Weight,
  Loader2,
  Upload,
  FileCheck,
  Box,
} from "lucide-react";

const OVERLAY_CLASS =
  "fixed inset-0 z-[200] min-h-[100dvh] w-screen bg-slate-900/45 backdrop-blur-[6px]";

const TAB_FILTERS = ["active", "pending", "completed"] as const;

const TAB_STYLES: Record<string, { pill: string; accent: string }> = {
  active: { pill: "bg-blue-50 text-blue-700", accent: "from-blue-500 to-cyan-500" },
  pending: { pill: "bg-amber-50 text-amber-700", accent: "from-amber-500 to-orange-500" },
  completed: { pill: "bg-emerald-50 text-emerald-700", accent: "from-emerald-500 to-teal-500" },
};

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB")}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCity(value: string | null | undefined) {
  if (!value) return "—";
  return value.split(",")[0].trim();
}

function formatDateLabel(value?: string) {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getShortCode(id?: string) {
  if (!id) return "N/A";
  return `AF-${id.slice(0, 8).toUpperCase()}`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to convert file into a preview URL."));
    };
    reader.onerror = () => reject(new Error("Unable to read the POD file."));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlobUrl(dataUrl: string) {
  const parts = dataUrl.split(",");
  if (parts.length < 2) return dataUrl;

  const mimeMatch = parts[0].match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || "application/octet-stream";
  const binary = window.atob(parts[1]);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

function isMissingPodColumnError(message: string) {
  return /pod_url|pod_name|pod_uploaded|pod_verification|schema cache|column.*does not exist/i.test(message);
}

function isPersistablePodUrl(url?: string | null) {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function getPaymentStatus(status: string, podCase?: any, paymentOrder?: any) {
  if (status === "completed" || status === "delivered") {
    if (paymentOrder?.status === "paid" || paymentOrder?.status === "verified") return "Completed";
    if (paymentOrder?.status === "on_hold") return "On hold";
    if (paymentOrder?.status === "failed") return "Rejected";
    if (podCase?.verificationStatus === "on_hold") return "On hold";
    if (podCase?.verificationStatus === "rejected") return "Rejected";
    if (podCase?.verificationStatus === "info_required") return "Info required";
    if (podCase?.verificationStatus === "verified") return "Ready for payout";
    return "Held until POD verification";
  }
  if (status === "in-transit" || status === "loading") return "In progress";
  return "Awaiting completion";
}

function getStatusTimeline(status: string) {
  const steps = [
    { key: "booked", label: "Booked" },
    { key: "confirmed", label: "Confirmed" },
    { key: "in-transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
  ];

  const currentIndex =
    status === "completed" || status === "delivered"
      ? 3
      : status === "in-transit" || status === "loading"
      ? 2
      : status === "booked" || status === "assigned" || status === "pending"
      ? 1
      : 0;

  return steps.map((step, index) => ({
    ...step,
    complete: index <= currentIndex,
    current: index === currentIndex,
  }));
}

function buildBaseLoad(load: any, podCase?: any, paymentOrder?: any) {
  return {
    ...load,
    origin: load.origin || "Unknown origin",
    destination: load.destination || "Unknown destination",
    price: Number(load.price) || 0,
    equipment: load.equipment || "General",
    shortCode: getShortCode(load.id),
    supplierRef: load.supplier_id ? `SUP-${String(load.supplier_id).slice(0, 6).toUpperCase()}` : "Supplier Pending",
    weightLabel: load.weight ? `${load.weight} kg` : "Weight pending",
    pickupDateLabel: formatDateLabel(load.pickup_date),
    deliveryDateLabel: formatDateLabel(load.delivery_date),
    paymentStatus: getPaymentStatus(load.status, podCase, paymentOrder),
    commodityLabel: load.commodity || load.load_type || "General freight",
    bookingSource: load.bid_id ? "Accepted Bid" : "Booked Load",
    notes: load.notes || load.special_instructions || "No special instructions shared yet.",
    podUrl: podCase?.url || load.pod_url || null,
    podName: podCase?.name || load.pod_name || null,
    podUploadedAt: podCase?.uploadedAt || load.pod_uploaded_at || null,
    podVerificationStatus:
      normalizePodVerificationStatus(load.pod_verification_status) ||
      podCase?.verificationStatus ||
      (load.status === "completed" || load.status === "delivered" ? "pending" : null),
    podVerificationMethod: podCase?.mode || null,
    verificationNote:
      load.status === "completed" || load.status === "delivered"
        ? paymentOrder?.status === "paid" || paymentOrder?.status === "verified"
          ? "Alpha Freight has completed the payment review for this load."
          : paymentOrder?.status === "on_hold"
            ? "This payment is currently on hold while Alpha Freight completes additional checks."
            : paymentOrder?.status === "failed"
              ? "This payment was rejected during review. Contact Alpha Freight support for more detail."
            : podCase?.verificationStatus === "on_hold"
              ? "POD review is currently on hold while Alpha Freight checks the delivery evidence."
            : podCase?.verificationStatus === "rejected"
              ? "POD was rejected during review. Upload a corrected document or contact Alpha Freight."
            : podCase?.verificationStatus === "info_required"
              ? "Alpha Freight requested more POD information before payout can be cleared."
              : podCase?.verificationStatus === "verified"
                ? "POD verified. Payout is ready for release."
                : "POD has been sent for verification. Payout will be released once Alpha Freight approves it."
        : "Delivery in progress.",
  };
}

function transformLoadForTab(load: any, podCase?: any, paymentOrder?: any) {
  const baseLoad = buildBaseLoad(load, podCase, paymentOrder);

  if (load.status === "in-transit" || load.status === "loading") {
    return {
      tab: "active",
      load: {
        ...baseLoad,
        status: load.status === "in-transit" ? "In Transit" : "Loading",
        progress: load.progress || (load.status === "loading" ? 15 : 65),
        driver: load.driver_name || "Assigned",
        truck: load.vehicle_id || "Unit",
        pickup: baseLoad.pickupDateLabel,
        eta: load.eta || baseLoad.deliveryDateLabel,
        location: load.current_location || "Updating..."
      }
    };
  }

  if (load.status === "active" || load.status === "booked" || load.status === "assigned" || load.status === "pending" || load.status === "accepted") {
    return {
      tab: "pending",
      load: {
        ...baseLoad,
        status: "Assigned",
        driver: load.driver_name || "Pending",
        truck: load.vehicle_id || "Pending",
        pickup: baseLoad.pickupDateLabel,
        eta: baseLoad.deliveryDateLabel,
        actionNeeded: "Confirm Pickup"
      }
    };
  }

  if (load.status === "completed" || load.status === "delivered") {
    const podStatus = normalizePodVerificationStatus(load.pod_verification_status);
    return {
      tab: "completed",
      load: {
        ...baseLoad,
        status: podStatus === "verified" || load.status === "completed" ? "Delivered" : "Awaiting POD review",
        deliveredAt: load.created_at ? new Date(load.created_at).toLocaleDateString() : "Recently",
        rating: load.rating || 5,
        review: load.review || "Great service."
      }
    };
  }

  return null;
}

export default function MyLoadsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [podPreview, setPodPreview] = useState<{ url: string; name: string } | null>(null);
  const [deliveryModalLoad, setDeliveryModalLoad] = useState<any>(null);
  const [deliveryOption, setDeliveryOption] = useState<"upload" | "team">("upload");
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [podUploads, setPodUploads] = useState<Record<string, CarrierPodUploadRecord>>({});
  const [podTargetLoadId, setPodTargetLoadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loads, setLoads] = useState<{ active: any[], pending: any[], completed: any[] }>({
    active: [],
    pending: [],
    completed: []
  });
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const hasOverlay = Boolean(deliveryModalLoad || podPreview || selectedLoad);
    if (!hasOverlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [deliveryModalLoad, podPreview, selectedLoad]);

  const openSupportPage = (load: any) => {
    const params = new URLSearchParams({
      shipment: load.shortCode || load.id,
      route: `${load.origin} to ${load.destination}`,
      status: load.status,
      source: "my-loads",
    });

    router.push(`/carrier/support?${params.toString()}`);
  };

  useEffect(() => {
    try {
      setPodUploads(readCarrierPodUploads());
    } catch (error) {
      console.error("Error restoring POD uploads:", error);
    }
  }, []);

  useEffect(() => {
    try {
      writeCarrierPodUploads(podUploads);
    } catch (error) {
      console.error("Error saving POD uploads:", error);
    }
  }, [podUploads]);

  const showActionToast = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    window.setTimeout(() => {
      setActionMessage(null);
    }, 2500);
  };

  const closePodPreview = () => {
    if (podPreview?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(podPreview.url);
    }
    setPodPreview(null);
  };

  const openPodDocument = (load: any) => {
    const podRecord = getPodForLoad(load);
    const podUrl = podRecord?.url || load?.podUrl || load?.pod_url || "";

    if (!podUrl || podUrl === "about:blank") {
      showActionToast("error", "No POD file is available for this load yet.");
      return;
    }

    const safeOpenUrl = podUrl.startsWith("data:") ? dataUrlToBlobUrl(podUrl) : podUrl;
    setPodPreview({
      url: safeOpenUrl,
      name: podRecord?.name || load?.podName || "POD Document",
    });
  };

  const getPodForLoad = (load: any) => {
    const storedPod = podUploads[load.id];
    const dbPodUrl = load.pod_url || load.podUrl || "";
    const dbPodName = load.pod_name || load.podName || "Digital POD";
    const dbUploadedAt = load.pod_uploaded_at || load.podUploadedAt || new Date().toISOString();
    const storedPodIsLegacyBlob = Boolean(storedPod?.url?.startsWith("blob:"));

    if (dbPodUrl && (!storedPod || storedPodIsLegacyBlob)) {
      return {
        name: dbPodName,
        url: dbPodUrl,
        uploadedAt: dbUploadedAt,
        mode: (storedPod?.mode || "upload") as "upload" | "team",
        verificationStatus:
          normalizePodVerificationStatus(load.pod_verification_status) ||
          storedPod?.verificationStatus ||
          "pending",
        verifiedAt: storedPod?.verifiedAt || null,
        verifiedBy: storedPod?.verifiedBy || null,
        requestedInfoAt: storedPod?.requestedInfoAt || null,
        reviewedAt: storedPod?.reviewedAt || null,
        reviewedBy: storedPod?.reviewedBy || null,
        rejectedAt: storedPod?.rejectedAt || null,
        reviewNote: storedPod?.reviewNote || null,
      };
    }

    return storedPod || null;
  };

  const handlePodUploadClick = () => {
    fileInputRef.current?.click();
  };

  const buildPodRecord = async (loadId: string, file: File): Promise<CarrierPodUploadRecord> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in again to upload POD.");

    if (file.size > 15 * 1024 * 1024) {
      throw new Error("File is too large. Please upload a document under 15MB.");
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const path = `${user.id}/${loadId}-${Date.now()}-${sanitizedName}`;
    const { error: uploadError } = await supabase.storage.from("pods").upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });

    if (uploadError) {
      const message = uploadError.message.toLowerCase();
      if (message.includes("bucket") || message.includes("not found")) {
        throw new Error(
          "POD storage is not configured. Run carrier-pod-setup.sql in Supabase SQL Editor, then try again."
        );
      }
      throw uploadError;
    }

    const { data: publicData } = supabase.storage.from("pods").getPublicUrl(path);
    const podUrl = publicData.publicUrl;
    if (!podUrl) {
      throw new Error("Uploaded POD URL could not be generated.");
    }

    return {
      name: file.name,
      url: podUrl,
      uploadedAt: new Date().toISOString(),
      mode: "upload",
      verificationStatus: "pending",
      verifiedAt: null,
      verifiedBy: null,
      requestedInfoAt: null,
      reviewedAt: null,
      reviewedBy: null,
      rejectedAt: null,
      reviewNote: "Carrier uploaded POD for verification.",
    };
  };

  const replacePodForLoad = async (loadId: string, file: File) => {
    try {
      setActionLoadingId(`${loadId}-pod`);
      const nextPodRecord = await buildPodRecord(loadId, file);

      setPodUploads((prev) => ({ ...prev, [loadId]: nextPodRecord }));
      mergeCarrierPaymentOrder(`TX-${loadId.slice(0, 8).toUpperCase()}-001`, {
        status: "pending_review",
        verificationNotes: "Carrier reuploaded POD. Review restarted.",
        disputeReason: "",
        heldAt: null,
        rejectedAt: null,
        requestedInfoAt: null,
        verifiedAt: null,
        releasedAt: null,
      });

      await updateLoadStatus(loadId, "delivered", nextPodRecord);
      setSelectedLoad((prev: any) => {
        if (prev?.id !== loadId) return prev;
        return {
          ...prev,
          podUrl: nextPodRecord.url,
          podName: nextPodRecord.name,
          podUploadedAt: nextPodRecord.uploadedAt,
          podVerificationStatus: "pending",
          paymentStatus: "Held until POD verification",
          verificationNote: "POD reuploaded. Alpha Freight will review the updated document.",
        };
      });
      showActionToast("success", "POD reuploaded successfully. Review has started again.");
    } catch (error) {
      console.error("Error reuploading POD:", error);
      const message =
        error instanceof Error ? error.message : "We could not reupload the POD right now.";
      showActionToast("error", message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePodFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && podTargetLoadId) {
      await replacePodForLoad(podTargetLoadId, file);
      setPodTargetLoadId(null);
    } else if (file) {
      setDeliveryFile(file);
    }
    if (event.target) event.target.value = "";
  };

  const updateLoadStatus = async (loadId: string, newStatus: string, podRecord?: any) => {
    try {
      setActionLoadingId(loadId);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");

      const loadUpdates: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (podRecord && isPersistablePodUrl(podRecord.url)) {
        loadUpdates.pod_url = podRecord.url;
        loadUpdates.pod_name = podRecord.name || "Digital POD";
        loadUpdates.pod_uploaded_at = podRecord.uploadedAt || new Date().toISOString();
        loadUpdates.pod_verification_status = "pending";
        loadUpdates.pod_review_note = null;
        loadUpdates.pod_verified_at = null;
        if (newStatus === "completed") {
          loadUpdates.status = "delivered";
        }
      }

      let { data: updatedLoad, error } = await supabase
        .from("loads")
        .update(loadUpdates)
        .eq("id", loadId)
        .eq("carrier_id", user.id)
        .select("*")
        .maybeSingle();

      if (error && isMissingPodColumnError(error.message)) {
        const retry = await supabase
          .from("loads")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", loadId)
          .eq("carrier_id", user.id)
          .select("*")
          .maybeSingle();
        updatedLoad = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      if (!updatedLoad) {
        throw new Error(
          "Load update blocked. Run carrier-platform-rls-fix.sql and carrier-pod-setup.sql in Supabase."
        );
      }
      const paymentOrdersByLoadId = Object.fromEntries(
        readCarrierPaymentOrders().map((order) => [order.loadId, order])
      );
      const transformed = transformLoadForTab(
        updatedLoad,
        podRecord || getPodForLoad(updatedLoad),
        paymentOrdersByLoadId[loadId]
      );
      if (transformed) {
        setLoads((prev) => {
          const nextState = {
            active: prev.active.filter((item) => item.id !== loadId),
            pending: prev.pending.filter((item) => item.id !== loadId),
            completed: prev.completed.filter((item) => item.id !== loadId),
          };
          nextState[transformed.tab as keyof typeof nextState] = [
            transformed.load,
            ...nextState[transformed.tab as keyof typeof nextState],
          ];
          return nextState;
        });

        setSelectedLoad((prev: any) => (prev?.id === loadId ? transformed.load : prev));
      }

      showActionToast(
        "success",
        newStatus === "in-transit"
          ? "Pickup confirmed. Shipment moved to Active."
          : "Shipment moved to Completed. POD has been sent for verification."
      );
    } catch (error) {
      console.error("Error updating load status:", error);
      const message =
        error instanceof Error
          ? error.message
          : "We could not complete this action. Please try again.";
      showActionToast("error", message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFinalizeDelivery = async () => {
    if (!deliveryModalLoad) return;
    if (deliveryOption === "upload" && !deliveryFile) {
      showActionToast("error", "Please upload a POD file before continuing.");
      return;
    }

    try {
      setDeliverySubmitting(true);
      const loadId = deliveryModalLoad.id;
      let nextPodRecord: CarrierPodUploadRecord;

      if (deliveryOption === "upload" && deliveryFile) {
        nextPodRecord = await buildPodRecord(loadId, deliveryFile);
      } else {
        nextPodRecord = {
          name: "Alpha Freight Verification Requested",
          url: "",
          uploadedAt: new Date().toISOString(),
          mode: "team",
          verificationStatus: "pending",
        };
      }

      setPodUploads((prev) => ({ ...prev, [loadId]: nextPodRecord }));
      setDeliveryModalLoad(null);
      setDeliveryFile(null);
      setDeliveryOption("upload");
      await updateLoadStatus(loadId, "delivered", nextPodRecord);
      setActiveTab("completed");
    } catch (error) {
      console.error("Error finalizing delivery:", error);
      const message =
        error instanceof Error ? error.message : "Delivery completion could not be processed.";
      showActionToast("error", message);
    } finally {
      setDeliverySubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchLoads() {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('loads')
          .select('*')
          .eq('carrier_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const paymentOrdersByLoadId = Object.fromEntries(
          readCarrierPaymentOrders().map((order) => [order.loadId, order])
        );

        const categorized = data.reduce((acc: any, load: any) => {
          const transformed = transformLoadForTab(
            load,
            getPodForLoad(load),
            paymentOrdersByLoadId[load.id]
          );
          if (transformed) {
            acc[transformed.tab].push(transformed.load);
          }
          return acc;
        }, { active: [], pending: [], completed: [] });

        setLoads(categorized);

        setActiveTab((currentTab) => {
          if (categorized[currentTab as keyof typeof categorized]?.length > 0) {
            return currentTab;
          }
          if (categorized.pending.length > 0) return "pending";
          if (categorized.active.length > 0) return "active";
          if (categorized.completed.length > 0) return "completed";
          return currentTab;
        });
      } catch (err) {
        console.error("Error fetching loads:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLoads();

    // Real-time subscription
    const channel = supabase
      .channel('schema-db-changes-myloads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loads'
        },
        () => {
          fetchLoads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [podUploads]);

  const stats = useMemo(
    () => ({
      active: loads.active.length,
      pending: loads.pending.length,
      completed: loads.completed.length,
      total: loads.active.length + loads.pending.length + loads.completed.length,
    }),
    [loads]
  );

  const currentLoads = loads[activeTab as keyof typeof loads];
  const tabStyle = TAB_STYLES[activeTab] || TAB_STYLES.pending;

  return (
    <>
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handlePodFileChange}
      />
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed left-1/2 top-24 z-[120] -translate-x-1/2 rounded-xl border px-4 py-2.5 shadow-lg ${
              actionMessage.type === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-rose-100 bg-rose-50 text-rose-700"
            }`}
          >
            <div className="flex items-center gap-2 text-[13px] font-medium">
              {actionMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{actionMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="rounded-md bg-slate-900 p-1.5">
                <Box className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Operations</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">My shipments</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Track assigned freight, confirm pickups, and manage delivery proof
            </p>
          </div>

          <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1">
            {TAB_FILTERS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-4 py-1.5 text-[11px] font-semibold capitalize transition ${
                  activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeTab === tab ? "bg-slate-100 text-slate-700" : "text-slate-400"
                }`}>
                  {loads[tab].length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total assigned", value: stats.total },
            { label: "Awaiting pickup", value: stats.pending },
            { label: "In transit", value: stats.active },
            { label: "Completed", value: stats.completed },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] text-slate-500">{stat.label}</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-slate-200 bg-white py-16 text-center"
            >
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
              <p className="text-[13px] text-slate-500">Loading shipments…</p>
            </motion.div>
          ) : currentLoads.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {currentLoads.map((load, index) => (
                <motion.div
                  key={load.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelectedLoad(load)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${tabStyle.accent}`} />

                  <div className="grid gap-4 p-4 pl-5 lg:grid-cols-[108px_minmax(0,1fr)_168px] lg:items-center lg:gap-6">
                    <div className="flex shrink-0 items-center gap-4 lg:flex-col lg:items-start lg:gap-0.5">
                      <p className="text-[22px] font-bold leading-none tracking-tight text-slate-900">
                        {formatMoney(load.price)}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400">{load.shortCode}</p>
                      <p className="mt-1 hidden text-[10px] text-slate-500 lg:block">{load.paymentStatus}</p>
                    </div>

                    <div className="min-w-0 border-slate-100 lg:border-l lg:pl-5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${tabStyle.pill}`}>
                          {load.status}
                        </span>
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {load.bookingSource}
                        </span>
                        <span className="text-[11px] text-slate-400">{load.supplierRef}</span>
                      </div>

                      <div className="mt-2.5 flex items-stretch gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">From</p>
                          <p className="truncate text-[13px] font-semibold capitalize text-slate-900">{getCity(load.origin)}</p>
                          <p className="truncate text-[11px] text-slate-500">{load.origin}</p>
                        </div>
                        <div className="flex shrink-0 items-center px-1">
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">To</p>
                          <p className="truncate text-[13px] font-semibold capitalize text-slate-900">{getCity(load.destination)}</p>
                          <p className="truncate text-[11px] text-slate-500">{load.destination}</p>
                        </div>
                      </div>

                      {activeTab === "active" && "progress" in load ? (
                        <div className="mt-2.5">
                          <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-slate-500">
                            <span>Route progress</span>
                            <span className="text-blue-600">{(load as { progress?: number }).progress || 0}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                              style={{ width: `${(load as { progress?: number }).progress || 0}%` }}
                            />
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Pickup {load.pickupDateLabel}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Delivery {load.deliveryDateLabel}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {formatLabel(load.equipment)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Weight className="h-3 w-3" />
                          {load.weightLabel}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] leading-relaxed text-slate-400 line-clamp-1">
                        {load.paymentStatus}
                        {activeTab === "active" && "location" in load
                          ? ` · ${(load as { location?: string }).location || "Location updating"}`
                          : ""}
                      </p>
                    </div>

                    <div
                      className="flex flex-row flex-wrap items-center gap-2 border-t border-slate-100 pt-3 lg:w-[168px] lg:flex-col lg:items-stretch lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {activeTab === "pending" && (
                        <button
                          type="button"
                          onClick={() => updateLoadStatus(load.id, "in-transit")}
                          disabled={actionLoadingId === load.id}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 lg:flex-none"
                        >
                          {actionLoadingId === load.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Zap className="h-3.5 w-3.5" />
                          )}
                          Confirm pickup
                        </button>
                      )}

                      {activeTab === "active" && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryModalLoad(load);
                            setDeliveryOption("upload");
                            setDeliveryFile(null);
                          }}
                          disabled={actionLoadingId === load.id}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 lg:flex-none"
                        >
                          {actionLoadingId === load.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Mark delivered
                        </button>
                      )}

                      {activeTab === "completed" && load.podVerificationStatus === "pending" && (
                        <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 lg:flex-none">
                          <Clock className="h-3.5 w-3.5" />
                          POD review
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab === "completed") {
                            openPodDocument(load);
                            return;
                          }
                          setSelectedLoad(load);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 lg:flex-none"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        {activeTab === "completed" ? "View POD" : "Details"}
                      </button>

                      <button
                        type="button"
                        onClick={() => openSupportPage(load)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 lg:flex-none"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Support
                      </button>

                      {activeTab === "completed" && load.podVerificationStatus && (
                        <button
                          type="button"
                          onClick={() => {
                            setPodTargetLoadId(load.id);
                            handlePodUploadClick();
                          }}
                          disabled={actionLoadingId === `${load.id}-pod`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-600 transition hover:text-blue-700 disabled:opacity-60 lg:flex-none"
                        >
                          {actionLoadingId === `${load.id}-pod` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5" />
                          )}
                          Reupload POD
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                <Box className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 capitalize">No {activeTab} shipments</h3>
              <p className="mt-1 text-[13px] text-slate-500">
                {activeTab === "pending"
                  ? "Book loads from Available Loads to see assigned shipments here."
                  : "Shipments will appear here as you progress through pickup and delivery."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {portalReady &&
      createPortal(
        <>
          <AnimatePresence>
            {deliveryModalLoad && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    if (!deliverySubmitting) {
                      setDeliveryModalLoad(null);
                      setDeliveryFile(null);
                    }
                  }}
                  className={OVERLAY_CLASS}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 12 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(92dvh,820px)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
                >
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <div className="rounded-md bg-slate-900 p-1.5">
                            <FileCheck className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Delivery completion</span>
                        </div>
                        <h3 className="text-[17px] font-bold text-slate-900">Proof of delivery</h3>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          Choose how to submit POD before this load moves to completed.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!deliverySubmitting) {
                            setDeliveryModalLoad(null);
                            setDeliveryFile(null);
                          }
                        }}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto px-5 py-4 sm:px-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryOption("upload")}
                        className={`rounded-xl border p-4 text-left transition ${
                          deliveryOption === "upload"
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className={`rounded-lg p-2 ${deliveryOption === "upload" ? "bg-white/10" : "bg-white border border-slate-200"}`}>
                            <Upload className={`h-4 w-4 ${deliveryOption === "upload" ? "text-white" : "text-slate-500"}`} />
                          </div>
                          <span className={`h-4 w-4 rounded-full border-2 ${deliveryOption === "upload" ? "border-white bg-white" : "border-slate-300"}`}>
                            {deliveryOption === "upload" ? <span className="block h-full w-full scale-[0.45] rounded-full bg-slate-900" /> : null}
                          </span>
                        </div>
                        <h4 className="text-[14px] font-semibold">Upload digital POD</h4>
                        <p className={`mt-1 text-[12px] leading-relaxed ${deliveryOption === "upload" ? "text-slate-300" : "text-slate-500"}`}>
                          Submit signed delivery proof now for Alpha Freight review.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryOption("team")}
                        className={`rounded-xl border p-4 text-left transition ${
                          deliveryOption === "team"
                            ? "border-slate-900 bg-white ring-2 ring-slate-900"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="rounded-lg border border-slate-200 bg-white p-2">
                            <Users className={`h-4 w-4 ${deliveryOption === "team" ? "text-slate-900" : "text-slate-500"}`} />
                          </div>
                          <span className={`h-4 w-4 rounded-full border-2 ${deliveryOption === "team" ? "border-slate-900 bg-slate-900" : "border-slate-300"}`}>
                            {deliveryOption === "team" ? <span className="block h-full w-full scale-[0.45] rounded-full bg-white" /> : null}
                          </span>
                        </div>
                        <h4 className="text-[14px] font-semibold text-slate-900">Team verification</h4>
                        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                          Request manual review — payout stays on hold until approved.
                        </p>
                      </button>
                    </div>

                    {deliveryOption === "upload" && (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900">Selected document</p>
                            <p className="mt-0.5 truncate text-[12px] text-slate-500">
                              {deliveryFile ? deliveryFile.name : "PDF, JPG or PNG — no file selected yet"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handlePodUploadClick}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload POD
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-[11px] font-semibold text-amber-800">Payout protection</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-amber-900/80">
                        Load status becomes completed, but funds release only after POD verification passes.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                    <button
                      type="button"
                      onClick={() => {
                        if (!deliverySubmitting) {
                          setDeliveryModalLoad(null);
                          setDeliveryFile(null);
                        }
                      }}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalizeDelivery}
                      disabled={deliverySubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deliverySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {deliverySubmitting ? "Completing…" : "Complete load"}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {podPreview && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closePodPreview}
                  className={OVERLAY_CLASS}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 12 }}
                  className="fixed left-1/2 top-1/2 z-[201] flex h-[min(88dvh,720px)] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Proof of delivery</p>
                      <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">{podPreview.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={closePodPreview}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 bg-slate-50 p-4">
                    {podPreview.url.startsWith("data:image") || /\.(png|jpg|jpeg|gif|webp)$/i.test(podPreview.url) ? (
                      <div className="flex h-full items-center justify-center overflow-auto rounded-lg bg-white p-4">
                        <img src={podPreview.url} alt={podPreview.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <iframe
                        src={podPreview.url}
                        title={podPreview.name}
                        className="h-full w-full rounded-lg border border-slate-200 bg-white"
                      />
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedLoad && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedLoad(null)}
                  className={OVERLAY_CLASS}
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed inset-y-0 right-0 z-[201] flex h-[100dvh] w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                >
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <div className="rounded-md bg-slate-900 p-1.5">
                            <Truck className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Shipment details</span>
                        </div>
                        <h3 className="text-[17px] font-bold text-slate-900">{selectedLoad.shortCode}</h3>
                        <p className="mt-0.5 text-[13px] text-slate-500">
                          {getCity(selectedLoad.origin)} → {getCity(selectedLoad.destination)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLoad(null)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                    <div className={`rounded-xl border p-4 ${
                      activeTab === "active" ? "border-blue-100 bg-blue-50/60" :
                      activeTab === "pending" ? "border-amber-100 bg-amber-50/60" :
                      "border-emerald-100 bg-emerald-50/60"
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</p>
                          <p className="mt-1 text-[15px] font-bold text-slate-900">{selectedLoad.status}</p>
                          <p className="mt-0.5 text-[12px] text-slate-600">{selectedLoad.paymentStatus}</p>
                        </div>
                        <p className="text-right text-[22px] font-bold text-slate-900">{formatMoney(selectedLoad.price)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-1.5">
                      {getStatusTimeline(selectedLoad.status.toLowerCase()).map((step) => (
                        <div
                          key={step.key}
                          className={`rounded-lg px-2 py-2 text-center ${
                            step.complete ? "bg-emerald-50 text-emerald-700" :
                            step.current ? "bg-blue-50 text-blue-700" :
                            "bg-slate-50 text-slate-400"
                          }`}
                        >
                          <p className="text-[9px] font-semibold uppercase tracking-wide">{step.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex items-stretch gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">From</p>
                          <p className="truncate text-[13px] font-semibold capitalize text-slate-900">{getCity(selectedLoad.origin)}</p>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight className="h-4 w-4 text-slate-300" />
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">To</p>
                          <p className="truncate text-[13px] font-semibold capitalize text-slate-900">{getCity(selectedLoad.destination)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {[
                        { label: "Pickup", value: selectedLoad.pickupDateLabel },
                        { label: "Delivery", value: selectedLoad.deliveryDateLabel },
                        { label: "Equipment", value: formatLabel(selectedLoad.equipment) },
                        { label: "Weight", value: selectedLoad.weightLabel },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                          <p className="text-[10px] text-slate-400">{item.label}</p>
                          <p className="mt-0.5 text-[12px] font-semibold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Operations</h4>
                      <dl className="mt-3 space-y-2.5 text-[13px]">
                        {[
                          ["Supplier", selectedLoad.supplierRef],
                          ["Booking", selectedLoad.bookingSource],
                          ["Commodity", selectedLoad.commodityLabel],
                          ["Vehicle", "truck" in selectedLoad ? selectedLoad.truck : "Not assigned"],
                          ["Driver", "driver" in selectedLoad ? selectedLoad.driver : "Not assigned"],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between gap-3">
                            <dt className="text-slate-500">{label}</dt>
                            <dd className="font-medium text-slate-900 text-right">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 p-4">
                      <p className="text-[12px] font-semibold text-slate-900">Load notes</p>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{selectedLoad.notes}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openPodDocument(selectedLoad)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View POD
                      </button>
                      <button
                        type="button"
                        onClick={() => openSupportPage(selectedLoad)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <PhoneCall className="h-4 w-4" />
                        Contact support
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  );
}
