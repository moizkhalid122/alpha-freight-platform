import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SupplierMyPost } from "@/lib/supplier-my-posts";
import { isPodImageUrl, reviewSupplierLoadPod, type PodReviewDecision } from "@/lib/supplier-pod-review";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type SupplierPodReviewModalProps = {
  post: SupplierMyPost | null;
  visible: boolean;
  onClose: () => void;
  onReviewed: () => void;
};

export default function SupplierPodReviewModal({
  post,
  visible,
  onClose,
  onReviewed,
}: SupplierPodReviewModalProps) {
  const insets = useSafeAreaInsets();
  const [confirmAction, setConfirmAction] = useState<PodReviewDecision | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setConfirmAction(null);
    setNote("");
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleOpenDocument = () => {
    if (!post?.podUrl) return;
    void Linking.openURL(post.podUrl);
  };

  const handleConfirm = async () => {
    if (!post || !confirmAction) return;

    setSubmitting(true);
    setError(null);

    const defaultNote =
      confirmAction === "rejected"
        ? "POD rejected — please reupload a signed delivery document."
        : confirmAction === "info_required"
          ? "Please provide clearer delivery proof."
          : undefined;

    const result = await reviewSupplierLoadPod({
      loadId: post.id,
      decision: confirmAction,
      note: note.trim() || defaultNote,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    reset();
    onReviewed();
    onClose();
  };

  if (!post) return null;

  const showImage = post.podUrl ? isPodImageUrl(post.podUrl) : false;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>POD review</Text>
            <Text style={styles.title}>{post.code}</Text>
            <Text style={styles.sub}>
              {post.origin} → {post.destination}
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Delivery document</Text>
            {post.podUrl && showImage ? (
              <Image source={{ uri: post.podUrl }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="document-text-outline" size={36} color={colors.mutedLight} />
                <Text style={styles.previewPlaceholderText}>
                  {post.podName || "Proof of delivery document"}
                </Text>
              </View>
            )}
            {post.podUrl ? (
              <Pressable style={styles.openDocBtn} onPress={handleOpenDocument}>
                <Ionicons name="open-outline" size={16} color={colors.ink} />
                <Text style={styles.openDocBtnText}>Open full document</Text>
              </Pressable>
            ) : null}
          </View>

          {confirmAction ? (
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>
                {confirmAction === "verified"
                  ? "Approve this POD?"
                  : confirmAction === "rejected"
                    ? "Reject this POD?"
                    : "Request more information?"}
              </Text>
              <Text style={styles.confirmSub}>
                {confirmAction === "verified"
                  ? "The shipment will move to completed and the carrier payout can proceed."
                  : confirmAction === "rejected"
                    ? "The carrier will be asked to upload a corrected delivery document."
                    : "The carrier will be notified to provide clearer delivery proof."}
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Optional note for the carrier"
                placeholderTextColor={colors.mutedLight}
                style={styles.noteInput}
                multiline
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.confirmActions}>
                <Pressable
                  style={styles.cancelBtn}
                  disabled={submitting}
                  onPress={() => setConfirmAction(null)}
                >
                  <Text style={styles.cancelBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmBtn, submitting && styles.btnDisabled]}
                  disabled={submitting}
                  onPress={() => void handleConfirm()}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable style={styles.approveBtn} onPress={() => setConfirmAction("verified")}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                <Text style={styles.approveBtnText}>Approve POD & close shipment</Text>
              </Pressable>
              <Pressable style={styles.infoBtn} onPress={() => setConfirmAction("info_required")}>
                <Ionicons name="information-circle-outline" size={18} color={colors.ink} />
                <Text style={styles.infoBtnText}>Request more information</Text>
              </Pressable>
              <Pressable style={styles.rejectBtn} onPress={() => setConfirmAction("rejected")}>
                <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.rejectBtnText}>Reject POD</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerCopy: { flex: 1, gap: 4 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: colors.muted,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    gap: 12,
    paddingBottom: spacing.xxl,
  },
  previewCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    padding: spacing.md,
    gap: 12,
    ...shadow.soft,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.muted,
  },
  previewImage: {
    width: "100%",
    height: 280,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  previewPlaceholder: {
    height: 180,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  previewPlaceholderText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  openDocBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  openDocBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
  infoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: 14,
  },
  infoBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  rejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: colors.dangerSoft,
    paddingVertical: 14,
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.danger,
  },
  confirmCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 10,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
  },
  confirmSub: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: colors.muted,
  },
  noteInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.inputFill,
    padding: 12,
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    textAlignVertical: "top",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  confirmBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
  error: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  btnDisabled: { opacity: 0.7 },
});
