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
import { SupplierProfileData, SupplierProfileEditPayload, updateSupplierProfile } from "@/lib/supplier-profile";
import { colors, radius, spacing } from "@/lib/theme";

export type EditSupplierProfileSheetRef = {
  open: (profile: SupplierProfileData) => void;
  close: () => void;
};

type EditSupplierProfileSheetProps = {
  onSaved?: (profile: SupplierProfileData) => void;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  multiline?: boolean;
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
        multiline={multiline}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      />
    </View>
  );
}

const EditSupplierProfileSheet = forwardRef<EditSupplierProfileSheetRef, EditSupplierProfileSheetProps>(
  ({ onSaved }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const [form, setForm] = useState<SupplierProfileEditPayload>({
      fullName: "",
      companyName: "",
      phone: "",
      address: "",
      taxId: "",
      industry: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const snapPoints = useMemo(() => ["90%"], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
      ),
      []
    );

    useImperativeHandle(ref, () => ({
      open(profile) {
        setForm({
          fullName: profile.fullName === "Supplier" ? "" : profile.fullName,
          companyName:
            profile.companyName === profile.fullName || profile.companyName === "Supplier Account"
              ? ""
              : profile.companyName,
          phone: profile.phone === "Not provided" ? "" : profile.phone,
          address: profile.address === "Not provided" ? "" : profile.address,
          taxId: profile.taxId === "Not provided" ? "" : profile.taxId,
          industry: profile.industry === "Not specified" ? "" : profile.industry,
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
        const updated = await updateSupplierProfile(form);
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
            <Text style={styles.title}>Edit company details</Text>
            <Text style={styles.subtitle}>
              Update the information shown on your supplier profile and load listings.
            </Text>
          </View>

          <Field
            label="Full name"
            value={form.fullName}
            onChangeText={(fullName) => setForm((current) => ({ ...current, fullName }))}
            placeholder="Contact person"
          />
          <Field
            label="Company name"
            value={form.companyName}
            onChangeText={(companyName) => setForm((current) => ({ ...current, companyName }))}
            placeholder="Legal company name"
          />
          <Field
            label="Phone"
            value={form.phone}
            onChangeText={(phone) => setForm((current) => ({ ...current, phone }))}
            placeholder="+44 7700 900077"
            keyboardType="phone-pad"
          />
          <Field
            label="Tax ID / VAT number"
            value={form.taxId}
            onChangeText={(taxId) => setForm((current) => ({ ...current, taxId }))}
            placeholder="GB123456789"
          />
          <Field
            label="Industry"
            value={form.industry}
            onChangeText={(industry) => setForm((current) => ({ ...current, industry }))}
            placeholder="e.g. Manufacturing, Retail"
          />
          <Field
            label="Company address"
            value={form.address}
            onChangeText={(address) => setForm((current) => ({ ...current, address }))}
            placeholder="Registered business address"
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, saving && styles.saveBtnDisabled]}
            disabled={saving}
            onPress={() => void handleSave()}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save changes</Text>
            )}
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

EditSupplierProfileSheet.displayName = "EditSupplierProfileSheet";

export default EditSupplierProfileSheet;

const styles = StyleSheet.create({
  handle: {
    backgroundColor: colors.border,
    width: 44,
  },
  sheetBackground: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  header: {
    gap: 6,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
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
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.inputFill,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  fieldInputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  error: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  saveBtn: {
    marginTop: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 14,
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
    opacity: 0.88,
  },
});
