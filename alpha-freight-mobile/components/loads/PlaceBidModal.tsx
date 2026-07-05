import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type PlaceBidModalProps = {
  visible: boolean;
  loadCode: string;
  routeLabel: string;
  listedPrice: number;
  listedPriceLabel: string;
  defaultAmount?: string;
  loading?: boolean;
  success?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (amount: string) => void;
};

export default function PlaceBidModal({
  visible,
  loadCode,
  routeLabel,
  listedPrice,
  listedPriceLabel,
  defaultAmount = "",
  loading = false,
  success = false,
  error = null,
  onCancel,
  onSubmit,
}: PlaceBidModalProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setAmount(defaultAmount);
    scale.setValue(0.96);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [defaultAmount, opacity, scale, visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel}>
        <Animated.View style={[styles.backdropFill, { opacity }]} />
      </Pressable>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="hammer-outline" size={24} color={colors.ink} />
          </View>

          {success ? (
            <>
              <Text style={styles.title}>Bid submitted</Text>
              <Text style={styles.message}>
                The supplier will review your offer. Track updates on My Bids.
              </Text>
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.successText}>Offer sent successfully</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Place your bid</Text>
              <Text style={styles.message}>
                Submit an offer for {loadCode}. Listed rate is {listedPriceLabel}.
              </Text>
              <Text style={styles.route} numberOfLines={2}>
                {routeLabel}
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>£</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder={listedPrice > 0 ? String(listedPrice) : "0"}
                  placeholderTextColor={colors.mutedLight}
                  style={styles.input}
                  editable={!loading}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  disabled={loading}
                  onPress={onCancel}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    loading && styles.btnDisabled,
                    pressed && !loading && styles.pressed,
                  ]}
                  disabled={loading}
                  onPress={() => onSubmit(amount)}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Submit bid</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  backdropFill: {
    flex: 1,
    backgroundColor: "rgba(21,27,36,0.45)",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.muted,
  },
  route: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputFill,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: 4,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.88,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: "rgba(5,150,105,0.08)",
    borderRadius: radius.lg,
  },
  successText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.success,
  },
});
