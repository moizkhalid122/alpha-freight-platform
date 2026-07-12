import * as ImagePicker from "expo-image-picker";
import { setCachedCarrierDashboard } from "@/lib/carrier-dashboard-cache";
import { fetchCarrierMyLoads } from "@/lib/carrier-my-loads";
import { setCachedCarrierWallet } from "@/lib/carrier-wallet-cache";
import { isMissingPodColumnError } from "@/lib/load-pod-verification";
import { stopCarrierGpsTracking } from "@/lib/carrier-gps-tracker";
import { supabase } from "@/lib/supabase";

const MAX_POD_BYTES = 15 * 1024 * 1024;

function extensionFromUri(uri: string, fileName?: string | null) {
  const fromName = fileName?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const fromUri = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1]?.toLowerCase();
  if (fromUri === "png") return "png";
  if (fromUri === "pdf") return "pdf";
  if (fromUri === "webp") return "webp";
  if (fromUri === "heic") return "heic";
  return "jpg";
}

function contentTypeFromExtension(ext: string) {
  if (ext === "png") return "image/png";
  if (ext === "pdf") return "application/pdf";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  return "image/jpeg";
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.-]+/g, "-").slice(0, 80) || "pod-document";
}

export async function pickPodDocument(): Promise<{ uri: string; fileName: string } | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to upload POD.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  const asset = result.assets[0];
  const fileName = asset.fileName || `pod-${Date.now()}.jpg`;
  return { uri: asset.uri, fileName };
}

export async function capturePodPhoto(): Promise<{ uri: string; fileName: string } | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Camera permission is required to capture POD.");
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.85,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  return {
    uri: result.assets[0].uri,
    fileName: `pod-camera-${Date.now()}.jpg`,
  };
}

export async function uploadPodDocument(
  loadId: string,
  localUri: string,
  fileName: string
): Promise<{ publicUrl: string; path: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in");

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_POD_BYTES) {
    throw new Error("POD file must be 15 MB or smaller.");
  }

  const ext = extensionFromUri(localUri, fileName);
  const safeName = sanitizeFileName(fileName.replace(/\.[^.]+$/, ""));
  const path = `${user.id}/${loadId}-${Date.now()}-${safeName}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("pods").upload(path, arrayBuffer, {
    upsert: true,
    contentType: contentTypeFromExtension(ext),
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = supabase.storage.from("pods").getPublicUrl(path);
  const publicUrl = publicData?.publicUrl;
  if (!publicUrl) throw new Error("Uploaded POD URL could not be generated.");

  return { publicUrl, path };
}

export async function deliverLoadWithPod(
  loadId: string,
  localUri: string,
  fileName: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in");

  const { publicUrl } = await uploadPodDocument(loadId, localUri, fileName);
  const now = new Date().toISOString();

  const loadUpdates = {
    status: "delivered",
    pod_url: publicUrl,
    pod_name: fileName,
    pod_uploaded_at: now,
    pod_verification_status: "pending",
    pod_review_note: null,
    pod_verified_at: null,
    updated_at: now,
  };

  const { error } = await supabase
    .from("loads")
    .update(loadUpdates)
    .eq("id", loadId)
    .eq("carrier_id", user.id);

  if (error) {
    if (isMissingPodColumnError(error.message)) {
      const { error: fallbackError } = await supabase
        .from("loads")
        .update({ status: "delivered", updated_at: now })
        .eq("id", loadId)
        .eq("carrier_id", user.id);
      if (fallbackError) throw fallbackError;
      setCachedCarrierDashboard(null);
      setCachedCarrierWallet(null);
      return fetchCarrierMyLoads();
    }
    throw error;
  }

  await stopCarrierGpsTracking(loadId);

  setCachedCarrierDashboard(null);
  setCachedCarrierWallet(null);
  return fetchCarrierMyLoads();
}
