import { ActivityIndicator, Image, Modal, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

type AuthBusyOverlayProps = {
  visible: boolean;
  message: string;
};

export default function AuthBusyOverlay({ visible, message }: AuthBusyOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
          <ActivityIndicator size="small" color={colors.black} style={styles.spinner} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 280,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
  },
  spinner: {
    marginTop: spacing.md,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 15,
    fontWeight: "600",
    color: colors.black,
    textAlign: "center",
  },
});
