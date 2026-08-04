"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  SupplierProfileExtras,
  mergeSupplierExtras,
  readSupplierExtras,
} from "@/lib/profile-extras";
import { User, Mail, Phone, MapPin, Building, Shield, Camera, Edit2, Package, CheckCircle2, Wallet, Loader2, X, ImagePlus, BadgeCheck, Globe2 } from "lucide-react";

type SupplierProfileRecord = {
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

type SupplierLoad = {
  id: string;
  status?: string | null;
  price?: number | string | null;
};

type SupplierStats = {
  totalLoads: number;
  completedLoads: number;
  totalSpend: number;
};

type EditProfileForm = {
  fullName: string;
  companyName: string;
  phone: string;
  address: string;
  taxId: string;
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

const formatMoney = (value: number) => `£${value.toLocaleString("en-GB")}`;

const formatSince = (dateString?: string | null) => {
  if (!dateString) return "Recently joined";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Recently joined";
  return `Since ${date.getFullYear()}`;
};

const formatFileSize = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
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

export default function SupplierProfile() {
  const [activeSection, setActiveSection] = useState<"overview" | "details" | "stats">("overview");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SupplierProfileRecord | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [profileExtras, setProfileExtras] = useState<SupplierProfileExtras>({});
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
    taxId: "",
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [stats, setStats] = useState<SupplierStats>({
    totalLoads: 0,
    completedLoads: 0,
    totalSpend: 0,
  });

  useEffect(() => {
    async function getProfileData() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setCurrentUserId("");
          setProfile(null);
          setProfileExtras({});
          setUserEmail("");
          setStats({ totalLoads: 0, completedLoads: 0, totalSpend: 0 });
          return;
        }

        setCurrentUserId(user.id);
        setUserEmail(user.email || "");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setProfile((profileData || null) as SupplierProfileRecord | null);
        setProfileExtras(
          mergeSupplierExtras(user.id, {
            email: user.email || null,
            companyName: profileData?.company_name || null,
            industry: profileData?.industry || null,
            avatarUrl: profileData?.avatar_url || readSupplierExtras(user.id).avatarUrl || null,
            bannerUrl: profileData?.banner_url || readSupplierExtras(user.id).bannerUrl || null,
          })
        );

        const { data: loads, error: loadsError } = await supabase
          .from("loads")
          .select("id, status, price")
          .eq("supplier_id", user.id);

        if (loadsError) throw loadsError;

        const safeLoads = ((loads || []) as SupplierLoad[]);
        const completedLoads = safeLoads.filter(
          (load) => load.status === "completed" || load.status === "delivered"
        ).length;
        const totalSpend = safeLoads.reduce((sum, load) => sum + (Number(load.price) || 0), 0);

        setStats({
          totalLoads: safeLoads.length,
          completedLoads,
          totalSpend,
        });
      } catch (error) {
        console.error("Error fetching supplier profile data:", error);
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
      "Supplier Account"
    );
  }, [profile, profileExtras.companyName, userEmail]);

  const phone = profileExtras.phone || "";
  const address = profileExtras.address || "";
  const taxId = profileExtras.taxId || "";
  const avatarUrl = profileExtras.avatarUrl || profile?.avatar_url || null;
  const bannerUrl = profileExtras.bannerUrl || profile?.banner_url || null;
  const industry = profileExtras.industry || profile?.industry || "";
  const joinedLabel = formatSince(profile?.created_at);
  const isVerified = Boolean(profile?.role === "supplier");
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

  const completionChecks = [
    { label: "Company name", done: Boolean(companyName && companyName !== "Supplier Account") },
    { label: "Email", done: Boolean(userEmail) },
    { label: "Phone", done: Boolean(phone) },
    { label: "Address", done: Boolean(address) },
    { label: "Tax ID", done: Boolean(taxId) },
  ];

  const completionPercentage = Math.round(
    (completionChecks.filter((item) => item.done).length / completionChecks.length) * 100
  );

  const nextMilestone =
    completionPercentage < 100
      ? "Complete your company details to finish supplier onboarding."
      : isVerified
        ? "Supplier profile is fully configured and verification is active."
        : "Profile is complete. Admin verification will unlock verified supplier status.";

  const profileDescription =
    `${companyName} posts freight on Alpha Freight with a focus on reliable shipments, clear requirements, and strong carrier partnerships.`;

  const completionRate =
    stats.totalLoads > 0 ? Math.round((stats.completedLoads / stats.totalLoads) * 100) : 0;

  const sectionTabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "details" as const, label: "Company details" },
    { id: "stats" as const, label: "Activity" },
  ];

  const spotlightMetrics = [
    {
      label: "Verification",
      value: isVerified ? "Verified supplier" : "Verification pending",
      icon: Shield,
      tone: isVerified ? "text-emerald-600" : "text-amber-600",
    },
    {
      label: "Profile",
      value: `${completionPercentage}% complete`,
      icon: BadgeCheck,
      tone: "text-blue-600",
    },
    {
      label: "Industry",
      value: industry || "Not specified",
      icon: Package,
      tone: "text-violet-600",
    },
  ];

  const infoItemsFlat = [
    { label: "Legal name", value: companyName },
    { label: "Contact person", value: profile?.full_name || "Not provided" },
    { label: "Tax ID", value: taxId || "Not provided" },
    { label: "Email", value: userEmail || "Not provided" },
    { label: "Phone", value: phone || "Not provided" },
    { label: "Address", value: address || "Not provided" },
  ];

  const quickStats = [
    { icon: Package, label: "Total loads", value: stats.totalLoads.toLocaleString("en-GB") },
    { icon: CheckCircle2, label: "Completed", value: stats.completedLoads.toLocaleString("en-GB") },
    { icon: Wallet, label: "Freight spend", value: formatMoney(stats.totalSpend) },
  ];

  const openEditModal = () => {
    setEditForm({
      fullName: profile?.full_name || "",
      companyName: profileExtras.companyName || "",
      phone: profileExtras.phone || "",
      address: profileExtras.address || "",
      taxId: profileExtras.taxId || "",
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

      setProfile((updatedProfile || null) as SupplierProfileRecord | null);
      const updatedExtras = mergeSupplierExtras(user.id, {
        companyName: editForm.companyName.trim() || null,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        taxId: editForm.taxId.trim() || null,
        email: user.email || profileExtras.email || null,
      });
      setProfileExtras(updatedExtras);
      setSaveMessage({ type: "success", text: "Profile updated successfully." });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating supplier profile:", error);
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
      const updatedExtras = mergeSupplierExtras(user.id, {
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

      const updatedExtras = mergeSupplierExtras(user.id, { bannerUrl: null });
      setProfileExtras(updatedExtras);
      setProfile((current) => (current ? { ...current, banner_url: null } : current));
      setPendingImageCrop((current) => (current?.target === "banner" ? null : current));
      setSaveMessage({ type: "success", text: "Banner image removed successfully." });
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

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="group relative">
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
                onClick={() => void handleRemoveBanner()}
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
                <div className="relative group/avatar">
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
                </div>

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
                  {profile?.full_name?.trim() || "Supplier company profile"}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {profileExtras.accountType || "Supplier workspace"}
                </p>

                <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <MapPin className="h-3 w-3" />
                  {profileExtras.city || address || "United Kingdom"}
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
                <p className="text-[11px] font-semibold text-slate-500">Account snapshot</p>
                {[
                  { label: "Joined", value: joinedLabel },
                  { label: "Industry", value: industry || "Not specified" },
                  { label: "Tax ID", value: taxId || "Not added" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2">
                    <span className="text-[11px] text-slate-500">{item.label}</span>
                    <span className="max-w-[58%] truncate text-right text-[11px] font-semibold text-slate-900">
                      {loading ? "…" : item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                  <p className="text-[10px] text-slate-500">Loads</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{loading ? "…" : stats.totalLoads}</p>
                </div>
                <div className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                  <p className="text-[10px] text-slate-500">Spend</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{loading ? "…" : formatMoney(stats.totalSpend)}</p>
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
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {isVerified ? "Verified" : "Pending"}
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
                    <Building className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Account</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Supplier profile</h2>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Your company identity, contact details, and freight activity
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

            {saveMessage ? (
              <div
                className={`rounded-xl px-4 py-3 text-[13px] font-medium ${
                  saveMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                }`}
              >
                {saveMessage.text}
              </div>
            ) : null}

            {activeSection === "overview" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60">
                  <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="relative p-5 sm:p-6">
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                      <div className="pl-3">
                        <p className="text-[11px] font-semibold text-emerald-600">Company overview</p>
                        <h3 className="mt-1.5 text-[17px] font-bold leading-snug text-slate-900">
                          Your supplier presence on Alpha Freight
                        </h3>
                        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">
                          {loading ? "Loading supplier narrative…" : profileDescription}
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
                              <item.icon className="h-4 w-4" />
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
                </div>

                <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-slate-400 to-slate-200" />
                  <div className="flex items-center gap-2.5 pl-3">
                    <Building className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-500">Core identity</p>
                      <h3 className="text-[15px] font-bold text-slate-900">Key company details</h3>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 pl-3 sm:grid-cols-2 lg:grid-cols-3">
                    {infoItemsFlat.slice(0, 3).map((item) => (
                      <div key={item.label} className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                        <p className="text-[10px] text-slate-500">{item.label}</p>
                        <p className="mt-1 text-[12px] font-semibold text-slate-900 break-words">
                          {loading ? "…" : item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "details" && (
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                  <div className="flex items-center gap-2.5 pl-3">
                    <Globe2 className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-500">Contact layer</p>
                      <h3 className="text-[15px] font-bold text-slate-900">Company information</h3>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 pl-3 sm:grid-cols-2">
                    {infoItemsFlat.map((item) => (
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
                    <Shield className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-slate-500">Onboarding</p>
                      <h3 className="text-[15px] font-bold text-slate-900">Profile checklist</h3>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 pl-3">
                    {completionChecks.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                          item.done ? "bg-emerald-50/80" : "bg-slate-50/80"
                        }`}
                      >
                        <span className="text-[12px] text-slate-700">{item.label}</span>
                        {item.done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Pending</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg bg-slate-50/80 px-3 py-3 pl-6">
                    <p className="text-[11px] font-semibold text-slate-500">Next step</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                      {loading ? "Loading profile status…" : nextMilestone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "stats" && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Total loads", value: stats.totalLoads.toLocaleString("en-GB"), icon: Package, tone: "text-blue-600" },
                    { label: "Completed loads", value: stats.completedLoads.toLocaleString("en-GB"), icon: CheckCircle2, tone: "text-emerald-600" },
                    { label: "Freight spend", value: formatMoney(stats.totalSpend), icon: Wallet, tone: "text-violet-600" },
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
                    <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Freight activity</h3>
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
                    <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Account highlights</h3>
                    <div className="mt-4 space-y-2">
                      {[
                        { label: "Industry", value: industry || "Add industry to strengthen profile" },
                        { label: "Monthly volume", value: profileExtras.monthlyVolume || "Not provided" },
                        { label: "Commodity focus", value: profileExtras.commodity || "Not provided" },
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
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[6px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative z-[201] w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200/60 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Image editor</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Crop {cropConfig.title}</h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Adjust framing before uploading.
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
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[6px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative z-[201] w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/60 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Supplier profile</p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Edit company details</h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Update the details shown on your supplier profile.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                  aria-label="Close edit profile modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Full name</span>
                  <input
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-200 focus:bg-white"
                    placeholder="Your full name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Company name</span>
                  <input
                    value={editForm.companyName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-200 focus:bg-white"
                    placeholder="Company name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Phone</span>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-200 focus:bg-white"
                    placeholder="+44 7000 000000"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tax ID</span>
                  <input
                    value={editForm.taxId}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, taxId: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-200 focus:bg-white"
                    placeholder="Tax or VAT number"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Address</span>
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-200 focus:bg-white"
                    placeholder="Company address"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Email</span>
                  <input
                    value={userEmail}
                    disabled
                    className="h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-[13px] font-medium text-slate-500 outline-none"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
                  Save changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
