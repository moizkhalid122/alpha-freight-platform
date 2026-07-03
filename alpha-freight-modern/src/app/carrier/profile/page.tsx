"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  CarrierProfileExtras,
  mergeCarrierExtras,
  readCarrierExtras,
} from "@/lib/profile-extras";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  Camera,
  Edit2,
  Package,
  CheckCircle2,
  Wallet,
  Loader2,
  X,
  ImagePlus,
  Truck,
  BadgeCheck,
  CalendarDays,
  ArrowRight,
  Globe2,
  BarChart3,
  FileText,
} from "lucide-react";

type CarrierProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  fleet_size?: string | number | null;
  industry?: string | null;
  created_at?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
};

type CarrierLoad = {
  id: string;
  status?: string | null;
  price?: number | string | null;
};

type CarrierStats = {
  totalLoads: number;
  completedLoads: number;
  activeLoads: number;
  totalEarnings: number;
};

type EditProfileForm = {
  fullName: string;
  companyName: string;
  phone: string;
  address: string;
  operatorId: string;
};

type UploadTarget = "avatar" | "banner";

type PendingImageCrop = {
  target: UploadTarget;
  fileName: string;
  fileSize: number;
  sourceUrl: string;
  imageWidth: number;
  imageHeight: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

const formatMoney = (value: number) => `£${value.toLocaleString()}`;

const formatSince = (dateString?: string | null) => {
  if (!dateString) return "Recently Joined";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Recently Joined";
  return `Since ${date.getFullYear()}`;
};

const formatFileSize = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const toTagList = (value?: string | string[] | null) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getCropConfig = (target: UploadTarget) =>
  target === "avatar"
    ? {
        title: "Display Photo",
        outputWidth: 900,
        outputHeight: 900,
        previewWidth: 280,
        previewHeight: 280,
      }
    : {
        title: "Banner Photo",
        outputWidth: 1600,
        outputHeight: 560,
        previewWidth: 520,
        previewHeight: 182,
      };

const getPlacement = (
  sourceWidth: number,
  sourceHeight: number,
  frameWidth: number,
  frameHeight: number,
  zoom: number,
  offsetX: number,
  offsetY: number
) => {
  const baseScale = Math.max(frameWidth / sourceWidth, frameHeight / sourceHeight);
  const scaledWidth = sourceWidth * baseScale * zoom;
  const scaledHeight = sourceHeight * baseScale * zoom;
  const overflowX = Math.max(scaledWidth - frameWidth, 0);
  const overflowY = Math.max(scaledHeight - frameHeight, 0);

  return {
    width: scaledWidth,
    height: scaledHeight,
    x: (frameWidth - scaledWidth) / 2 + (offsetX / 100) * (overflowX / 2),
    y: (frameHeight - scaledHeight) / 2 + (offsetY / 100) * (overflowY / 2),
  };
};

const readImageMeta = (file: File) =>
  new Promise<{ sourceUrl: string; width: number; height: number }>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        resolve({
          sourceUrl: String(reader.result),
          width: image.width,
          height: image.height,
        });
      };

      image.onerror = () => reject(new Error("Selected image could not be read."));
      image.src = String(reader.result);
    };

    reader.onerror = () => reject(new Error("Selected image could not be loaded."));
    reader.readAsDataURL(file);
  });

const createCroppedBlob = (crop: PendingImageCrop) =>
  new Promise<Blob>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const cropConfig = getCropConfig(crop.target);
      const canvas = document.createElement("canvas");
      canvas.width = cropConfig.outputWidth;
      canvas.height = cropConfig.outputHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Unable to process cropped image."));
        return;
      }

      const placement = getPlacement(
        crop.imageWidth,
        crop.imageHeight,
        cropConfig.outputWidth,
        cropConfig.outputHeight,
        crop.zoom,
        crop.offsetX,
        crop.offsetY
      );

      context.drawImage(image, placement.x, placement.y, placement.width, placement.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Unable to export cropped image."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.84
      );
    };

    image.onerror = () => reject(new Error("Selected image could not be cropped."));
    image.src = crop.sourceUrl;
  });

const optimizeImageToBlob = (file: File, maxWidth: number, maxHeight: number) =>
  new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to process image."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Unable to export processed image."));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.82
        );
      };

      image.onerror = () => reject(new Error("Selected image could not be read."));
      image.src = String(reader.result);
    };

    reader.onerror = () => reject(new Error("Selected image could not be loaded."));
    reader.readAsDataURL(file);
  });

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to convert image for fallback save."));
    };
    reader.onerror = () => reject(new Error("Unable to read processed image."));
    reader.readAsDataURL(blob);
  });

const getReadableError = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: string; details?: string; hint?: string };
    if (maybeError.message) return maybeError.message;
    if (maybeError.details) return maybeError.details;
    if (maybeError.hint) return maybeError.hint;
  }
  return "Image upload failed.";
};

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<"overview" | "services" | "compliance" | "stats">("overview");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CarrierProfileRecord | null>(null);
  const [profileExtras, setProfileExtras] = useState<CarrierProfileExtras>({});
  const [userEmail, setUserEmail] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<UploadTarget | null>(null);
  const [pendingImageCrop, setPendingImageCrop] = useState<PendingImageCrop | null>(null);
  const [editForm, setEditForm] = useState<EditProfileForm>({
    fullName: "",
    companyName: "",
    phone: "",
    address: "",
    operatorId: "",
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [stats, setStats] = useState<CarrierStats>({
    totalLoads: 0,
    completedLoads: 0,
    activeLoads: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    async function getProfileData() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProfile(null);
          setProfileExtras({});
          setUserEmail("");
          setStats({ totalLoads: 0, completedLoads: 0, activeLoads: 0, totalEarnings: 0 });
          return;
        }

        setUserEmail(user.email || "");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setProfile((profileData || null) as CarrierProfileRecord | null);
        setProfileExtras(
          mergeCarrierExtras(user.id, {
            email: user.email || null,
            avatarUrl:
              (profileData as CarrierProfileRecord | null)?.avatar_url ||
              readCarrierExtras(user.id).avatarUrl ||
              null,
            bannerUrl:
              (profileData as CarrierProfileRecord | null)?.banner_url ||
              readCarrierExtras(user.id).bannerUrl ||
              null,
          })
        );

        const { data: loads, error: loadsError } = await supabase
          .from("loads")
          .select("id, status, price")
          .eq("carrier_id", user.id);

        if (loadsError) throw loadsError;

        const safeLoads = (loads || []) as CarrierLoad[];
        const completedLoads = safeLoads.filter(
          (load) => load.status === "completed" || load.status === "delivered"
        ).length;
        const activeLoads = safeLoads.filter((load) =>
          ["booked", "accepted", "loading", "in-transit"].includes(load.status || "")
        ).length;
        const totalEarnings = safeLoads.reduce((sum, load) => sum + (Number(load.price) || 0), 0);

        setStats({
          totalLoads: safeLoads.length,
          completedLoads,
          activeLoads,
          totalEarnings,
        });
      } catch (error) {
        console.error("Error fetching carrier profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    getProfileData();
  }, []);

  const companyName = useMemo(() => {
    return (
      profileExtras.companyName?.trim() ||
      profile?.company_name?.trim() ||
      profile?.full_name?.trim() ||
      userEmail.split("@")[0] ||
      "Carrier Account"
    );
  }, [profile, profileExtras.companyName, userEmail]);

  const phone = profileExtras.phone || "Not provided";
  const address = profileExtras.address || "Not provided";
  const operatorId = profileExtras.operatorId || "Not provided";
  const isVerified = Boolean(profile?.role === "carrier");
  const registrationNo = profileExtras.registrationNo || "Not provided";
  const insuranceExpiry = profileExtras.insuranceExpiry || "Not provided";
  const website = profileExtras.website?.trim() || "";
  const countryName = profileExtras.countryName || "United Kingdom";
  const availability = profileExtras.availability || "Availability not configured";
  const verificationStatus = profileExtras.verificationStatus || (isVerified ? "verified" : "pending");
  const accountStatus = profileExtras.accountStatus || (isVerified ? "active" : "review");
  const payoutStatus = profileExtras.payoutSetupComplete ? "Payout ready" : "Payout setup pending";
  const fleetSize = profileExtras.fleetSize || String(profile?.fleet_size || "Not provided");
  const yearsInBusiness = profileExtras.yearsInBusiness || "Not provided";
  const servicesOffered = toTagList(profileExtras.servicesOffered);
  const specializations = toTagList(profileExtras.specializations);
  const vehicleTypes = toTagList(profileExtras.vehicleTypes);
  const operatingRegions = toTagList(profileExtras.operatingRegion);
  const profileDescription =
    profileExtras.description?.trim() ||
    `${companyName} operates as a premium carrier profile across the Alpha Freight marketplace with a focus on dependable execution, verified operations, and strong service visibility.`;
  const avatarUrl = profileExtras.avatarUrl || profile?.avatar_url || null;
  const bannerUrl = profileExtras.bannerUrl || profile?.banner_url || null;
  const joinedLabel = formatSince(profile?.created_at);
  const cropConfig = pendingImageCrop ? getCropConfig(pendingImageCrop.target) : null;
  const cropPreviewPlacement =
    pendingImageCrop && cropConfig
      ? getPlacement(
          pendingImageCrop.imageWidth,
          pendingImageCrop.imageHeight,
          cropConfig.previewWidth,
          cropConfig.previewHeight,
          pendingImageCrop.zoom,
          pendingImageCrop.offsetX,
          pendingImageCrop.offsetY
        )
      : null;

  const completionRate =
    stats.totalLoads > 0 ? Math.round((stats.completedLoads / stats.totalLoads) * 100) : 0;

  const completionChecks = [
    Boolean(companyName && companyName !== "Carrier Account"),
    Boolean(userEmail),
    Boolean(phone && phone !== "Not provided"),
    Boolean(address && address !== "Not provided"),
    Boolean(operatorId && operatorId !== "Not provided"),
  ];

  const completionPercentage = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100
  );

  const nextMilestone =
    completionPercentage < 100
      ? "Complete your carrier profile to unlock a stronger marketplace presence."
      : isVerified
        ? "Carrier profile is fully configured and ready for active operations."
        : "Profile is complete. Final verification will strengthen your carrier trust signal.";

  const sectionTabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "services" as const, label: "Services" },
    { id: "compliance" as const, label: "Compliance" },
    { id: "stats" as const, label: "Your Stats" },
  ];

  const spotlightMetrics = [
    {
      label: "Verification",
      value: isVerified ? "Verified carrier" : "Verification pending",
      icon: Shield,
      tone: isVerified ? "text-emerald-600" : "text-amber-600",
    },
    {
      label: "Payout",
      value: payoutStatus,
      icon: Wallet,
      tone: "text-violet-600",
    },
    {
      label: "Profile",
      value: `${completionPercentage}% complete`,
      icon: BadgeCheck,
      tone: "text-blue-600",
    },
  ];

  const infoItems = [
    { icon: <Building />, label: "Carrier Name", value: companyName },
    { icon: <Shield />, label: "Operator ID", value: operatorId },
    { icon: <Mail />, label: "Email", value: userEmail || "Not provided" },
    { icon: <Phone />, label: "Phone", value: phone },
    { icon: <MapPin />, label: "Base Address", value: address },
  ];

  const quickStats = [
    { icon: <Truck className="w-4 h-4" />, label: "Active Loads", value: stats.activeLoads.toLocaleString() },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Completed Loads", value: stats.completedLoads.toLocaleString() },
    { icon: <Wallet className="w-4 h-4" />, label: "Carrier Earnings", value: formatMoney(stats.totalEarnings) },
  ];

  const openEditModal = () => {
    setEditForm({
      fullName: profile?.full_name || "",
      companyName: profileExtras.companyName || "",
      phone: profileExtras.phone || "",
      address: profileExtras.address || "",
      operatorId: profileExtras.operatorId || "",
    });
    setSaveMessage(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated.");

      const payload = {
        full_name: editForm.fullName.trim() || null,
        company_name: editForm.companyName.trim() || null,
      };

      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select("*")
        .single();

      if (error) throw error;

      setProfile((updatedProfile || null) as CarrierProfileRecord | null);
      const updatedExtras = mergeCarrierExtras(user.id, {
        companyName: editForm.companyName.trim() || null,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        operatorId: editForm.operatorId.trim() || null,
        email: user.email || profileExtras.email || null,
      });
      setProfileExtras(updatedExtras);
      setSaveMessage({ type: "success", text: "Carrier profile updated successfully." });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating carrier profile:", error);
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Profile update failed.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPreparedImage = async (target: UploadTarget, optimizedBlob: Blob) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated.");

    const persistProfileImage = async (imageValue: string) => {
      const updatedExtras = mergeCarrierExtras(user.id, {
        ...(target === "banner" ? { bannerUrl: imageValue } : { avatarUrl: imageValue }),
      });
      setProfileExtras(updatedExtras);

      if (target === "avatar") {
        const { error } = await supabase.from("profiles").update({ avatar_url: imageValue }).eq("id", user.id);
        if (error) throw error;
        setProfile((current) => (current ? { ...current, avatar_url: imageValue } : current));
      }

      if (target === "banner") {
        const { error } = await supabase.from("profiles").update({ banner_url: imageValue }).eq("id", user.id);
        if (error) throw error;
        setProfile((current) => (current ? { ...current, banner_url: imageValue } : current));
      }
    };

    const filePath = `${user.id}/profile-media/${target}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("pods")
      .upload(filePath, optimizedBlob, {
        upsert: true,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      const uploadMessage = getReadableError(uploadError).toLowerCase();
      if (uploadMessage.includes("bucket not found")) {
        const fallbackDataUrl = await blobToDataUrl(optimizedBlob);
        await persistProfileImage(fallbackDataUrl);
      } else if (uploadMessage.includes("row-level security") || uploadMessage.includes("violates")) {
        throw new Error(
          "Image upload blocked by storage policy. Run carrier-pod-setup.sql in Supabase SQL Editor, then try again."
        );
      } else {
        throw uploadError;
      }
    } else {
      const { data: publicData } = supabase.storage.from("pods").getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl;

      if (!publicUrl) throw new Error("Uploaded image URL could not be generated.");
      await persistProfileImage(publicUrl);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: UploadTarget) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveMessage({ type: "error", text: "Please select an image file." });
      return;
    }

    try {
      setSaveMessage(null);
      const imageMeta = await readImageMeta(file);
      setPendingImageCrop({
        target,
        fileName: file.name,
        fileSize: file.size,
        sourceUrl: imageMeta.sourceUrl,
        imageWidth: imageMeta.width,
        imageHeight: imageMeta.height,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      });
    } catch (error) {
      console.error(`Error uploading ${target} image:`, error);
      setSaveMessage({
        type: "error",
        text: getReadableError(error),
      });
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleConfirmCroppedUpload = async () => {
    if (!pendingImageCrop) return;

    try {
      setUploadingTarget(pendingImageCrop.target);
      setSaveMessage(null);

      const croppedBlob = await createCroppedBlob(pendingImageCrop);
      const optimizedBlob = await optimizeImageToBlob(
        new File([croppedBlob], pendingImageCrop.fileName, { type: "image/jpeg" }),
        pendingImageCrop.target === "avatar" ? 500 : 1200,
        pendingImageCrop.target === "avatar" ? 500 : 600
      );

      await uploadPreparedImage(pendingImageCrop.target, optimizedBlob);
      setPendingImageCrop(null);
      setSaveMessage({
        type: "success",
        text:
          pendingImageCrop.target === "avatar"
            ? "Display photo updated successfully."
            : "Banner photo updated successfully.",
      });
    } catch (error) {
      console.error("Error confirming cropped image upload:", error);
      setSaveMessage({
        type: "error",
        text: getReadableError(error),
      });
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleRemoveBanner = async () => {
    if (!bannerUrl) return;

    try {
      setUploadingTarget("banner");
      setSaveMessage(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated.");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ banner_url: null })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const updatedExtras = mergeCarrierExtras(user.id, {
        bannerUrl: null,
      });

      setProfileExtras(updatedExtras);
      setProfile((current) => (current ? { ...current, banner_url: null } : current));
      setPendingImageCrop((current) => (current?.target === "banner" ? null : current));
      setSaveMessage({
        type: "success",
        text: "Banner image removed successfully.",
      });
    } catch (error) {
      console.error("Error removing banner image:", error);
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to remove banner image.",
      });
    } finally {
      setUploadingTarget(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-10">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePhotoUpload(e, "avatar")}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePhotoUpload(e, "banner")}
      />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative"
      >
        <div className="relative h-[148px] overflow-hidden rounded-b-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/60 sm:mx-4 sm:mt-4 sm:rounded-2xl lg:mx-6 lg:mt-6">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt={`${companyName} banner`} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/10" />
          <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100 sm:right-4 sm:top-4">
            {bannerUrl ? (
              <button
                type="button"
                onClick={handleRemoveBanner}
                disabled={uploadingTarget === "banner"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploadingTarget === "banner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Remove
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingTarget === "banner"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/85 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploadingTarget === "banner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              Update banner
            </button>
          </div>
        </div>

        <div className="relative -mt-8 grid gap-6 px-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
          <aside className="space-y-4 self-start lg:sticky lg:top-6">
            <div className="rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60">
              <div className="flex flex-col items-center text-center">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group/avatar">
                  <div className="h-[88px] w-[88px] rounded-full p-1 ring-2 ring-white shadow-md">
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={companyName} className="h-full w-full object-cover" />
                      ) : (
                        <User size={36} />
                      )}
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition group-hover/avatar:opacity-100"
                      >
                        {uploadingTarget === "avatar" ? (
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        ) : (
                          <Camera className="h-5 w-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                  <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
                    {loading ? "Loading profile…" : companyName}
                  </h1>
                  {isVerified ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 p-1 text-emerald-600">
                      <BadgeCheck className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {profile?.full_name?.trim() || "Carrier operations profile"}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {profileExtras.accountType || "Premium carrier workspace"}
                </p>

                <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <MapPin className="h-3 w-3" />
                  {countryName}
                </span>

                <button
                  type="button"
                  onClick={openEditModal}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit profile
                </button>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <p className="text-[11px] font-semibold text-slate-500">Carrier readiness</p>
                {[
                  { label: "Availability", value: availability },
                  { label: "Joined", value: joinedLabel },
                  { label: "Payout", value: payoutStatus },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2">
                    <span className="text-[11px] text-slate-500">{item.label}</span>
                    <span className="text-[11px] font-semibold text-slate-900">{loading ? "…" : item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                  <p className="text-[10px] text-slate-500">Loads</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{loading ? "…" : stats.totalLoads}</p>
                </div>
                <div className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                  <p className="text-[10px] text-slate-500">Earnings</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{loading ? "…" : formatMoney(stats.totalEarnings)}</p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-slate-50/80 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-slate-500">Profile strength</p>
                    <p className="mt-0.5 text-[15px] font-bold text-slate-900">
                      {loading ? "…" : `${completionPercentage}% complete`}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-emerald-700">
                    {loading ? "…" : accountStatus}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  {loading ? "Loading profile status…" : nextMilestone}
                </p>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${loading ? 0 : completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-5 lg:pt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="rounded-md bg-slate-900 p-1.5">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Account
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Carrier profile</h2>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Your marketplace presence, services, and operational credentials
                </p>
              </div>
              <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1">
                {sectionTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSection(tab.id)}
                    className={`rounded-md px-3.5 py-1.5 text-[11px] font-semibold transition ${
                      activeSection === tab.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {saveMessage && (
              <div
                className={`rounded-xl px-4 py-3 text-[13px] font-medium ${
                  saveMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            {activeSection === "overview" && (
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60"
                >
                  <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="relative p-5 sm:p-6">
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                      <div className="pl-3">
                        <p className="text-[11px] font-semibold text-emerald-600">Identity overview</p>
                        <h3 className="mt-1.5 text-[17px] font-bold leading-snug text-slate-900">
                          Showcase your carrier operation on Alpha Freight
                        </h3>
                        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">
                          {loading ? "Loading carrier narrative…" : profileDescription}
                        </p>

                        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                          {spotlightMetrics.map((item) => (
                            <div key={item.label} className="rounded-xl bg-slate-50/80 px-3 py-3">
                              <div className="flex items-center gap-2">
                                <item.icon className={`h-3.5 w-3.5 ${item.tone}`} />
                                <p className="text-[10px] text-slate-500">{item.label}</p>
                              </div>
                              <p className="mt-1 text-[12px] font-semibold text-slate-900">
                                {loading ? "…" : item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:p-6 lg:border-l lg:border-t-0">
                      <p className="text-[11px] font-semibold text-slate-500">Live snapshot</p>
                      <div className="mt-3 space-y-2">
                        {quickStats.map((item) => (
                          <div key={item.label} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-slate-200/60">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                              {item.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-500">{item.label}</p>
                              <p className="text-[13px] font-bold text-slate-900">{loading ? "…" : item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60">
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-slate-400 to-slate-200" />
                    <div className="flex items-center gap-2.5 pl-3">
                      <Building className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] text-slate-500">Core identity</p>
                        <h3 className="text-[15px] font-bold text-slate-900">Carrier details</h3>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 pl-3 sm:grid-cols-2">
                      {infoItems.map((item) => (
                        <div key={item.label} className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                          <p className="text-[10px] text-slate-500">{item.label}</p>
                          <p className="mt-1 text-[12px] font-semibold text-slate-900 break-words">
                            {loading ? "…" : item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60">
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-slate-400 to-slate-200" />
                    <div className="flex items-center gap-2.5 pl-3">
                      <Globe2 className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] text-slate-500">Operations layer</p>
                        <h3 className="text-[15px] font-bold text-slate-900">Commercial setup</h3>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 pl-3">
                      {[
                        { label: "Fleet size", value: fleetSize },
                        { label: "Years in business", value: yearsInBusiness },
                        { label: "Operating regions", value: operatingRegions.join(", ") || "Not provided" },
                        { label: "Vehicle types", value: vehicleTypes.join(", ") || "Not provided" },
                        { label: "Website", value: website || "Not provided" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5">
                          <span className="text-[11px] text-slate-500">{item.label}</span>
                          <span className="max-w-[58%] text-right text-[12px] font-semibold text-slate-900 break-words">
                            {loading ? "…" : item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "services" && (
              <div className="grid gap-4 xl:grid-cols-2">
                {[
                  { title: "Services offered", icon: Truck, items: servicesOffered },
                  { title: "Specializations", icon: Package, items: specializations },
                  { title: "Vehicle types", icon: BarChart3, items: vehicleTypes },
                  { title: "Operating regions", icon: MapPin, items: operatingRegions },
                ].map((section) => (
                  <div
                    key={section.title}
                    className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60"
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                    <div className="flex items-center gap-2.5 pl-3">
                      <section.icon className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] text-slate-500">Service profile</p>
                        <h3 className="text-[15px] font-bold text-slate-900">{section.title}</h3>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 pl-3">
                      {(section.items.length ? section.items : ["Not provided"]).map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700"
                        >
                          <ArrowRight className="h-3 w-3 text-emerald-600" />
                          {loading ? "…" : item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "compliance" && (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                  <div className="flex items-center gap-2.5 pl-3">
                    <Shield className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-500">Compliance</p>
                      <h3 className="text-[15px] font-bold text-slate-900">Verification and registration</h3>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 pl-3 sm:grid-cols-2">
                    {[
                      { label: "Verification status", value: verificationStatus },
                      { label: "Account status", value: accountStatus },
                      { label: "Operator ID", value: operatorId },
                      { label: "Registration no.", value: registrationNo },
                      { label: "Insurance expiry", value: insuranceExpiry },
                      { label: "Directory listing", value: profileExtras.directoryListing ? "Enabled" : "Disabled" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                        <p className="text-[10px] text-slate-500">{item.label}</p>
                        <p className="mt-1 text-[12px] font-semibold capitalize text-slate-900 break-words">
                          {loading ? "…" : item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-5">
                  <p className="text-[11px] font-semibold text-slate-500">Review notes</p>
                  <h3 className="mt-1 text-[15px] font-bold text-slate-900">Trust and operational readiness</h3>
                  <div className="mt-4 space-y-2.5">
                    {[
                      { icon: CalendarDays, label: "Joined", value: joinedLabel },
                      { icon: FileText, label: "Verification notes", value: profileExtras.verificationNotes || "No internal verification note yet." },
                      { icon: Wallet, label: "Payment terms", value: profileExtras.paymentTerms || "Standard terms not provided" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-white px-3 py-3 ring-1 ring-slate-200/60">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </div>
                        <p className="mt-1.5 text-[12px] font-semibold leading-5 text-slate-900">
                          {loading ? "…" : item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "stats" && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total loads", value: stats.totalLoads.toLocaleString(), icon: Package, tone: "text-blue-600" },
                    { label: "Completed loads", value: stats.completedLoads.toLocaleString(), icon: CheckCircle2, tone: "text-emerald-600" },
                    { label: "Active loads", value: stats.activeLoads.toLocaleString(), icon: Truck, tone: "text-violet-600" },
                    { label: "Carrier earnings", value: formatMoney(stats.totalEarnings), icon: Wallet, tone: "text-amber-600" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50/80 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <item.icon className={`h-3.5 w-3.5 ${item.tone}`} />
                        <p className="text-[11px] text-slate-500">{item.label}</p>
                      </div>
                      <p className="mt-1 text-xl font-bold text-slate-900">{loading ? "…" : item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60">
                    <p className="text-[11px] text-slate-500">Completion metrics</p>
                    <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Operational performance</h3>
                    <div className="mt-4 space-y-4">
                      {[
                        { label: "Profile completion", value: completionPercentage, color: "bg-blue-500" },
                        { label: "Load completion rate", value: completionRate, color: "bg-emerald-500" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
                            <span>{item.label}</span>
                            <span className="font-semibold text-slate-900">{loading ? "…" : `${item.value}%`}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${loading ? 0 : item.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60">
                    <p className="text-[11px] text-slate-500">Commercial signals</p>
                    <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">What your profile communicates</h3>
                    <div className="mt-4 space-y-2">
                      {[
                        { label: "Website", value: website || "Add website to strengthen trust" },
                        { label: "Specializations", value: specializations.length ? `${specializations.length} service tags added` : "No specializations added yet" },
                        { label: "Regions", value: operatingRegions.length ? `${operatingRegions.length} region tags active` : "No regions published yet" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                          <p className="text-[10px] text-slate-500">{item.label}</p>
                          <p className="mt-1 text-[12px] font-semibold text-slate-900">{loading ? "…" : item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {pendingImageCrop && cropConfig && cropPreviewPlacement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Image editor</p>
                  <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
                    Crop {cropConfig.title}
                  </h2>
                  <p className="mt-1.5 text-[13px] text-slate-500">
                    Review the preview, file size, and framing before uploading.
                  </p>
                </div>
                <button
                  onClick={() => setPendingImageCrop(null)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-slate-100"
                  aria-label="Close image crop modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50/80 p-5">
                  <div
                    className={`relative mx-auto overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-inner ${
                      pendingImageCrop.target === "avatar" ? "rounded-[2rem]" : ""
                    }`}
                    style={{
                      width: `${cropConfig.previewWidth}px`,
                      height: `${cropConfig.previewHeight}px`,
                      maxWidth: "100%",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingImageCrop.sourceUrl}
                      alt="Crop preview"
                      className="absolute max-w-none select-none"
                      draggable={false}
                      style={{
                        width: `${cropPreviewPlacement.width}px`,
                        height: `${cropPreviewPlacement.height}px`,
                        left: `${cropPreviewPlacement.x}px`,
                        top: `${cropPreviewPlacement.y}px`,
                      }}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">File Size</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{formatFileSize(pendingImageCrop.fileSize)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Resolution</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {pendingImageCrop.imageWidth} x {pendingImageCrop.imageHeight}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Export Size</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {cropConfig.outputWidth} x {cropConfig.outputHeight}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-5">
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Selected File</p>
                      <p className="mt-2 text-sm font-bold text-slate-900 break-all">{pendingImageCrop.fileName}</p>
                    </div>

                    <label className="block">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Zoom</span>
                        <span className="text-xs font-bold text-slate-900">{pendingImageCrop.zoom.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="2.4"
                        step="0.01"
                        value={pendingImageCrop.zoom}
                        onChange={(e) =>
                          setPendingImageCrop((prev) =>
                            prev ? { ...prev, zoom: Number(e.target.value) } : prev
                          )
                        }
                        className="w-full accent-slate-900"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Horizontal Position</span>
                        <span className="text-xs font-bold text-slate-900">{pendingImageCrop.offsetX}%</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value={pendingImageCrop.offsetX}
                        onChange={(e) =>
                          setPendingImageCrop((prev) =>
                            prev ? { ...prev, offsetX: Number(e.target.value) } : prev
                          )
                        }
                        className="w-full accent-slate-900"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Vertical Position</span>
                        <span className="text-xs font-bold text-slate-900">{pendingImageCrop.offsetY}%</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value={pendingImageCrop.offsetY}
                        onChange={(e) =>
                          setPendingImageCrop((prev) =>
                            prev ? { ...prev, offsetY: Number(e.target.value) } : prev
                          )
                        }
                        className="w-full accent-slate-900"
                      />
                    </label>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Tip</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                        Adjust the zoom and position until the preview matches the final image you want to upload.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      onClick={() => setPendingImageCrop(null)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        setPendingImageCrop((prev) =>
                          prev ? { ...prev, zoom: 1, offsetX: 0, offsetY: 0 } : prev
                        )
                      }
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleConfirmCroppedUpload}
                      disabled={uploadingTarget === pendingImageCrop.target}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {uploadingTarget === pendingImageCrop.target ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      Crop and Upload
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Carrier profile</p>
                  <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">Edit carrier details</h2>
                  <p className="mt-1.5 text-[13px] text-slate-500">
                    Update the information that appears on your carrier profile.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-slate-100"
                  aria-label="Close edit profile modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Full Name</span>
                  <input
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
                    placeholder="Your full name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Company Name</span>
                  <input
                    value={editForm.companyName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
                    placeholder="Company name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Phone</span>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
                    placeholder="+44 7000 000000"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Operator ID</span>
                  <input
                    value={editForm.operatorId}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, operatorId: e.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
                    placeholder="Operator or compliance ID"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Address</span>
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
                    placeholder="Operating base address"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Email</span>
                  <input
                    value={userEmail}
                    disabled
                    className="h-12 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500 outline-none"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
