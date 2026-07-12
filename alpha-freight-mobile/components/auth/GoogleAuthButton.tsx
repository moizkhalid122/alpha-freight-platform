import { ActivityIndicator, Image, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "@/lib/theme";

type GoogleAuthButtonProps = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function GoogleAuthButton({
  label,
  loading = false,
  disabled = false,
  onPress,
}: GoogleAuthButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        (pressed || loading) && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.black} />
      ) : (
        <>
          <Image source={require("@/assets/google-icon.png")} style={styles.icon} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 54,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonPressed: {
    backgroundColor: colors.inputFill,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
    letterSpacing: 0.1,
  },
});
