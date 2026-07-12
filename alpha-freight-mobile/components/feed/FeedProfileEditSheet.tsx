import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import {
  normalizeFeedProfileLink,
  updateFeedProfileDetails,
} from "@/lib/feed-profile";
import { colors, radius, spacing } from "@/lib/theme";

export type FeedProfileEditSheetRef = {
  open: (input: { userId: string; bio: string; link: string }) => void;
  close: () => void;
};

type FeedProfileEditSheetProps = {
  onSaved?: (input: { bio: string; link: string }) => void;
};

const FeedProfileEditSheet = forwardRef<FeedProfileEditSheetRef, FeedProfileEditSheetProps>(
  ({ onSaved }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const [userId, setUserId] = useState("");
    const [bio, setBio] = useState("");
    const [link, setLink] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const snapPoints = useMemo(() => ["52%"], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
      ),
      []
    );

    useImperativeHandle(ref, () => ({
      open: (input) => {
        setUserId(input.userId);
        setBio(input.bio);
        setLink(input.link);
        setError(null);
        sheetRef.current?.present();
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    const handleSave = useCallback(async () => {
      if (!userId || saving) return;
      setSaving(true);
      setError(null);

      try {
        const result = await updateFeedProfileDetails(userId, {
          bio,
          link: normalizeFeedProfileLink(link),
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        onSaved?.({ bio: bio.trim(), link: normalizeFeedProfileLink(link) });
        sheetRef.current?.dismiss();
      } finally {
        setSaving(false);
      }
    }, [bio, link, onSaved, saving, userId]);

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Edit profile</Text>
          <Text style={styles.subtitle}>Bio and link show on your feed profile.</Text>

          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Ionicons name="document-text-outline" size={16} color={colors.ink} />
              <Text style={styles.fieldLabel}>Bio</Text>
            </View>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the network about your fleet or loads..."
              placeholderTextColor={colors.mutedLight}
              style={[styles.fieldInput, styles.bioInput]}
              multiline
              maxLength={160}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Ionicons name="link-outline" size={16} color={colors.ink} />
              <Text style={styles.fieldLabel}>Link</Text>
            </View>
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={colors.mutedLight}
              style={styles.fieldInput}
              autoCapitalize="none"
              keyboardType="url"
              maxLength={200}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, saving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

FeedProfileEditSheet.displayName = "FeedProfileEditSheet";

export default FeedProfileEditSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.white,
  },
  handle: {
    backgroundColor: colors.border,
    width: 44,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.canvas,
  },
  bioInput: {
    minHeight: 96,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  saveBtn: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
