import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReplyMoreOptionsSheet from "@/components/ai/ReplyMoreOptionsSheet";
import { colors } from "@/lib/theme";

const COPY_RESET_MS = 1800;
const ACTION_ICON_SIZE = 18;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function ActionIconButton({
  onPress,
  accessibilityLabel,
  icon,
  color,
}: {
  onPress: () => void | Promise<void>;
  accessibilityLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
      onPress={() => void onPress()}
      hitSlop={8}
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={ACTION_ICON_SIZE} color={color} />
    </Pressable>
  );
}

function CopyActionButton({ onCopy }: { onCopy: () => void | Promise<void> }) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handlePress = useCallback(async () => {
    await Promise.resolve(onCopy());
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCopied(true);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCopied(false);
    }, COPY_RESET_MS);
  }, [onCopy]);

  return (
    <ActionIconButton
      onPress={handlePress}
      accessibilityLabel="Copy reply"
      icon={copied ? "checkmark-outline" : "copy-outline"}
      color={copied ? colors.ink : colors.mutedLight}
    />
  );
}

export type AssistantReplyContent = {
  title?: string;
  sectionLabel?: string;
  bullets?: string[];
  footer?: string;
};

type ReplySegment = {
  id: string;
  kind: "title" | "section" | "bullet" | "footer";
  text: string;
};

function buildSegments(content: AssistantReplyContent): ReplySegment[] {
  const segments: ReplySegment[] = [];

  if (content.title) {
    segments.push({ id: "title", kind: "title", text: content.title });
  }
  if (content.sectionLabel) {
    segments.push({ id: "section", kind: "section", text: content.sectionLabel });
  }
  (content.bullets || []).forEach((bullet, index) => {
    segments.push({ id: `bullet-${index}`, kind: "bullet", text: bullet });
  });
  if (content.footer) {
    segments.push({ id: "footer", kind: "footer", text: content.footer });
  }

  return segments;
}

const CHARS_PER_TICK = 4;
const TICK_MS = 4;

function getCharDelay(_char: string) {
  return TICK_MS;
}

function useTypewriter(segments: ReplySegment[], enabled: boolean, segmentKey: string) {
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setIsComplete(true);
      return;
    }

    setSegmentIndex(0);
    setCharIndex(0);
    setIsComplete(false);
  }, [enabled, segmentKey]);

  useEffect(() => {
    if (!enabled || isComplete) return;

    if (segmentIndex >= segments.length) {
      setIsComplete(true);
      return;
    }

    const segment = segments[segmentIndex];
    if (charIndex >= segment.text.length) {
      setSegmentIndex((value) => value + 1);
      setCharIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      setCharIndex((value) => Math.min(value + CHARS_PER_TICK, segment.text.length));
    }, getCharDelay(segment.text[charIndex]));

    return () => clearTimeout(timer);
  }, [charIndex, enabled, isComplete, segmentIndex, segments]);

  const visibleSegments = useMemo(() => {
    if (!enabled || isComplete) return segments;

    return segments.map((segment, index) => {
      if (index < segmentIndex) return segment;
      if (index > segmentIndex) return { ...segment, text: "" };
      return { ...segment, text: segment.text.slice(0, charIndex) };
    });
  }, [charIndex, enabled, isComplete, segmentIndex, segments]);

  const activeSegmentId =
    !enabled || isComplete ? null : segments[segmentIndex]?.id ?? null;

  return {
    segments: visibleSegments,
    isComplete,
    isTyping: enabled && !isComplete,
    activeSegmentId,
  };
}

type Feedback = "like" | "dislike" | null;

function ReplyActionBar({
  feedback,
  replyText,
  onFeedbackChange,
  onCopy,
  onRegenerate,
}: {
  feedback: Feedback;
  replyText: string;
  onFeedbackChange: (value: Feedback) => void;
  onCopy: () => void | Promise<void>;
  onRegenerate?: () => void;
}) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const iconColor = colors.mutedLight;

  return (
    <>
      <View style={styles.actionBar}>
        <CopyActionButton onCopy={onCopy} />

        <ActionIconButton
          onPress={() => onFeedbackChange(feedback === "like" ? null : "like")}
          accessibilityLabel="Helpful reply"
          icon={feedback === "like" ? "thumbs-up" : "thumbs-up-outline"}
          color={feedback === "like" ? colors.inkSoft : iconColor}
        />

        <ActionIconButton
          onPress={() => onFeedbackChange(feedback === "dislike" ? null : "dislike")}
          accessibilityLabel="Not helpful reply"
          icon={feedback === "dislike" ? "thumbs-down" : "thumbs-down-outline"}
          color={feedback === "dislike" ? colors.inkSoft : iconColor}
        />

        {onRegenerate ? (
          <ActionIconButton
            onPress={onRegenerate}
            accessibilityLabel="Regenerate reply"
            icon="refresh-outline"
            color={iconColor}
          />
        ) : null}

        <ActionIconButton
          onPress={() => setShowMoreOptions(true)}
          accessibilityLabel="More options"
          icon="ellipsis-horizontal"
          color={iconColor}
        />
      </View>

      <ReplyMoreOptionsSheet
        visible={showMoreOptions}
        replyText={replyText}
        onClose={() => setShowMoreOptions(false)}
        onCopy={onCopy}
      />
    </>
  );
}

function TypingCursor({ muted = false }: { muted?: boolean }) {
  return <Text style={muted ? styles.cursorMuted : styles.cursor}>|</Text>;
}

type TypewriterAssistantReplyProps = {
  content: AssistantReplyContent;
  animate?: boolean;
  onCopy: () => void;
  onTyping?: () => void;
  onRegenerate?: () => void;
};

export default function TypewriterAssistantReply({
  content,
  animate = false,
  onCopy,
  onTyping,
  onRegenerate,
}: TypewriterAssistantReplyProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const segmentKey = useMemo(
    () =>
      JSON.stringify({
        title: content.title,
        sectionLabel: content.sectionLabel,
        bullets: content.bullets,
        footer: content.footer,
      }),
    [content.title, content.sectionLabel, content.bullets, content.footer]
  );
  const fullSegments = useMemo(() => buildSegments(content), [segmentKey]);
  const replyText = useMemo(
    () =>
      [
        content.title,
        content.sectionLabel,
        ...(content.bullets || []),
        content.footer,
      ]
        .filter(Boolean)
        .join("\n"),
    [content.title, content.sectionLabel, content.bullets, content.footer]
  );
  const { segments, isComplete, isTyping, activeSegmentId } = useTypewriter(
    fullSegments,
    animate,
    segmentKey
  );

  useEffect(() => {
    if (isTyping) onTyping?.();
  }, [isTyping, segments, onTyping]);

  const showActions = isComplete || !animate;

  return (
    <View style={styles.block}>
      {segments.map((segment) => {
        const showCursor = isTyping && activeSegmentId === segment.id;
        const hasText = segment.text.length > 0;

        if (segment.kind === "title") {
          if (!hasText && !showCursor) return null;
          return (
            <View key={segment.id} style={styles.titleRow}>
              <View style={styles.dot} />
              <Text style={styles.title}>
                {segment.text}
                {showCursor ? <TypingCursor /> : null}
              </Text>
            </View>
          );
        }

        if (!hasText && !showCursor) return null;

        if (segment.kind === "section") {
          return (
            <Text key={segment.id} style={styles.section}>
              {segment.text}
              {showCursor ? <TypingCursor muted /> : null}
            </Text>
          );
        }

        if (segment.kind === "bullet") {
          return (
            <View key={segment.id} style={styles.bulletRow}>
              <Text style={styles.bulletMark}>•</Text>
              <Text style={styles.bulletText}>
                {segment.text}
                {showCursor ? <TypingCursor muted /> : null}
              </Text>
            </View>
          );
        }

        return (
          <Text key={segment.id} style={styles.footer}>
            {segment.text}
            {showCursor ? <TypingCursor muted /> : null}
          </Text>
        );
      })}

      {showActions ? (
        <ReplyActionBar
          feedback={feedback}
          replyText={replyText}
          onFeedbackChange={setFeedback}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnPressed: {
    opacity: 0.55,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ink,
    marginTop: 7,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  section: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#737373",
    marginLeft: 18,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 18,
    paddingRight: 8,
  },
  bulletMark: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    fontWeight: "700",
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    color: colors.ink,
  },
  footer: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.muted,
    marginLeft: 18,
    marginTop: 4,
  },
  cursor: {
    color: colors.ink,
    fontWeight: "300",
    opacity: 0.55,
  },
  cursorMuted: {
    color: colors.muted,
    fontWeight: "300",
    opacity: 0.55,
  },
});
