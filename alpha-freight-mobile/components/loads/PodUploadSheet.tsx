import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PodSubmitSuccessModal from "@/components/loads/PodSubmitSuccessModal";
import {
  capturePodPhoto,
  deliverLoadWithPod,
  pickPodDocument,
} from "@/lib/carrier-pod-upload";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type PodUploadSheetProps = {
  visible: boolean;
  loadCode: string;
  routeLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onComplete: () => void;
  onDeliver: (localUri: string, fileName: string) => Promise<void>;
};

export default function PodUploadSheet({
  visible,
  loadCode,
  routeLabel,
  loading = false,
  onCancel,
  onComplete,
  onDeliver,
}: PodUploadSheetProps) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const reset = useCallback(() => {
    setPreviewUri(null);
    setFileName(null);
    setUploading(false);
    setShowSuccess(false);
  }, []);

  const handleDismiss = useCallback(() => {
    if (uploading || loading) return;
    reset();
    onCancel();
  }, [loading, onCancel, reset, uploading]);

  const handleSuccessClose = useCallback(() => {
    reset();
    onComplete();
  }, [onComplete, reset]);

  const handlePick = useCallback(async (source: "camera" | "gallery") => {
    try {
      const picked =
        source === "camera" ? await capturePodPhoto() : await pickPodDocument();
      if (!picked) return;
      setPreviewUri(picked.uri);
      setFileName(picked.fileName);
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Could not select POD document."
      );
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!previewUri || !fileName || uploading) return;
    setUploading(true);
    try {
      await onDeliver(previewUri, fileName);
      setShowSuccess(true);
    } catch (error) {
      Alert.alert(
        "Delivery failed",
        error instanceof Error ? error.message : "Could not upload POD right now."
      );
    } finally {
      setUploading(false);
    }
  }, [fileName, onDeliver, previewUri, uploading]);

  const busy = uploading || loading;

  if (showSuccess) {
    return (
      <PodSubmitSuccessModal
        visible={visible}
        loadCode={loadCode}
        routeLabel={routeLabel}
        onClose={handleSuccessClose}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleDismiss} />

        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="document-text-outline" size={24} color={colors.ink} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Upload proof of delivery</Text>
              <Text style={styles.subtitle}>
                {loadCode} · {routeLabel}
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={handleDismiss} disabled={busy}>
              <Ionicons name="close" size={18} color={colors.inkSoft} />
            </Pressable>
          </View>

          <Text style={styles.body}>
            Delivery is only marked complete after you upload a signed POD photo. Supplier will
            verify before funds are released.
          </Text>

          {previewUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
              <Pressable
                style={styles.changeBtn}
                disabled={busy}
                onPress={() => {
                  setPreviewUri(null);
                  setFileName(null);
                }}
              >
                <Text style={styles.changeBtnText}>Change photo</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.pickRow}>
              <Pressable
                style={({ pressed }) => [styles.pickBtn, pressed && styles.pressed]}
                disabled={busy}
                onPress={() => void handlePick("camera")}
              >
                <Ionicons name="camera-outline" size={22} color={colors.ink} />
                <Text style={styles.pickBtnText}>Take photo</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.pickBtn, pressed && styles.pressed]}
                disabled={busy}
                onPress={() => void handlePick("gallery")}
              >
                <Ionicons name="images-outline" size={22} color={colors.ink} />
                <Text style={styles.pickBtnText}>Gallery</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={[styles.primaryBtn, (!previewUri || busy) && styles.primaryBtnDisabled]}
            disabled={!previewUri || busy}
            onPress={() => void handleSubmit()}
          >
            {busy ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.ink} />
                <Text style={styles.primaryBtnText}>Submit POD & mark delivered</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export { deliverLoadWithPod };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
  },
  body: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.inkSoft,
    lineHeight: 20,
  },
  pickRow: {
    flexDirection: "row",
    gap: 10,
  },
  pickBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
  },
  pickBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  previewWrap: {
    gap: 8,
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.inputFill,
  },
  changeBtn: {
    alignSelf: "flex-start",
  },
  changeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: 16,
    marginTop: spacing.xs,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  pressed: {
    opacity: 0.88,
  },
});
