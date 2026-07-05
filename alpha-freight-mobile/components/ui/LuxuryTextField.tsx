import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors, radius } from "@/lib/theme";

type LuxuryTextFieldProps = TextInputProps & {
  label: string;
  containerStyle?: ViewStyle;
};

export default function LuxuryTextField({
  label,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: LuxuryTextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedLight}
        style={[styles.input, focused && styles.inputFocused, style]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.muted,
  },
  labelFocused: {
    color: colors.inkSoft,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
  },
  inputFocused: {
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
});
