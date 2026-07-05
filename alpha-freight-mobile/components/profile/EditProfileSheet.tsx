import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { CarrierProfileData, CarrierProfileEditPayload, updateCarrierProfile } from "@/lib/carrier-profile";
import { colors, radius, spacing } from "@/lib/theme";

export type EditProfileSheetRef = {
  open: (profile: CarrierProfileData) => void;
  close: () => void;
};

type EditProfileSheetProps = {
  onSaved?: (profile: CarrierProfileData) => void;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedLight}
        keyboardType={keyboardType}
        style={styles.fieldInput}
      />
    </View>
  );
}

const EditProfileSheet = forwardRef<EditProfileSheetRef, EditProfileSheetProps>(({ onSaved }, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [form, setForm] = useState<CarrierProfileEditPayload>({
    fullName: "",
    companyName: "",
    phone: "",
    address: "",
    operatorId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapPoints = useMemo(() => ["88%"], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    []
  );

  useImperativeHandle(ref, () => ({
    open(profile) {
      setForm({
        fullName: profile.fullName === "Carrier" ? "" : profile.fullName,
        companyName: profile.companyName === profile.fullName ? "" : profile.companyName,
        phone: profile.phone === "Not provided" ? "" : profile.phone,
        address: profile.address === "Not provided" ? "" : profile.address,
        operatorId: profile.operatorId === "Not provided" ? "" : profile.operatorId,
      });
      setError(null);
      sheetRef.current?.present();
    },
    close() {
      sheetRef.current?.dismiss();
    },
  }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCarrierProfile(form);
      if (!updated) {
        setError("Unable to update profile. Please sign in again.");
        return;
      }
      onSaved?.(updated);
      sheetRef.current?.dismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit profile</Text>
          <Text style={styles.subtitle}>Update your carrier details for the UK marketplace.</Text>
        </View>

        <Field
          label="Full name"
          value={form.fullName}
          onChangeText={(fullName) => setForm((current) => ({ ...current, fullName }))}
          placeholder="Your name"
        />
        <Field
          label="Company name"
          value={form.companyName}
          onChangeText={(companyName) => setForm((current) => ({ ...current, companyName }))}
          placeholder="Fleet or company name"
        />
        <Field
          label="Phone"
          value={form.phone}
          onChangeText={(phone) => setForm((current) => ({ ...current, phone }))}
          placeholder="+44 7700 900000"
          keyboardType="phone-pad"
        />
        <Field
          label="Base address"
          value={form.address}
          onChangeText={(address) => setForm((current) => ({ ...current, address }))}
          placeholder="City or depot address"
        />
        <Field
          label="Operator ID"
          value={form.operatorId}
          onChangeText={(operatorId) => setForm((current) => ({ ...current, operatorId }))}
          placeholder="UK operator licence ID"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <Text style={styles.saveText}>Save changes</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.ink} />
            </>
          )}
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

EditProfileSheet.displayName = "EditProfileSheet";

export default EditProfileSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
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
  header: {
    gap: 6,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  fieldInput: {
    backgroundColor: colors.inputFill,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  saveBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
