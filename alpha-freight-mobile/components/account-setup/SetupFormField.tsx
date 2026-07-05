import { ReactNode } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radius } from "@/lib/theme";

type SetupFormFieldProps = TextInputProps & {
  label: string;
  optional?: boolean;
};

export function SetupFormField({ label, optional, style, ...props }: SetupFormFieldProps) {
  return (
    <View style={styles.fieldShell}>
      <Text style={styles.fieldLabel}>
        {label}
        {optional ? " (Optional)" : ""}
      </Text>
      <TextInput
        placeholderTextColor={colors.mutedLight}
        style={[styles.fieldInput, style]}
        {...props}
      />
    </View>
  );
}

export function SetupStaticField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.fieldShell}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.staticValue}>{children}</View>
    </View>
  );
}

export function SetupStepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.headerBlock}>
      <Text style={styles.stepTitle}>{title}</Text>
      {subtitle ? <Text style={styles.stepSub}>{subtitle}</Text> : null}
    </View>
  );
}

export const setupFormStyles = StyleSheet.create({
  headerBlock: {
    marginBottom: 18,
    marginTop: 4,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.7,
    lineHeight: 32,
  },
  stepSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: colors.muted,
  },
  fieldShell: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 11,
    minHeight: 58,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedLight,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    padding: 0,
    minHeight: 22,
  },
  staticValue: {
    minHeight: 22,
    justifyContent: "center",
  },
});

const styles = setupFormStyles;
