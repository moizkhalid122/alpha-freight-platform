import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PostLoadFormData } from "@/lib/supplier-post-load";
import { extractPostLoadFromDescription } from "@/lib/supplier-post-load-ai";
import { useAiVoiceInput } from "@/lib/use-ai-voice-input";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type PostLoadAiSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (draft: Partial<PostLoadFormData>, summary: string) => void;
};

export default function PostLoadAiSheet({ visible, onClose, onApply }: PostLoadAiSheetProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [draft, setDraft] = useState<Partial<PostLoadFormData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setMissing([]);
    setDraft(null);
    setError(null);
  }, []);

  const extractRef = useRef<(raw?: string) => Promise<void>>(async () => {});

  const handleExtract = useCallback(async (raw?: string) => {
    const value = (raw ?? text).trim();
    if (!value) {
      setError("Describe your shipment first.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await extractPostLoadFromDescription(value);
    setDraft(result.draft);
    setPreview(result.summary);
    setMissing(result.missingFields);
    setLoading(false);

    if (result.confidence === "low") {
      setError("Add pickup, delivery, weight, or cargo type for better results.");
    }
  }, [text]);

  extractRef.current = handleExtract;

  const { isListening, partialText, toggleListening } = useAiVoiceInput({
    onFinalTranscript: (transcript) => {
      setText(transcript);
      void extractRef.current(transcript);
    },
  });

  const handleApply = () => {
    if (!draft) return;
    onApply(draft, preview || "AI draft applied");
    setText("");
    reset();
    onClose();
  };

  const composerValue = isListening && partialText ? partialText : text;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
        >
          <View style={styles.grabber} />
          <Text style={styles.title}>Fill with AI</Text>
          <Text style={styles.sub}>
            Describe your shipment in plain language — pickup, delivery, weight, and dates. Review every
            field before publishing.
          </Text>

          <View style={styles.inputWrap}>
            <TextInput
              value={composerValue}
              onChangeText={setText}
              placeholder="e.g. Tomorrow 9am Birmingham to London, 1200kg steel, curtainside, urgent"
              placeholderTextColor={colors.mutedLight}
              style={styles.input}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              style={[styles.micBtn, isListening && styles.micBtnActive]}
              onPress={() => void toggleListening()}
            >
              <Ionicons name={isListening ? "stop-circle" : "mic-outline"} size={22} color={colors.ink} />
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {preview ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Detected shipment</Text>
              <Text style={styles.previewText}>{preview}</Text>
              {missing.length ? (
                <Text style={styles.previewMissing}>Still needed: {missing.join(", ")}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              disabled={loading}
              onPress={() => void (draft ? handleApply() : handleExtract())}
            >
              {loading ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <>
                  <Ionicons name={draft ? "checkmark-circle-outline" : "sparkles-outline"} size={18} color={colors.ink} />
                  <Text style={styles.primaryBtnText}>{draft ? "Apply to form" : "Analyze with AI"}</Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: 12,
    ...shadow.card,
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: colors.muted,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.inputFill,
    padding: 12,
    gap: 10,
  },
  input: {
    minHeight: 96,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 21,
  },
  micBtn: {
    alignSelf: "flex-end",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.ink,
  },
  error: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B45309",
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvasMuted,
    padding: 14,
    gap: 6,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.muted,
  },
  previewText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
    lineHeight: 20,
  },
  previewMissing: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.muted,
  },
  primaryBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  primaryBtnDisabled: {
    opacity: 0.75,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
});
